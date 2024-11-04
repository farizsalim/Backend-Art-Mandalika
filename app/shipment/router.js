const express = require('express');
const router = express.Router();
const {
    createShipment,
    getShipmentById,
    updateTrackingNumber,
    getAllShipments,
    getShippingCost
} = require('./controller');
const { authenticateJWT, authorize } = require('../../middleware/index'); // Sesuaikan path ke middleware sesuai

// Endpoint untuk menyimpan data pengiriman baru
router.post('/data', authenticateJWT, authorize('create', 'Shipment'), createShipment);

// Endpoint untuk mendapatkan detail pengiriman berdasarkan ID Shipment
router.get('/data/:ID_Shipment', authenticateJWT, authorize('read', 'Shipment'), getShipmentById);

// Endpoint untuk memperbarui nomor resi pengiriman (hanya admin)
router.put('/data/:ID_Shipment/tracking', authenticateJWT, authorize('update', 'Shipment'), updateTrackingNumber);

// Endpoint untuk mendapatkan semua data pengiriman (hanya admin)
router.get('/data/all', authenticateJWT, authorize('read', 'Shipment'), getAllShipments);

// Endpoint untuk mendapatkan biaya pengiriman dari API RajaOngkir
router.post('/data/cost', authenticateJWT, authorize('read', 'Shipment'), getShippingCost);

module.exports = router
