const db = require('../../database/database');

// Controller untuk menambahkan alamat baru
const createAddress = async (req, res) => {
    try {
        const { recipientName, description, district, village, city, province, postalCode, country, isPrimary, type } = req.body;
        const ID_User = req.user.id;

        // Tentukan apakah alamat ini internasional berdasarkan country
        const isInternational = country.toLowerCase() !== 'indonesia';

        // Ambil PhoneNumber dari tabel Users berdasarkan ID_User
        const [userResult] = await db.query('SELECT Phone_Number FROM Users WHERE ID_User = ?', [ID_User]);

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        const phoneNumber = userResult[0].Phone_Number;

        // Simpan alamat ke database
        const query = `
            INSERT INTO Address (ID_User, RecipientName, Description, District, Village, City, Province, PostalCode, Country, PhoneNumber, IsPrimary, isInternational, Type, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const values = [ID_User, recipientName, description, district, village, city, province, postalCode || null, country, phoneNumber, isPrimary || false, isInternational, type || 'Kota'];

        const [result] = await db.query(query, values);
        res.status(201).json({ message: 'Alamat berhasil ditambahkan.', ID_Address: result.insertId });
    } catch (err) {
        console.error("Kesalahan saat menambahkan alamat:", err);
        res.status(500).json({ message: 'Gagal menambahkan alamat.' });
    }
};

// Controller untuk mendapatkan daftar alamat pengguna
const getAddressesByUser = (req, res) => {
    const ID_User = req.user.id;

    const query = `SELECT * FROM Address WHERE ID_User = ?`;
    db.query(query, [ID_User], (err, results) => {
        if (err) {
            console.error("Kesalahan saat mengambil daftar alamat:", err);
            return res.status(500).json({ message: 'Gagal mengambil daftar alamat.' });
        }
        res.status(200).json(results);
    });
};

// Controller untuk mendapatkan detail alamat
const getAddressById = (req, res) => {
    const { ID_Address } = req.params;

    const query = `SELECT * FROM Address WHERE ID_Address = ?`;
    db.query(query, [ID_Address], (err, results) => {
        if (err) {
            console.error("Kesalahan saat mengambil detail alamat:", err);
            return res.status(500).json({ message: 'Gagal mengambil detail alamat.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Alamat tidak ditemukan.' });
        }

        res.status(200).json(results[0]);
    });
};

// Controller untuk memperbarui alamat
const updateAddress = (req, res) => {
    const { ID_Address } = req.params;
    const { recipientName, description, district, village, city, province, postalCode, country, phoneNumber, isPrimary } = req.body;

    // Tentukan apakah alamat ini internasional berdasarkan country
    const isInternational = country.toLowerCase() !== 'indonesia';

    const query = `
        UPDATE Address
        SET RecipientName = ?, Description = ?, District = ?, Village = ?, City = ?, province = ?, PostalCode = ?, Country = ?, PhoneNumber = ?, IsPrimary = ?, isInternational = ?, UpdatedAt = NOW()
        WHERE ID_Address = ?
    `;
    const values = [recipientName, description, district, village, city, province, postalCode || null, country, phoneNumber, isPrimary || false, isInternational, ID_Address];

    db.query(query, values, (err) => {
        if (err) {
            console.error("Kesalahan saat memperbarui alamat:", err);
            return res.status(500).json({ message: 'Gagal memperbarui alamat.' });
        }
        res.status(200).json({ message: 'Alamat berhasil diperbarui.' });
    });
};

// Controller untuk menghapus alamat
const deleteAddress = (req, res) => {
    const { ID_Address } = req.params;

    const query = `DELETE FROM Address WHERE ID_Address = ?`;
    db.query(query, [ID_Address], (err) => {
        if (err) {
            console.error("Kesalahan saat menghapus alamat:", err);
            return res.status(500).json({ message: 'Gagal menghapus alamat.' });
        }
        res.status(200).json({ message: 'Alamat berhasil dihapus.' });
    });
};

// Controller untuk menambahkan alamat asal
const addOriginAddress = async (req, res) => {
    try {
        const { originName, city, province, postalCode, country, type } = req.body;

        // Validasi input
        if (!originName || !city || !province || !country) {
            console.log("Data input tidak lengkap");
            return res.status(400).json({ message: 'OriginName, City, Province, dan Country wajib diisi.' });
        }

        console.log("Sebelum query ke database");

        // Simpan alamat asal ke database
        const query = `
            INSERT INTO OriginAddress (OriginName, City, Province, Postal_Code, Country, Type, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const values = [originName, city, province, postalCode || null, country, type || 'Kota'];

        // Menjalankan query dengan async/await
        const [result] = await db.query(query, values);

        console.log("Query berhasil dieksekusi");
        res.status(201).json({ message: 'Alamat asal berhasil ditambahkan.', ID_Origin: result.insertId });

    } catch (err) {
        console.error("Kesalahan saat menambahkan alamat asal:", err);
        res.status(500).json({ message: 'Gagal menambahkan alamat asal.' });
    } finally {
        console.log("Setelah query ke database");
    }
};

const deleteOriginAddress = (req, res) => {
    const { ID_Origin } = req.params;

    const query = `DELETE FROM OriginAddress WHERE ID_Origin = ?`;
    db.query(query, [ID_Origin], (err, result) => {
        if (err) {
            console.error("Kesalahan saat menghapus alamat asal:", err);
            return res.status(500).json({ message: 'Gagal menghapus alamat asal.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Alamat asal tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Alamat asal berhasil dihapus.' });
    });
};

// Controller untuk memperbarui alamat asal
const updateOriginAddress = (req, res) => {
    const { ID_Origin } = req.params;
    const { originName, city, province, postalCode, country, type } = req.body;

    // Validasi input untuk memastikan ada data yang diupdate
    if (!originName && !city && !province && !postalCode && !country && !type) {
        return res.status(400).json({ message: 'Tidak ada data yang diperbarui.' });
    }

    const query = `
        UPDATE OriginAddress 
        SET 
            OriginName = COALESCE(?, OriginName),
            City = COALESCE(?, City),
            Province = COALESCE(?, Province),
            Postal_Code = COALESCE(?, Postal_Code),
            Country = COALESCE(?, Country),
            Type = COALESCE(?, Type),
            UpdatedAt = NOW()
        WHERE ID_Origin = ?
    `;
    const values = [originName, city, province, postalCode, country, type, ID_Origin];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Kesalahan saat memperbarui alamat asal:", err);
            return res.status(500).json({ message: 'Gagal memperbarui alamat asal.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Alamat asal tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Alamat asal berhasil diperbarui.' });
    });
};

