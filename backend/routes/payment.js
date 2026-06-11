const express = require('express');
const { requirePostgres } = require('../middleware/requirePostgres');
const { requireAuth } = require('../middleware/requireAuth');
const { asyncHandler } = require('../utils/asyncHandler');
const { getPostgresModels } = require('../utils/dataSource');
const router = express.Router();

router.use(requireAuth);
router.use(requirePostgres);

/**
 * POST /api/payment/create-qr
 * Generate a payment record for QR scanning
 */
router.post(
  '/create-qr',
  asyncHandler(async (req, res) => {
    const { amount, plan_name } = req.body;
    const { PaymentPg } = getPostgresModels();

    const payment = await PaymentPg.create({
      user_id: req.user.id,
      amount,
      payment_method: 'QR',
      status: 'pending',
      payment_details: { plan_name }
    });

    res.json({
      success: true,
      data: {
        payment_id: payment.id,
        amount: payment.amount,
        qr_string: `upi://pay?pa=jagdambaclinic@upi&pn=Jagdamba%20Clinic&am=${amount}&tr=${payment.id}`
      }
    });
  })
);

/**
 * POST /api/payment/verify
 * Verify payment status (placeholder for webhook/manual verification)
 */
router.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const { payment_id, transaction_id } = req.body;
    const { PaymentPg } = getPostgresModels();

    const payment = await PaymentPg.findByPk(payment_id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await payment.update({
      status: 'completed',
      transaction_id: transaction_id
    });

    res.json({ success: true, message: 'Payment verified successfully' });
  })
);

module.exports = router;
