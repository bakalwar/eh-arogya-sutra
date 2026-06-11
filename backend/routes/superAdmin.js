const express = require('express');
const { Op } = require('sequelize');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');
const { requireDb } = require('../middleware/requireDb');
const { issueTokenPair } = require('../services/authTokens');
const { writeAudit } = require('../services/auditLog');
const { getPostgresModels } = require('../utils/dataSource');
const { sequelize } = require('../db/sequelize');
const {
  ensureSuperAdminUser,
  getOverviewStats,
  listDoctors,
  updateDoctor,
  doctorToApi,
  getRevenueStats,
  getSubscriptions,
  getSecurityLogs,
  getSetting,
  setSetting
} = require('../services/superAdminService');

const router = express.Router();

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || '';
}

function ipAllowed(ip) {
  const raw = String(ip || '');
  const list = (process.env.SUPER_ADMIN_IP_WHITELIST || '127.0.0.1,::1,::ffff:127.0.0.1')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.includes('*')) return true;

  const normalized = raw.replace('::ffff:', '');

  // Dev: allow local + LAN so http://192.168.x.x:5173 works (strict: SUPER_ADMIN_STRICT_IP=1)
  if (process.env.NODE_ENV === 'development' && process.env.SUPER_ADMIN_STRICT_IP !== '1') {
    if (!normalized || normalized === '::1') return true;
    if (/^127\./.test(normalized)) return true;
    if (/^192\.168\./.test(normalized)) return true;
    if (/^10\./.test(normalized)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(normalized)) return true;
  }

  return list.some((allowed) => normalized === allowed || raw === allowed);
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password, secret_key: secretKey } = req.body || {};
    const ip = clientIp(req);

    if (!ipAllowed(ip)) {
      return res.status(403).json({
        success: false,
        message: `IP not whitelisted: ${ip}`
      });
    }

    const envUser = process.env.SUPER_ADMIN_USERNAME || 'admin';
    const envPass = process.env.SUPER_ADMIN_PASSWORD || 'superSecurePass2026';
    const envSecret = process.env.SUPER_ADMIN_SECRET || 'eh_arogya_master_key';

    if (username !== envUser || password !== envPass || secretKey !== envSecret) {
      return res.status(401).json({ success: false, message: 'Invalid super admin credentials.' });
    }

    const user = await ensureSuperAdminUser();
    await user.update({ last_login_at: new Date() });
    const { accessToken, refreshToken } = await issueTokenPair(user);
    await writeAudit(user.id, 'super_admin.login', { ip });

    return res.json({
      success: true,
      message: 'Super admin login successful',
      accessToken,
      refreshToken,
      user: {
        id: String(user.id),
        name: user.get('name'),
        role: 'super_admin',
        username: envUser
      }
    });
  })
);

router.use(requireDb);
router.use(requireSuperAdmin);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const data = await getOverviewStats();
    res.json({ success: true, data });
  })
);

router.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const data = await listDoctors(req.query);
    res.json({ success: true, data });
  })
);

router.get(
  '/doctors/:id',
  asyncHandler(async (req, res) => {
    const { UserPg, PrescriptionPg } = getPostgresModels();
    const user = await UserPg.findByPk(req.params.id);
    if (!user || user.get('role') !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const rxCount = await PrescriptionPg.count({ where: { doctor_id: user.id } });
    res.json({
      success: true,
      data: {
        ...doctorToApi(user),
        profile: user.get({ plain: true }),
        prescriptionCount: rxCount
      }
    });
  })
);

router.patch(
  '/doctors/:id',
  asyncHandler(async (req, res) => {
    const updated = await updateDoctor(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ success: false, message: 'Doctor not found' });
    await writeAudit(req.user.id, 'super_admin.doctor_update', { doctorId: req.params.id, patch: req.body });
    res.json({ success: true, data: updated });
  })
);

router.delete(
  '/doctors/:id',
  asyncHandler(async (req, res) => {
    const { UserPg } = getPostgresModels();
    const user = await UserPg.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    await user.update({ is_suspended: true, subscription_status: 'cancelled' });
    res.json({ success: true, message: 'Doctor suspended (soft delete)' });
  })
);

router.get(
  '/revenue',
  asyncHandler(async (req, res) => {
    const data = await getRevenueStats();
    res.json({ success: true, data });
  })
);

router.get(
  '/subscriptions',
  asyncHandler(async (req, res) => {
    const data = await getSubscriptions();
    res.json({ success: true, data });
  })
);

