const fs = require('fs');
const path = require('path');
const db = require('../../database/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { transporter } = require('../../nodemailer/index');

const defaultImagePath = 'default.png';

const registerUser = async (req, res) => {
    const { username, email, phone_number, password, artist_name, bio, user_type } = req.body;
    const errors = [];

    // Validasi input
    if (!username) errors.push('Username');
    if (!email) errors.push('Email');
    if (!password) errors.push('Password');
    if (!phone_number) errors.push('Phone Number'); // Tambahkan validasi phone_number

    if (errors.length > 0) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: `${errors.join(', ')} harus diisi.` });
    }

    const userType = user_type || 'Customer';

    try {
        // Cek apakah username sudah ada
        const [results] = await db.query('SELECT * FROM Users WHERE Username = ?', [username]);

        if (results.length > 0) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.status(409).json({ message: 'Username sudah digunakan.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let photoFileName;

        if (req.file) {
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            photoFileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;
            const newPath = path.join(__dirname, '../../public/user', photoFileName);
            fs.renameSync(req.file.path, newPath);
        } else {
            photoFileName = defaultImagePath;
        }

        // Simpan pengguna baru ke database
        await db.query(
            'INSERT INTO Users (Username, Email, Phone_Number, Password, Photo, User_Type, Artist_Name, Bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            [username, email, phone_number, hashedPassword, photoFileName, userType, artist_name, bio]
        );

        res.status(201).json({ message: 'Pengguna berhasil terdaftar.' });
    } catch (error) {
        console.error("Error saat mendaftar pengguna:", error);
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(500).json({ message: 'Kesalahan pada server.' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email dan Password harus diisi.' });
    }

    try {
        const [results] = await db.query('SELECT * FROM Users WHERE Email = ?', [email]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Email tidak ditemukan.' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah.' });
        }

        // Tambahkan atau ubah role berdasarkan logika tertentu
        let role = user.User_Type;
        if (email === 'admin@example.com') {
            role = 'Admin'; // Set role secara manual untuk email tertentu
        } else if (email.endsWith('@company.com')) {
            role = 'Employee'; // Set role berdasarkan domain email
        }

        // Buat JWT dengan role yang diperbarui
        const token = jwt.sign({ id: user.ID_User, role: role, name: user.Username }, process.env.JWT_SECRET, { expiresIn: '1w' });

        res.status(200).json({
            message: 'Login berhasil.',
            token,
            user: {
                id: user.ID_User,
                username: user.Username,
                email: user.Email,
                phone_number: user.Phone_Number,
                photo: user.Photo,
                user_type: role, // Kirim role yang sudah diperbarui
                artist_name: user.Artist_Name,
                bio: user.Bio
            }
        });
    } catch (error) {
        console.error("Kesalahan saat login pengguna:", error);
        return res.status(500).json({ message: 'Kesalahan dalam pengecekan pengguna.' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Users');
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ message: 'Kesalahan dalam mengambil data pengguna.' });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.query('SELECT ID_User, Username, Email, Phone_Number, Photo, User_Type, Artist_Name, Bio FROM Users WHERE ID_User = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        res.status(200).json(results[0]);
    } catch (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ message: 'Kesalahan dalam mengambil data pengguna.' });
    }
};

const updateUser = async (req, res) => {
    const ID_User = req.user.id; // Ambil ID_User dari token (middleware auth)
    const { phone_number, bio } = req.body;
    let photoFileName;

    try {
        if (req.file) {
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            photoFileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;
            const newPath = path.join(__dirname, '../../public/user', photoFileName);
            fs.renameSync(req.file.path, newPath);

            // Ambil foto lama dari database untuk dihapus jika ada
            const [results] = await db.query('SELECT Photo FROM Users WHERE ID_User = ?', [ID_User]);
            const oldPhoto = results[0]?.Photo;
            if (oldPhoto && oldPhoto !== defaultImagePath) {
                fs.unlinkSync(path.join(__dirname, '../../public/user', oldPhoto));
            }
        }

        // Persiapkan field yang akan diperbarui
        const fieldsToUpdate = {
            phone_number,
            bio,
            Photo: photoFileName || undefined,
        };

        // Hapus field yang undefined
        Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

        await db.query('UPDATE Users SET ?, updated_at = CURRENT_TIMESTAMP WHERE ID_User = ?', [fieldsToUpdate, ID_User]);
        res.status(200).json({ message: 'Data pengguna berhasil diperbarui.' });
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ message: 'Kesalahan saat memperbarui pengguna.' });
    }
};

const adminUpdate = async (req, res) => {
    const { id } = req.params;
    const { user_type, status, phone_number, bio } = req.body;
    let photoFileName;

    try {
        if (req.file) {
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            photoFileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;
            const newPath = path.join(__dirname, '../../public/user', photoFileName);
            fs.renameSync(req.file.path, newPath);

            const [results] = await db.query('SELECT Photo FROM Users WHERE ID_User = ?', [id]);
            const oldPhoto = results[0]?.Photo;
            if (oldPhoto && oldPhoto !== defaultImagePath) {
                fs.unlinkSync(path.join(__dirname, '../../public/user', oldPhoto));
            }
        }

        const fieldsToUpdate = {
            phone_number,
            bio,
            user_type,
            status,
            Photo: photoFileName || undefined,
        };

        Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

        await db.query('UPDATE Users SET ?, updated_at = CURRENT_TIMESTAMP WHERE ID_User = ?', [fieldsToUpdate, id]);
        res.status(200).json({ message: 'Data pengguna berhasil diperbarui.' });
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ message: 'Kesalahan saat memperbarui pengguna.' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.query('SELECT User_Type, Photo FROM Users WHERE ID_User = ?', [id]);
        if (results.length === 0 || results[0].User_Type !== 'Admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus pengguna.' });
        }

        const userPhoto = results[0].Photo;

        await db.query('DELETE FROM Users WHERE ID_User = ?', [id]);

        if (userPhoto) {
            const photoPath = path.join(__dirname, '../../public/user', userPhoto);
            fs.unlinkSync(photoPath);
        }

        res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
    } catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ message: 'Kesalahan saat menghapus pengguna.' });
    }
};

