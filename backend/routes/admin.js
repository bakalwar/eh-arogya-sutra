'use strict';

const express = require('express');
const { requireAdminDb } = require('../middleware/requireDb');
const { requireAdminRole } = require('../middleware/requireAdminRole');
const { asyncHandler } = require('../utils/asyncHandler');
const { writeAudit } = require('../services/auditLog');
const adminService = require('../services/adminService');

const router = express.Router();

router.use(requireAdminDb);
router.use(requireAdminRole);

function auditAction(action) {
  return async (req, res, next) => {
    try {
      await writeAudit(req.user?.id, action, {
        ip: req.ip,
        path: req.path,
        params: req.params,
        body: req.method === 'GET' ? undefined : { ...req.body }
      });
    } catch {
      /* non-blocking */
    }
    next();
  };
}

router.get(
  '/dashboard-stats',
  asyncHandler(async (req, res) => {
    const data = await adminService.getDashboardStats();
    res.json({ success: true, data });
  })
);

router.get(
  '/system-status',
  asyncHandler(async (req, res) => {
    const data = await adminService.getSystemStatus();
    res.json({ success: true, data });
  })
);

router.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const data = await adminService.listDoctors(req.query);
    res.json({ success: true, data });
  })
);

router.get(
  '/doctors/:id',
  asyncHandler(async (req, res) => {
    const data = await adminService.getDoctorDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data });
  })
);

router.put(
  '/doctors/:id/verify',
  auditAction('admin.doctor.verify'),
  asyncHandler(async (req, res) => {
    const data = await adminService.verifyDoctor(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor verified', data });
  })
);

router.put(
  '/doctors/:id/block',
  auditAction('admin.doctor.block'),
  asyncHandler(async (req, res) => {
    const blocked = req.body?.blocked !== false;
    const data = await adminService.blockDoctor(req.params.id, blocked);
    if (!data) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({
      success: true,
      message: blocked ? 'Doctor blocked' : 'Doctor unblocked',
      data
    });
  })
);

router.put(
  '/doctors/:id/plan',
  auditAction('admin.doctor.plan'),
  asyncHandler(async (req, res) => {
    const { plan } = req.body || {};
    if (!plan) return res.status(400).json({ success: false, message: 'Plan required' });
    const data = await adminService.changeDoctorPlan(req.params.id, plan);
    if (!data) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, message: 'Plan updated', data });
  })
);

router.post(
  '/doctors/:id/reset-password',
  auditAction('admin.doctor.reset_password'),
  asyncHandler(async (req, res) => {
    const result = await adminService.resetDoctorPassword(req.params.id, req.body?.password);
    if (!result) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, ...result });
  })
);

router.delete(
  '/doctors/:id',
  auditAction('admin.doctor.delete'),
  asyncHandler(async (req, res) => {
    const ok = await adminService.deleteDoctor(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor removed (suspended)' });
  })
);

router.get(
  '/revenue',
  asyncHandler(async (req, res) => {
    const data = await adminService.getRevenueAnalytics();
    res.json({ success: true, data });
  })
);

router.get(
  '/activity-log',
  asyncHandler(async (req, res) => {
    const data = await adminService.getActivityLog(req.query.limit);
    res.json({ success: true, data });
  })
);

router.get(
  '/coupons',
  asyncHandler(async (req, res) => {
    const data = await adminService.listCoupons();
    res.json({ success: true, data });
  })
);

router.post(
  '/coupon',
  auditAction('admin.coupon.create'),
  asyncHandler(async (req, res) => {
    const { code, discountPercent, validUntil, maxUses } = req.body || {};
    if (!code || !discountPercent) {
      return res.status(400).json({ success: false, message: 'Code and discount required' });
    }
    const data = await adminService.createCoupon({ code, discountPercent, validUntil, maxUses });
    res.status(201).json({ success: true, data });
  })
);

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const data = await adminService.getAdminSettings();
    res.json({ success: true, data });
  })
);

router.put(
  '/settings',
  auditAction('admin.settings.update'),
  asyncHandler(async (req, res) => {
    const data = await adminService.updateAdminSettings(req.body || {});
    res.json({ success: true, data });
  })
);

/* Legacy routes — keep for existing admin pages */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const data = await adminService.getDashboardStats();
    res.json({ success: true, data });
  })
);

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const data = await adminService.listDoctors(req.query);
    res.json({ success: true, data });
  })
);

module.exports = router;