const getOriginAddresses = async (req, res) => {
    try {
        const { ID_Origin } = req.params;

        let query = 'SELECT * FROM OriginAddress';
        let values = [];

        // Jika ID_Origin disediakan, tambahkan filter untuk mengambil alamat tertentu
        if (ID_Origin) {
            query += ' WHERE ID_Origin = ?';
            values.push(ID_Origin);
        }

        console.log("Sebelum query untuk mendapatkan OriginAddress");

        // Jalankan query
        const [results] = await db.query(query, values);

        console.log("Query berhasil dieksekusi");

        // Jika ID_Origin disediakan dan tidak ada hasil, kembalikan status 404
        if (ID_Origin && results.length === 0) {
            return res.status(404).json({ message: 'OriginAddress tidak ditemukan.' });
        }

        res.status(200).json(results);

    } catch (err) {
        console.error("Kesalahan saat mengambil OriginAddress:", err);
        res.status(500).json({ message: 'Gagal mengambil OriginAddress.' });
    } finally {
        console.log("Setelah query untuk mendapatkan OriginAddress");
    }
};


module.exports = {
    createAddress,
    getAddressesByUser,
    getAddressById,
    updateAddress,
    deleteAddress,
    addOriginAddress,
    deleteOriginAddress,
    updateOriginAddress,
    getOriginAddresses
};