const updatePassword = async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Password lama dan baru harus diisi.' });
    }

    try {
        const [results] = await db.query('SELECT Password FROM Users WHERE ID_User = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        const userPassword = results[0].Password;

        const isMatch = await bcrypt.compare(oldPassword, userPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password lama tidak cocok.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE Users SET Password = ? WHERE ID_User = ?', [hashedPassword, id]);

        const [emailResults] = await db.query('SELECT Email FROM Users WHERE ID_User = ?', [id]);
        const userEmail = emailResults[0].Email;

        const mailOptions = {
            from: '"Your App Name" <no-reply@yourapp.com>',
            to: userEmail,
            subject: 'Password Berhasil Diperbarui',
            text: 'Password Anda telah berhasil diperbarui. Jika Anda tidak melakukan perubahan ini, segera hubungi tim support kami.',
            html: '<p>Password Anda telah berhasil diperbarui. Jika Anda tidak melakukan perubahan ini, segera hubungi tim support kami.</p>'
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Password berhasil diperbarui dan email konfirmasi telah dikirim.' });
    } catch (error) {
        console.error("Error saat memperbarui password:", error);
        return res.status(500).json({ message: 'Kesalahan pada server.' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const [results] = await db.query('SELECT * FROM Users WHERE Email = ?', [email]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Email tidak ditemukan.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenResetExpired = Date.now() + 3600000; // Berlaku 1 jam

        await db.query(
            'UPDATE Users SET resetToken = ?, tokenResetExpired = ? WHERE Email = ?', 
            [resetToken, tokenResetExpired, email]
        );

        const resetUrl = `http://yourfrontend.com/reset-password/${resetToken}`;

        const mailOptions = {
            from: '"Your App Name" <no-reply@yourapp.com>',
            to: email,
            subject: 'Password Reset',
            text: `Klik link berikut untuk mereset password Anda: ${resetUrl}`,
            html: `<p>Klik link berikut untuk mereset password Anda: <a href="${resetUrl}">Reset Password</a></p>`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Link reset password telah dikirim ke email Anda.' });
    } catch (error) {
        console.error("Kesalahan saat mengirim email reset password:", error);
        return res.status(500).json({ message: 'Gagal mengirim email reset password.' });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const [results] = await db.query('SELECT * FROM Users WHERE resetToken = ?', [token]);
        if (results.length === 0) {
            return res.status(400).json({ message: 'Token reset tidak valid.' });
        }

        const user = results[0];

        if (user.tokenResetExpired <= Date.now()) {
            return res.status(400).json({ message: 'Token reset telah kadaluarsa.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE Users SET Password = ?, resetToken = NULL, tokenResetExpired = NULL WHERE ID_User = ?', 
            [hashedPassword, user.ID_User]
        );

        res.status(200).json({ message: 'Password berhasil diperbarui.' });
    } catch (error) {
        console.error("Kesalahan saat mereset password:", error);
        return res.status(500).json({ message: 'Kesalahan pada server.' });
    }
};

const getAllArtists = async (req, res) => {
    try {
        const [results] = await db.query(
            'SELECT Id_User,Username, Artist_Name, Bio, Photo FROM Users WHERE User_Type = ?', 
            ['artist']
        );
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching artists:", err);
        return res.status(500).json({ message: 'Kesalahan dalam mengambil data artist.' });
    }
};

const getUserByCustomer = async (req, res) => {
    // Ambil ID pengguna dari token (misalnya disimpan di middleware auth)
    const ID_User = req.user.id;

    try {
        const [results] = await db.query('SELECT ID_User, Username, Email, Phone_Number, Photo, User_Type, Artist_Name, Bio FROM Users WHERE ID_User = ?', [ID_User]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        res.status(200).json(results[0]);
    } catch (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ message: 'Kesalahan dalam mengambil data pengguna.' });
    }
};

const updateUserType = async (req, res) => {
    const { id } = req.params; // Ambil ID user dari parameter URL
    const { user_type } = req.body; // Ambil tipe pengguna baru dari body request

    if (!user_type) {
        return res.status(400).json({ message: 'Tipe pengguna harus diisi.' });
    }

    try {
        // Periksa apakah pengguna dengan ID yang diberikan ada
        const [user] = await db.query('SELECT * FROM Users WHERE ID_User = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        // Update tipe pengguna di database
        await db.query('UPDATE Users SET User_Type = ?, updated_at = CURRENT_TIMESTAMP WHERE ID_User = ?', [user_type, id]);

        res.status(200).json({ message: 'Tipe pengguna berhasil diperbarui.' });
    } catch (error) {
        console.error("Kesalahan saat memperbarui tipe pengguna:", error);
        return res.status(500).json({ message: 'Kesalahan pada server.' });
    }
};


module.exports = { 
    registerUser, 
    loginUser, 
    getAllUsers, 
    getUserById, 
    updateUser, 
    adminUpdate, 
    deleteUser,
    updatePassword,
    forgotPassword,
    resetPassword,
    getAllArtists,
    getUserByCustomer,
    updateUserType
};
