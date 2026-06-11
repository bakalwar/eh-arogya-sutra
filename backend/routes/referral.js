const express = require('express');
const { requirePostgres } = require('../middleware/requirePostgres');
const { requireAuth } = require('../middleware/requireAuth');
const { asyncHandler } = require('../utils/asyncHandler');
const { getPostgresModels } = require('../utils/dataSource');
const router = express.Router();

router.use(requireAuth);
router.use(requirePostgres);

/**
 * GET /api/referral/stats
 * Get current user's referral stats
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const { ReferralPg, UserPg } = getPostgresModels();
    const referrals = await ReferralPg.findAll({
      where: { referrer_id: req.user.id },
      include: [{ model: UserPg, as: 'referredUser', attributes: ['name', 'created_at'] }]
    });

    res.json({
      success: true,
      data: {
        referral_code: req.user.referral_code,
        count: referrals.length,
        referrals: referrals
      }
    });
  })
);

module.exports = router;
