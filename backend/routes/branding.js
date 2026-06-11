const express = require('express');
const branding = require('../config/branding');
const { requireAuth } = require('../middleware/requireAuth');
const { asyncHandler } = require('../utils/asyncHandler');
const { loadUserProfile, profileToBranding } = require('../services/doctorProfile');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (token) {
      try {
        const { verifyAccessToken } = require('../services/authTokens');
        const payload = verifyAccessToken(token);
        const loaded = await loadUserProfile(payload.id);
        if (loaded?.profile?.clinicName) {
          return res.json({
            success: true,
            data: profileToBranding(loaded.profile)
          });
        }
      } catch {
        /* fall through to defaults */
      }
    }

    res.json({
      success: true,
      data: {
        clinicName: branding.clinicName,
        clinicPhone: branding.clinicPhone,
        footerLine: branding.clinicFooterLine()
      }
    });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const loaded = await loadUserProfile(req.user.id);
    if (!loaded) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    res.json({ success: true, data: profileToBranding(loaded.profile) });
  })
);

module.exports = router;
