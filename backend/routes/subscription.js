const express = require('express');
const { requirePostgres } = require('../middleware/requirePostgres');
const { requireAuth } = require('../middleware/requireAuth');
const { asyncHandler } = require('../utils/asyncHandler');
const { getPostgresModels } = require('../utils/dataSource');
const router = express.Router();

router.use(requireAuth);
router.use(requirePostgres);

/**
 * GET /api/subscription/current
 * Get current user's subscription status
 */
router.get(
  '/current',
  asyncHandler(async (req, res) => {
    const { SubscriptionPg } = getPostgresModels();
    const sub = await SubscriptionPg.findOne({
      where: { user_id: req.user.id, status: 'active' },
      order: [['created_at', 'DESC']]
    });

    if (!sub) {
      return res.json({
        success: true,
        data: { plan_name: 'none', status: 'inactive' }
      });
    }

    res.json({ success: true, data: sub });
  })
);

/**
 * POST /api/subscription/upgrade
 * Upgrade to a new plan (placeholder for payment integration)
 */
router.post(
  '/upgrade',
  asyncHandler(async (req, res) => {
    const { plan_name } = req.body;
    if (!['basic', 'pro'].includes(plan_name)) {
      return res.status(400).json({ success: false, message: 'Invalid plan name' });
    }

    // Logic to create a pending payment and then upgrade subscription
    // For now, just a placeholder
    res.json({ success: true, message: `Upgrade to ${plan_name} initiated` });
  })
);

module.exports = router;
