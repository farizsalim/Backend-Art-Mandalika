const policyFor = require('../policy/index'); // Sesuaikan dengan path yang benar
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('node:crypto');

const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Mengambil token dari header Authorization

    if (!token) {
        return res.status(403).json({ message: 'Token tidak ditemukan.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => { // Ganti 'your_jwt_secret' dengan rahasia yang aman
        if (err) {
            return res.status(403).json({ message: 'Token tidak valid.' });
        }
        req.user = user; // Simpan informasi pengguna ke dalam request
        next();
    });
};

const authorize = (action, subject) => {
    return (req, res, next) => {
        const user = req.user; // Pastikan req.user sudah diisi dari proses autentikasi
        const policy = policyFor(user); // Buat kebijakan berdasarkan User_Type

        // Periksa apakah pengguna memiliki izin
        if (!policy.can(action, subject)) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke resource ini.' });
        }

        // Jika memiliki izin, lanjutkan ke handler berikutnya
        next();
    };
};

const userstorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/user/');
    }
});

const uploadUser = multer({ storage: userstorage });

const artworkStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/artwork/'); // Folder untuk menyimpan gambar karya seni
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Nama unik untuk setiap file
    }
});

// Konfigurasi multer untuk upload
const uploadArtwork = multer({ storage: artworkStorage });

// Middleware untuk memverifikasi webhook dari Midtrans
const verifyMidtransSignature = (req, res, next) => {
    try {
        const signatureKey = req.headers['x-callback-signature'];
        console.log('Signature key = '+signatureKey);
        
        if (!signatureKey) {
            console.error('Signature key not found');
            return res.status(403).json({ message: 'Signature key not found' });
        }

        const body = JSON.stringify(req.body);
        const serverKey = process.env.MIDTRANS_SERVER_KEY;

        const hash = crypto.createHmac('sha512', serverKey).update(body).digest('hex');

        console.log('Computed Hash:', hash);
        console.log('Signature from Midtrans:', signatureKey);

        if (hash !== signatureKey) {
            console.error('Invalid signature');
            return res.status(403).json({ message: 'Invalid signature' });
        }

        next();
    } catch (err) {
        console.error('Error saat memverifikasi signature Midtrans:', err);
        res.status(500).json({ message: 'Gagal memverifikasi signature' });
    }
};

module.exports = { authorize, authenticateJWT, uploadUser, uploadArtwork, verifyMidtransSignature };
