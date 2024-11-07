const express = require('express');
const { createPayment, handleMidtransNotification, getPayment} = require('./controller');
const { authenticateJWT, verifyMidtransSignature } = require('../../middleware/index');
const router = express.Router();

router.post('/create-payment', authenticateJWT, createPayment);
router.post('/webhook/midtrans', (req, res, next) => {
    console.log('Webhook endpoint dipanggil');
    next();
}, verifyMidtransSignature, handleMidtransNotification);
router.get('/payment/:id_Order', authenticateJWT, getPayment);

module.exports = router;
