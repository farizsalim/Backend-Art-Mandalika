const db = require('../../database/database');

// Controller untuk menambahkan alamat baru
const createAddress = async (req, res) => {
    try {
        const { recipientName, description, district, village, city, province, postalCode, country, isPrimary, type } = req.body;
        const ID_User = req.user.id;

        const isInternational = country.toLowerCase() !== 'indonesia';

        const [userResult] = await db.query('SELECT Phone_Number FROM Users WHERE ID_User = ?', [ID_User]);

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        const phoneNumber = userResult[0].Phone_Number;

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
const getAddressesByUser = async (req, res) => {
    const ID_User = req.user.id;

    try {
        const [results] = await db.query('SELECT * FROM Address WHERE ID_User = ?', [ID_User]);
        res.status(200).json(results);
    } catch (err) {
        console.error("Kesalahan saat mengambil daftar alamat:", err);
        res.status(500).json({ message: 'Gagal mengambil daftar alamat.' });
    }
};

// Controller untuk mendapatkan detail alamat
const getAddressById = async (req, res) => {
    const { ID_Address } = req.params;

    try {
        const [results] = await db.query('SELECT * FROM Address WHERE ID_Address = ?', [ID_Address]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Alamat tidak ditemukan.' });
        }

        res.status(200).json(results[0]);
    } catch (err) {
        console.error("Kesalahan saat mengambil detail alamat:", err);
        res.status(500).json({ message: 'Gagal mengambil detail alamat.' });
    }
};

// Controller untuk memperbarui alamat
const updateAddress = async (req, res) => {
    const { ID_Address } = req.params;
    const { recipientName, description, district, village, city, province, postalCode, country, phoneNumber, isPrimary } = req.body;

    const isInternational = country.toLowerCase() !== 'indonesia';

    try {
        const query = `
            UPDATE Address
            SET RecipientName = ?, Description = ?, District = ?, Village = ?, City = ?, province = ?, PostalCode = ?, Country = ?, PhoneNumber = ?, IsPrimary = ?, isInternational = ?, UpdatedAt = NOW()
            WHERE ID_Address = ?
        `;
        const values = [recipientName, description, district, village, city, province, postalCode || null, country, phoneNumber, isPrimary || false, isInternational, ID_Address];

        const [result] = await db.query(query, values);
        res.status(200).json({ message: 'Alamat berhasil diperbarui.' });
    } catch (err) {
        console.error("Kesalahan saat memperbarui alamat:", err);
        res.status(500).json({ message: 'Gagal memperbarui alamat.' });
    }
};

// Controller untuk menghapus alamat
const deleteAddress = async (req, res) => {
    const { ID_Address } = req.params;
    const ID_User = req.user.id;

    try {
        // Cek apakah alamat yang dihapus adalah primary
        const [addressResult] = await db.query('SELECT IsPrimary FROM Address WHERE ID_Address = ? AND ID_User = ?', [ID_Address, ID_User]);

        if (addressResult.length === 0) {
            return res.status(404).json({ message: 'Alamat tidak ditemukan.' });
        }

        if (addressResult[0].IsPrimary) {
            return res.status(400).json({ message: 'Alamat primary tidak bisa dihapus. Silakan set alamat lain sebagai primary terlebih dahulu.' });
        }

        const [result] = await db.query('DELETE FROM Address WHERE ID_Address = ? AND ID_User = ?', [ID_Address, ID_User]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Alamat tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Alamat berhasil dihapus.' });
    } catch (err) {
        console.error("Kesalahan saat menghapus alamat:", err);
        res.status(500).json({ message: 'Gagal menghapus alamat.' });
    }
};

// Controller untuk menambahkan alamat asal
const addOriginAddress = async (req, res) => {
    try {
        const { originName, city, province, postalCode, country, type } = req.body;

        if (!originName || !city || !province || !country) {
            return res.status(400).json({ message: 'OriginName, City, Province, dan Country wajib diisi.' });
        }

        const query = `
            INSERT INTO OriginAddress (OriginName, City, Province, Postal_Code, Country, Type, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const values = [originName, city, province, postalCode || null, country, type || 'Kota'];

        const [result] = await db.query(query, values);
        res.status(201).json({ message: 'Alamat asal berhasil ditambahkan.', ID_Origin: result.insertId });
    } catch (err) {
        console.error("Kesalahan saat menambahkan alamat asal:", err);
        res.status(500).json({ message: 'Gagal menambahkan alamat asal.' });
    }
};

// Controller untuk menghapus alamat asal
const deleteOriginAddress = async (req, res) => {
    const { ID_Origin } = req.params;

    try {
        const [result] = await db.query('DELETE FROM OriginAddress WHERE ID_Origin = ?', [ID_Origin]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Alamat asal tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Alamat asal berhasil dihapus.' });
    } catch (err) {
        console.error("Kesalahan saat menghapus alamat asal:", err);
        res.status(500).json({ message: 'Gagal menghapus alamat asal.' });
    }
};

// Controller untuk memperbarui alamat asal
const updateOriginAddress = async (req, res) => {
    const { ID_Origin } = req.params;
    const { originName, city, province, postalCode, country, type } = req.body;

    if (!originName && !city && !province && !postalCode && !country && !type) {
        return res.status(400).json({ message: 'Tidak ada data yang diperbarui.' });
    }

    try {
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

        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Alamat asal tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Alamat asal berhasil diperbarui.' });
    } catch (err) {
        console.error("Kesalahan saat memperbarui alamat asal:", err);
        res.status(500).json({ message: 'Gagal memperbarui alamat asal.' });
    }
};

// Controller untuk mendapatkan daftar alamat asal
const getOriginAddresses = async (req, res) => {
    try {
        const { ID_Origin } = req.params;

        let query = 'SELECT * FROM OriginAddress';
        let values = [];

        if (ID_Origin) {
            query += ' WHERE ID_Origin = ?';
            values.push(ID_Origin);
        }

        const [results] = await db.query(query, values);

        if (ID_Origin && results.length === 0) {
            return res.status(404).json({ message: 'OriginAddress tidak ditemukan.' });
        }

        res.status(200).json(results);
    } catch (err) {
        console.error("Kesalahan saat mengambil OriginAddress:", err);
        res.status(500).json({ message: 'Gagal mengambil OriginAddress.' });
    }
};

const updatePrimaryAddress = async (req, res) => {
    const { ID_Address } = req.params;
    const ID_User = req.user.id;

    try {
        // Pastikan alamat yang ingin dijadikan primary ada
        const [addressResult] = await db.query('SELECT * FROM Address WHERE ID_Address = ? AND ID_User = ?', [ID_Address, ID_User]);

        if (addressResult.length === 0) {
            return res.status(404).json({ message: 'Alamat tidak ditemukan.' });
        }

        // Reset primary address sebelumnya
        await db.query('UPDATE Address SET IsPrimary = false WHERE ID_User = ?', [ID_User]);

        // Set alamat yang diinginkan sebagai primary
        const [updateResult] = await db.query('UPDATE Address SET IsPrimary = true, UpdatedAt = NOW() WHERE ID_Address = ? AND ID_User = ?', [ID_Address, ID_User]);

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ message: 'Gagal mengatur alamat primary.' });
        }

        res.status(200).json({ message: 'Alamat berhasil dijadikan primary.' });
    } catch (err) {
        console.error("Kesalahan saat memperbarui primary address:", err);
        res.status(500).json({ message: 'Gagal mengatur alamat primary.' });
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
    getOriginAddresses,
    updatePrimaryAddress
};