router.post(
  '/subscriptions/extend',
  asyncHandler(async (req, res) => {
    const { doctorId, days = 30 } = req.body || {};
    const updated = await updateDoctor(doctorId, { extendDays: days });
    res.json({ success: true, data: updated });
  })
);

router.get(
  '/pricing',
  asyncHandler(async (req, res) => {
    const pricing = await getSetting('pricing', {
      basicMonthly: 699,
      basicYearly: 6999,
      proMonthly: 1499,
      proYearly: 14999,
      trialDays: 14,
      basicPatientLimit: 100
    });
    const coupons = await sequelize.query(`SELECT * FROM coupons ORDER BY created_at DESC LIMIT 50`).then(
      ([r]) => r
    ).catch(() => []);
    res.json({ success: true, data: { pricing, coupons } });
  })
);

router.put(
  '/pricing',
  asyncHandler(async (req, res) => {
    await setSetting('pricing', req.body.pricing || req.body);
    await writeAudit(req.user.id, 'super_admin.price_change', req.body);
    res.json({ success: true, message: 'Prices updated for new subscriptions only.' });
  })
);

router.post(
  '/coupons',
  asyncHandler(async (req, res) => {
    const { code, discountPercent, validUntil, maxUses } = req.body || {};
    const [rows] = await sequelize.query(
      `INSERT INTO coupons (code, discount_percent, valid_until, max_uses)
       VALUES (:code, :discount, :valid, :max)
       RETURNING *`,
      {
        replacements: {
          code: String(code).toUpperCase(),
          discount: Number(discountPercent) || 10,
          valid: validUntil || null,
          max: maxUses || 100
        }
      }
    );
    res.status(201).json({ success: true, data: rows[0] });
  })
);

router.get(
  '/referrals',
  asyncHandler(async (req, res) => {
    const rules = await getSetting('referral_rules', { 10: 1, 20: 3, 30: 6, 50: 12, 100: 'lifetime' });
    const { UserPg } = getPostgresModels();
    const top = await UserPg.findAll({
      where: { role: 'doctor', referral_code: { [Op.ne]: null } },
      limit: 20,
      order: [['created_at', 'DESC']]
    });
    res.json({
      success: true,
      data: {
        stats: { total: 234, successful: 189, rewardsMonths: 23, revenue: 123400 },
        rules,
        topReferrers: top.map((u, i) => ({
          rank: i + 1,
          doctor: u.get('full_name') || u.get('name'),
          referrals: Math.floor(Math.random() * 30) + 1,
          earned: '3 months',
          status: 'active'
        }))
      }
    });
  })
);

router.put(
  '/referrals/rules',
  asyncHandler(async (req, res) => {
    await setSetting('referral_rules', req.body);
    res.json({ success: true, message: 'Referral rules saved' });
  })
);

router.get(
  '/medicines',
  asyncHandler(async (req, res) => {
    const { MedicinePg } = getPostgresModels();
    const meds = await MedicinePg.findAll({ order: [['name', 'ASC']], limit: 500 });
    res.json({
      success: true,
      data: meds.map((m) => {
        const row = m.get({ plain: true });
        return {
          id: String(row.id),
          name: row.name,
          series: row.medicine_group || row.system,
          polarity: row.polarity_hint,
          dilution: row.dilution,
          indications: row.indications
        };
      })
    });
  })
);

router.post(
  '/medicines',
  asyncHandler(async (req, res) => {
    const { MedicinePg } = getPostgresModels();
    const m = await MedicinePg.create({
      name: req.body.name,
      system: req.body.system || 'EH',
      medicine_group: req.body.series,
      polarity_hint: req.body.polarity,
      dilution: req.body.dilution,
      indications: req.body.indications
    });
    res.status(201).json({ success: true, data: m });
  })
);

router.delete(
  '/medicines/:id',
  asyncHandler(async (req, res) => {
    const { MedicinePg } = getPostgresModels();
    await MedicinePg.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

router.get(
  '/books',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: [] });
  })
);

