const express = require('express');  
const { uploadNewsEventImage } = require("../../middleware/index"); // Middleware untuk upload gambar  
const { authorize, authenticateJWT } = require('../../middleware/index'); // Middleware untuk otorisasi dan autentikasi  
const router = express.Router();  
const {  
    createNewsEvent,  
    getAllNewsEvents,  
    getNewsEventById,  
    updateNewsEvent,  
    deleteNewsEvent  
} = require('./controller'); // Pastikan path ini sesuai  
  
// Route untuk menambahkan berita/acara baru (hanya admin)  
router.post('/',authenticateJWT, authorize('create', 'NewsEvent'), uploadNewsEventImage.single('image'), createNewsEvent);  
  
// Route untuk mendapatkan semua berita/acara  
router.get('/',getAllNewsEvents);  
  
// Route untuk mendapatkan berita/acara berdasarkan ID  
router.get('/:id', getNewsEventById);  
  
// Route untuk memperbarui berita/acara berdasarkan ID (hanya admin)  
router.put('/:id',authenticateJWT, authorize('update', 'NewsEvent'), updateNewsEvent);  
  
// Route untuk menghapus berita/acara berdasarkan ID (hanya admin)  
router.delete('/:id',authenticateJWT, authorize('delete', 'NewsEvent'), deleteNewsEvent);  
  
module.exports = router;  
