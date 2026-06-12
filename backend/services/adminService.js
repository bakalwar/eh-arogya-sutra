'use strict';

const os = require('os');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { getPostgresModels } = require('../utils/dataSource');
const { sequelize } = require('../db/sequelize');
const { getPostgresHealth, pingPostgres } = require('../db/postgres.init');
const { checkEHEngineHealth } = require('./ehEngineService');
const { generateTempPassword } = require('../utils/passwordGen');
const { normalizeMobile } = require('../utils/mobile');
const {
  getSetting,
  setSetting,
  doctorToApi,
  updateDoctor,
  getRevenueStats
} = require('./superAdminService');

async function getDashboardStats() {
  const { UserPg, PrescriptionPg } = getPostgresModels();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalDoctors, activeToday, pendingVerify] = await Promise.all([
    UserPg.count({ where: { role: 'doctor' } }),
    UserPg.count({
      where: {
        role: 'doctor',
        last_login_at: { [Op.gte]: today }
      }
    }),
    UserPg.count({
      where: {
        role: 'doctor',
        [Op.or]: [
          { registration_number: null },
          { registration_number: '' },
          { subscription_status: 'pending' }
        ],
        is_suspended: false
      }
    })
  ]);

  let totalRevenue = 0;
  try {
    const [rows] = await sequelize.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status = 'paid'`
    );
    totalRevenue = Number(rows[0]?.total) || 0;
  } catch {
    /* payments table may be missing */
  }

  return {
    totalDoctors,
    activeToday,
    totalRevenue,
    pendingVerify
  };
}

async function getSystemStatus() {
  const pgHealth = getPostgresHealth();
  let dbConnected = false;
  if (pgHealth.enabled) {
    dbConnected = await pingPostgres();
  }

  const ehEngine = await checkEHEngineHealth();

  let activeUsers = 0;
  try {
    const since = new Date(Date.now() - 15 * 60 * 1000);
    activeUsers = await getPostgresModels().UserPg.count({
      where: { last_login_at: { [Op.gte]: since } }
    });
  } catch {
    activeUsers = 0;
  }

  const loadAvg = os.loadavg?.()[0] ?? 0;
  const serverLoad = Math.min(100, Math.round(loadAvg * 25));

  return {
    backend: { status: 'online', label: 'Online' },
    database: {
      status: dbConnected ? 'online' : pgHealth.enabled ? 'offline' : 'disabled',
      label: dbConnected ? 'Connected' : pgHealth.enabled ? 'Disconnected' : 'Not configured'
    },
    ehEngines: {
      status: ehEngine.online ? 'online' : 'offline',
      label: ehEngine.online ? 'Active' : 'Offline'
    },
    storage: { usedPercent: 45, label: '45% used' },
    activeUsers,
    serverLoad
  };
}

async function getDoctorDetail(id) {
  const { UserPg, PatientPg, PrescriptionPg, AuditLogPg } = getPostgresModels();
  const user = await UserPg.findByPk(id);
  if (!user || user.get('role') !== 'doctor') return null;

  const [patientCount, prescriptionCount, loginHistory, subscriptions] = await Promise.all([
    PatientPg.count({ where: { doctor_id: id } }),
    PrescriptionPg.count({ where: { doctor_id: id } }),
    AuditLogPg.findAll({
      where: { user_id: id, action: 'login.success' },
      order: [['created_at', 'DESC']],
      limit: 20
    }),
    sequelize.query(
      `SELECT * FROM subscriptions WHERE doctor_id = :id ORDER BY created_at DESC LIMIT 10`,
      { replacements: { id } }
    ).then(([rows]) => rows).catch(() => [])
  ]);

  const plain = user.get({ plain: true });
  return {
    ...doctorToApi(user),
    personal: {
      name: plain.full_name || plain.name,
      mobile: plain.mobile,
      email: plain.email,
      city: plain.clinic_address_city || plain.address_city,
      state: plain.clinic_address_state || plain.address_state
    },
    license: {
      registrationNumber: plain.registration_number || '—',
      authority: plain.registration_authority || '—',
      validUntil: plain.registration_valid,
      primaryDegree: plain.primary_degree
    },
    subscriptionHistory: subscriptions,
    loginHistory: loginHistory.map((l) => ({
      time: l.get('created_at'),
      ip: l.get('meta')?.ip || '—',
      method: l.get('meta')?.method || 'password'
    })),
    patientCount,
    prescriptionCount
  };
}

async function verifyDoctor(id) {
  const { UserPg } = getPostgresModels();
  const user = await UserPg.findByPk(id);
  if (!user || user.get('role') !== 'doctor') return null;
  await user.update({
    subscription_status: 'active',
    profile_completed: true
  });
  return doctorToApi(user);
}

async function blockDoctor(id, blocked = true) {
  return updateDoctor(id, { isSuspended: blocked, subscriptionStatus: blocked ? 'suspended' : 'active' });
}

async function changeDoctorPlan(id, plan) {
  return updateDoctor(id, { plan, subscriptionStatus: 'active' });
}

async function deleteDoctor(id) {
  const { UserPg } = getPostgresModels();
  const user = await UserPg.findByPk(id);
  if (!user || user.get('role') !== 'doctor') return false;
  await user.update({ is_suspended: true, subscription_status: 'cancelled' });
  return true;
}

async function resetDoctorPassword(id) {
  const { UserPg } = getPostgresModels();
  const user = await UserPg.findByPk(id);
  if (!user || user.get('role') !== 'doctor') return null;
  const password = generateTempPassword(8);
  const password_hash = await bcrypt.hash(password, 10);
  await user.update({
    password_hash,
    must_change_password: true,
    failed_login_attempts: 0,
    locked_until: null
  });
  return {
    message: 'Password reset. Share this once with the doctor via WhatsApp or call.',
    password,
    mobile: user.get('mobile')
  };
}

async function createDoctor({ name, mobile, city, license }) {
  const { UserPg } = getPostgresModels();
  const mobileNorm = normalizeMobile(mobile);
  if (!mobileNorm || mobileNorm.length !== 10) {
    const err = new Error('Valid 10-digit mobile required.');
    err.status = 400;
    throw err;
  }
  if (!name || !String(name).trim()) {
    const err = new Error('Doctor name is required.');
    err.status = 400;
    throw err;
  }

  const existing = await UserPg.findOne({ where: { mobile: mobileNorm } });
  if (existing) {
    const err = new Error('Mobile number already registered.');
    err.status = 409;
    throw err;
  }

  const password = generateTempPassword(8);
  const password_hash = await bcrypt.hash(password, 10);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const user = await UserPg.create({
    name: String(name).trim(),
    full_name: String(name).trim(),
    mobile: mobileNorm,
    role: 'doctor',
    password_hash,
    must_change_password: true,
    clinic_address_city: city ? String(city).trim() : null,
    address_city: city ? String(city).trim() : null,
    registration_number: license ? String(license).trim() : null,
    subscription_status: 'trial',
    trial_ends_at: trialEnds,
    profile_completed: false
  });

  return {
    doctor: doctorToApi(user),
    password,
    message: 'Doctor created. Share this password once via WhatsApp or call — doctor must change it on first login.'
  };
}

async function getDoctorLoginHistory(id, limit = 30) {
  const { UserPg, AuditLogPg } = getPostgresModels();
  const user = await UserPg.findByPk(id);
  if (!user || user.get('role') !== 'doctor') return null;

  const logs = await AuditLogPg.findAll({
    where: { user_id: id, action: 'login.success' },
    order: [['created_at', 'DESC']],
    limit: Math.min(Number(limit) || 30, 100)
  });

  return logs.map((l) => ({
    time: l.get('created_at'),
    ip: l.get('meta')?.ip || '—',
    method: l.get('meta')?.method || 'password'
  }));
}

async function getActivityLog(limit = 10) {
  const { AuditLogPg, UserPg } = getPostgresModels();
  const logs = await AuditLogPg.findAll({
    order: [['created_at', 'DESC']],
    limit: Math.min(Number(limit) || 10, 50)
  });
  const userIds = [...new Set(logs.map((l) => l.get('user_id')).filter(Boolean))];
  const users = userIds.length
    ? await UserPg.findAll({ where: { id: userIds } })
    : [];
  const nameMap = Object.fromEntries(
    users.map((u) => [String(u.id), u.get('full_name') || u.get('name')])
  );

  return logs.map((l) => {
    const row = l.get({ plain: true });
    return {
      id: String(row.id),
      action: row.action,
      user: nameMap[String(row.user_id)] || 'System',
      time: row.created_at,
      meta: row.meta
    };
  });
}

async function getRevenueAnalytics() {
  const stats = await getRevenueStats();
  const monthly = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    let amount = 0;
    try {
      const [rows] = await sequelize.query(
        `SELECT COALESCE(SUM(amount),0) AS total FROM payments
         WHERE status = 'paid' AND created_at >= :start AND created_at < :end`,
        { replacements: { start, end } }
      );
      amount = Number(rows[0]?.total) || 0;
    } catch {
      amount = 0;
    }
    monthly.push({
      month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      revenue: amount
    });
  }

  const thisMonth = monthly[monthly.length - 1]?.revenue || 0;
  const lastMonth = monthly[monthly.length - 2]?.revenue || 0;
  const growth = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  return {
    totalRevenue: stats.summary?.total || stats.summary?.year || 0,
    thisMonth,
    growthPercent: growth,
    monthlyChart: monthly,
    recentPayments: stats.payments || []
  };
}

async function listCoupons() {
  try {
    const [rows] = await sequelize.query(
      `SELECT * FROM coupons ORDER BY created_at DESC LIMIT 100`
    );
    return rows.map((r) => ({
      id: String(r.id),
      code: r.code,
      discount: r.discount_percent,
      used: r.uses_count,
      maxUses: r.max_uses,
      expiry: r.valid_until,
      isActive: r.is_active
    }));
  } catch {
    return [];
  }
}

async function createCoupon({ code, discountPercent, validUntil, maxUses = 100 }) {
  const [rows] = await sequelize.query(
    `INSERT INTO coupons (code, discount_percent, valid_until, max_uses)
     VALUES (:code, :discount, :validUntil, :maxUses)
     RETURNING *`,
    {
      replacements: {
        code: String(code).trim().toUpperCase(),
        discount: Number(discountPercent),
        validUntil: validUntil || null,
        maxUses: Number(maxUses) || 100
      }
    }
  );
  const r = rows[0];
  return {
    id: String(r.id),
    code: r.code,
    discount: r.discount_percent,
    used: r.uses_count,
    expiry: r.valid_until
  };
}

async function getAdminSettings() {
  const [pricing, referral, branding, maintenance] = await Promise.all([
    getSetting('pricing', { basicMonthly: 699, proMonthly: 1499, basicPatientLimit: 100 }),
    getSetting('referral_rules', { 10: 1, 20: 3, 30: 6, 50: 12, 100: 'lifetime' }),
    getSetting('branding', { appName: 'E.H. Arogya Sutra' }),
    getSetting('maintenance', { enabled: false, message: '' })
  ]);

  const announcements = await getSetting('announcement_banner', { text: '' });

  return {
    appName: branding.appName || 'E.H. Arogya Sutra',
    referralRules: referral,
    maxPatientsBasic: pricing.basicPatientLimit || 100,
    maintenanceMode: !!maintenance.enabled,
    maintenanceMessage: maintenance.message || '',
    announcementBanner: announcements.text || '',
    pricing
  };
}

async function updateAdminSettings(patch) {
  if (patch.appName != null || patch.announcementBanner != null) {
    const branding = await getSetting('branding', {});
    if (patch.appName != null) branding.appName = patch.appName;
    await setSetting('branding', branding);
    if (patch.announcementBanner != null) {
      await setSetting('announcement_banner', { text: patch.announcementBanner });
    }
  }
  if (patch.referralRules) await setSetting('referral_rules', patch.referralRules);
  if (patch.maxPatientsBasic != null) {
    const pricing = await getSetting('pricing', {});
    pricing.basicPatientLimit = Number(patch.maxPatientsBasic);
    await setSetting('pricing', pricing);
  }
  if (patch.maintenanceMode != null || patch.maintenanceMessage != null) {
    const maintenance = await getSetting('maintenance', {});
    if (patch.maintenanceMode != null) maintenance.enabled = !!patch.maintenanceMode;
    if (patch.maintenanceMessage != null) maintenance.message = patch.maintenanceMessage;
    await setSetting('maintenance', maintenance);
  }
  if (patch.pricing) {
    const pricing = await getSetting('pricing', {});
    await setSetting('pricing', { ...pricing, ...patch.pricing });
  }
  return getAdminSettings();
}

async function listDoctorsFiltered(query = {}) {
  const { UserPg } = getPostgresModels();
  const conditions = [{ role: 'doctor' }];
  const filter = (query.filter || query.status || '').toLowerCase();

  if (filter === 'pending') {
    conditions.push({
      [Op.or]: [
        { registration_number: null },
        { registration_number: '' },
        { subscription_status: 'pending' }
      ]
    });
  } else if (filter === 'active') {
    conditions.push({ is_suspended: false, subscription_status: 'active' });
  } else if (filter === 'blocked') {
    conditions.push({ is_suspended: true });
  } else if (['trial', 'basic', 'pro'].includes(filter)) {
    conditions.push({ plan: filter });
  } else if (query.plan) {
    conditions.push({ plan: query.plan });
  }

  const q = (query.search || '').trim();
  if (q) {
    conditions.push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${q}%` } },
        { full_name: { [Op.iLike]: `%${q}%` } },
        { mobile: { [Op.iLike]: `%${q}%` } },
        { clinic_address_city: { [Op.iLike]: `%${q}%` } },
        { address_city: { [Op.iLike]: `%${q}%` } }
      ]
    });
  }

  const doctors = await UserPg.findAll({
    where: { [Op.and]: conditions },
    order: [['created_at', 'DESC']],
    limit: 200
  });

  return doctors.map((u) => {
    const api = doctorToApi(u);
    const plain = u.get({ plain: true });
    return {
      ...api,
      license: plain.registration_number || 'Pending',
      status: plain.is_suspended
        ? 'Blocked'
        : plain.subscription_status === 'pending' || !plain.registration_number
          ? 'Pending'
          : 'Active',
      joined: plain.created_at
    };
  });
}

module.exports = {
  getDashboardStats,
  getSystemStatus,
  listDoctors: listDoctorsFiltered,
  getDoctorDetail,
  verifyDoctor,
  blockDoctor,
  changeDoctorPlan,
  deleteDoctor,
  resetDoctorPassword,
  createDoctor,
  getDoctorLoginHistory,
  getActivityLog,
  getRevenueAnalytics,
  listCoupons,
  createCoupon,
  getAdminSettings,
  updateAdminSettings
};