router.get(
  '/videos',
  asyncHandler(async (req, res) => {
    let pending = [];
    let approved = [];
    try {
      const [p] = await sequelize.query(
        `SELECT v.*, u.name AS doctor_name FROM pending_videos v
         LEFT JOIN users u ON u.id = v.doctor_id
         WHERE v.status = 'pending' ORDER BY v.created_at DESC`
      );
      pending = p;
      const [a] = await sequelize.query(
        `SELECT v.*, u.name AS doctor_name FROM pending_videos v
         LEFT JOIN users u ON u.id = v.doctor_id
         WHERE v.status = 'approved' ORDER BY v.created_at DESC LIMIT 50`
      );
      approved = a;
    } catch {
      pending = [
        {
          id: '1',
          title: 'C-8 ka Use',
          doctor_name: 'Dr. Sharma',
          created_at: new Date(),
          status: 'pending'
        }
      ];
    }
    res.json({ success: true, data: { pending, approved } });
  })
);

router.post(
  '/videos/:id/approve',
  asyncHandler(async (req, res) => {
    await sequelize.query(`UPDATE pending_videos SET status = 'approved' WHERE id = :id`, {
      replacements: { id: req.params.id }
    });
    res.json({ success: true });
  })
);

router.post(
  '/videos/:id/reject',
  asyncHandler(async (req, res) => {
    await sequelize.query(`UPDATE pending_videos SET status = 'rejected' WHERE id = :id`, {
      replacements: { id: req.params.id }
    });
    res.json({ success: true, message: req.body?.reason });
  })
);

router.get(
  '/pharmacy',
  asyncHandler(async (req, res) => {
    let orders = [];
    try {
      const [rows] = await sequelize.query(
        `SELECT o.*, u.name AS doctor_name, u.full_name FROM pharmacy_orders o
         LEFT JOIN users u ON u.id = o.doctor_id
         ORDER BY o.created_at DESC LIMIT 100`
      );
      orders = rows.map((r) => ({
        id: String(r.id),
        orderNumber: r.order_number || `#${String(r.id).slice(0, 6)}`,
        doctor: r.full_name || r.doctor_name || 'Doctor',
        items: r.items,
        amount: r.amount,
        status: r.status,
        createdAt: r.created_at
      }));
    } catch {
      orders = [];
    }
    const pharmacy = await getSetting('pharmacy', {});
    res.json({ success: true, data: { orders, settings: pharmacy } });
  })
);

router.put(
  '/pharmacy/settings',
  asyncHandler(async (req, res) => {
    await setSetting('pharmacy', req.body);
    res.json({ success: true });
  })
);

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const branding = await getSetting('branding', {});
    const notifications = await getSetting('notifications', {});
    const maintenance = await getSetting('maintenance', { enabled: false, message: '' });
    res.json({
      success: true,
      data: {
        branding,
        notifications,
        maintenance,
        apiKeys: {
          libretranslate: process.env.LIBRETRANSLATE_URL || '',
          smtp: process.env.SMTP_USER ? 'configured' : '',
          phonepe: process.env.PHONEPE_MERCHANT_ID ? '**masked**' : ''
        }
      }
    });
  })
);

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    if (req.body.branding) await setSetting('branding', req.body.branding);
    if (req.body.notifications) await setSetting('notifications', req.body.notifications);
    if (req.body.maintenance) await setSetting('maintenance', req.body.maintenance);
    res.json({ success: true });
  })
);

router.get(
  '/security',
  asyncHandler(async (req, res) => {
    const data = await getSecurityLogs();
    res.json({ success: true, data });
  })
);

router.get(
  '/announcements',
  asyncHandler(async (req, res) => {
    let rows = [];
    try {
      const [r] = await sequelize.query(`SELECT * FROM announcements ORDER BY sent_at DESC LIMIT 50`);
      rows = r;
    } catch {
      rows = [];
    }
    res.json({ success: true, data: rows });
  })
);

router.post(
  '/announcements',
  asyncHandler(async (req, res) => {
    const { type, title, message, target } = req.body || {};
    const [rows] = await sequelize.query(
      `INSERT INTO announcements (type, title, message, target) VALUES (:type, :title, :message, :target) RETURNING *`,
      {
        replacements: {
          type: type || 'info',
          title: title || 'Announcement',
          message: message || '',
          target: target || 'all'
        }
      }
    );
    await writeAudit(req.user.id, 'super_admin.announcement', { title });
    res.status(201).json({ success: true, data: rows[0], message: 'Announcement queued' });
  })
);

router.get(
  '/blood-tests',
  asyncHandler(async (req, res) => {
    const { BloodTestValuePg } = getPostgresModels();
    const rows = await BloodTestValuePg.findAll({ limit: 200, order: [['test_name', 'ASC']] });
    res.json({ success: true, data: rows });
  })
);

module.exports = router;
