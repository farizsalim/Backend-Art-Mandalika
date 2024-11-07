const express = require('express');
const router = express.Router();
const {
    createAddress,
    getAddressesByUser,
    getAddressById,
    updateAddress,
    deleteAddress,
    addOriginAddress,
    updateOriginAddress,
    deleteOriginAddress,
    getOriginAddresses,
    updatePrimaryAddress
} = require('./controller');
const { authenticateJWT, authorize } = require('../../middleware/index'); // Pastikan path ke middleware sesuai

// Endpoint untuk menambahkan alamat baru
router.post('/address', authenticateJWT, authorize('create', 'Address'), createAddress);

// Endpoint untuk mendapatkan daftar alamat milik pengguna yang sedang login
router.get('/address', authenticateJWT, authorize('read', 'Address'), getAddressesByUser);

// Endpoint untuk mendapatkan detail alamat berdasarkan ID
router.get('/address/:ID_Address', authenticateJWT, authorize('read', 'Address'), getAddressById);

// Endpoint untuk memperbarui alamat berdasarkan ID
router.put('/address/:ID_Address', authenticateJWT, authorize('update', 'Address'), updateAddress);

// Endpoint untuk menghapus alamat berdasarkan ID
router.delete('/address/:ID_Address', authenticateJWT, authorize('delete', 'Address'), deleteAddress);

router.post('/origin-address', authenticateJWT, authorize('create', 'OriginAddress'), addOriginAddress);

router.put('/origin-address/:ID_OriginAddress', authenticateJWT, authorize('update', 'OriginAddress'), updateOriginAddress);

router.delete('/origin-address/:ID_OriginAddress', authenticateJWT, authorize('delete', 'OriginAddress'), deleteOriginAddress);

router.get('/origin-address', authenticateJWT, authorize('read', 'OriginAddress'), getOriginAddresses);

router.get('/origin-address/:ID_Origin', authenticateJWT, authorize('read', 'OriginAddress'), getOriginAddresses);

router.patch('/address/:ID_Address/set-primary', authenticateJWT, updatePrimaryAddress);

module.exports = router;
