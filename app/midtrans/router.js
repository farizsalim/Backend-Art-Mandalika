const express = require('express');
const { createPayment, handleMidtransNotification, getPayment, createPaymentCustom} = require('./controller');
const { authenticateJWT, verifyMidtransSignature } = require('../../middleware/index');
const router = express.Router();

router.post('/create-payment', authenticateJWT, createPayment);
router.post('/create-payment-custom', authenticateJWT, createPaymentCustom);
router.post('/webhook/midtrans', (req, res, next) => {
    console.log('Webhook endpoint dipanggil');
    next();
}, verifyMidtransSignature, handleMidtransNotification);
router.get('/payment/:id_Order', authenticateJWT, getPayment);

module.exports = router;
