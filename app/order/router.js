const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrdersByCustomer,
    getOrderById,
    getAllOrders,
    cancelOrder,
    updateOrderStatus,
    confirmOrderReceived
} = require('./controller');
const { authenticateJWT, authorize } = require('../../middleware/index'); // Sesuaikan path ke middleware sesuai

// Endpoint untuk membuat order baru
router.post('/data', authenticateJWT, authorize('create', 'Order'), createOrder);

// Endpoint untuk mendapatkan daftar order milik pengguna yang sedang login
router.get('/data', authenticateJWT, authorize('read', 'Order'), getOrdersByCustomer);

// Endpoint untuk mendapatkan detail order berdasarkan ID
router.get('/data/:ID_Order', authenticateJWT, authorize('read', 'Order'), getOrderById);

// Endpoint untuk mendapatkan semua order (hanya admin)
router.get('/data/all', authenticateJWT, authorize('read', 'Order'), getAllOrders);

// Endpoint untuk membatalkan order (hanya jika status pending)
router.delete('/data/:ID_Order', authenticateJWT, authorize('delete', 'Order'), cancelOrder);

// Endpoint untuk memperbarui status order (hanya admin)
router.put('/data/:ID_Order/status', authenticateJWT, authorize('update', 'Order'), updateOrderStatus);

// Endpoint untuk user mengkonfirmasi penerimaan barang
router.put('/data/:ID_Order/confirm', authenticateJWT, authorize('update', 'Order'), confirmOrderReceived);

module.exports = router;
