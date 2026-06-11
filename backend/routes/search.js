const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

/** GET /api/search/book/:id — full passage for modal */
router.get(
  '/book/:id',
  asyncHandler(async (req, res) => {
    res.json({ success: false, message: 'Book data removed' });
  })
);

module.exports = router;
