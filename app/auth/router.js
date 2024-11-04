const express = require('express');
const multer = require('multer'); // Digunakan untuk meng-handle file uploadUser
const { authorize, authenticateJWT } = require('../../middleware/index');
const { 
        registerUser, 
        getAllUsers, 
        getUserById, 
        updateUser, 
        loginUser, 
        deleteUser, 
        adminUpdate,
        updatePassword,
        resetPassword,
        forgotPassword
        } = require('./controller');

const router = express.Router();
const {uploadUser} = require("../../middleware/index")

// Rute untuk registrasi dan login pengguna (tidak memerlukan autentikasi)
router.post('/register', uploadUser.single('photo'), registerUser);
router.post('/login', loginUser);

// Rute yang membutuhkan autentikasi dan otorisasi
router.get('/users', authenticateJWT, authorize('manage', 'all'), getAllUsers);
router.get('/users/:id', authenticateJWT, authorize('view', 'User'), getUserById);
router.put('/users/:id', authenticateJWT, authorize('update', 'User'), uploadUser.single('photo'), updateUser);
router.put('/users/:id/admin', authenticateJWT, authorize('update', 'User'), uploadUser.single('photo'), adminUpdate);
router.delete('/users/:id', authenticateJWT, authorize('delete', 'User'), deleteUser);
router.patch('/users/:id/updatePassword', updatePassword);
router.post('/users/forgot-password', forgotPassword);
router.post('/users/reset-password', resetPassword);

module.exports = router;
