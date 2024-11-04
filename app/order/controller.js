const db = require('../../database/database');

// Controller untuk membuat order baru
const createOrder = async (req, res) => {
    try {
        const { ID_ArtRequest, ID_Address, ID_Shipment } = req.body;
        const ID_User = req.user.id;

        // Ambil data ArtRequest untuk mendapatkan harga
        const [artRequestResults] = await db.query(
            'SELECT * FROM ArtRequest_Artwork WHERE ID_ArtRequest = ?',
            [ID_ArtRequest]
        );

        if (artRequestResults.length === 0) {
            return res.status(400).json({ message: 'Art request tidak ditemukan.' });
        }

        const artworkPrice = parseFloat(artRequestResults[0].Price); // pastikan ini angka

        // Ambil biaya pengiriman dari tabel Shipment
        const [shipmentResults] = await db.query(
            'SELECT Cost FROM Shipment WHERE ID_Shipment = ?',
            [ID_Shipment]
        );

        if (shipmentResults.length === 0) {
            return res.status(400).json({ message: 'Data pengiriman tidak ditemukan.' });
        }

        const shippingCost = parseFloat(shipmentResults[0].Cost); // pastikan ini angka
        console.log('Biaya pengiriman:', shippingCost); // Log biaya pengiriman

        const totalPrice = (artworkPrice + shippingCost).toFixed(2); // Total harga termasuk biaya pengiriman, dibulatkan ke 2 desimal

        // Simpan data order dengan referensi ke ID_Shipment
        const orderQuery = `
            INSERT INTO Orders (ID_User, ID_Address, ID_ArtRequest, ID_Shipment, TotalPrice, OrderStatus, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        `;
        const [result] = await db.query(orderQuery, [ID_User, ID_Address, ID_ArtRequest, ID_Shipment, totalPrice]);

        res.status(201).json({ message: 'Order berhasil dibuat.', ID_Order: result.insertId });
    } catch (err) {
        console.error('Kesalahan saat membuat order:', err);
        res.status(500).json({ message: 'Gagal membuat order.', error: err.message });
    }
};

// Controller untuk mendapatkan order berdasarkan customer
const getOrdersByCustomer = (req, res) => {
    const ID_User = req.user.id;

    db.query('SELECT * FROM Orders WHERE ID_User = ?', [ID_User], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Gagal mengambil data order.' });
        }
        res.status(200).json(results);
    });
};

// Controller untuk mendapatkan order berdasarkan ID
const getOrderById = (req, res) => {
    const { ID_Order } = req.params;

    db.query('SELECT * FROM Orders WHERE ID_Order = ?', [ID_Order], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Gagal mengambil detail order.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan.' });
        }

        res.status(200).json(results[0]);
    });
};

// Controller untuk mendapatkan semua order (hanya admin)
const getAllOrders = (req, res) => {
    db.query('SELECT * FROM Orders', (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Gagal mengambil semua data order.' });
        }
        res.status(200).json(results);
    });
};

// Controller untuk membatalkan order
const cancelOrder = (req, res) => {
    const { ID_Order } = req.params;
    const ID_User = req.user.id;

    db.query('SELECT * FROM Orders WHERE ID_Order = ? AND ID_User = ?', [ID_Order, ID_User], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan atau bukan milik Anda.' });
        }

        if (results[0].OrderStatus !== 'pending') {
            return res.status(400).json({ message: 'Order hanya bisa dibatalkan jika status masih pending.' });
        }

        db.query('UPDATE Orders SET OrderStatus = "cancelled" WHERE ID_Order = ?', [ID_Order], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Gagal membatalkan order.' });
            }
            res.status(200).json({ message: 'Order berhasil dibatalkan.' });
        });
    });
};

// Controller untuk memperbarui status order (hanya admin)
const updateOrderStatus = (req, res) => {
    const { ID_Order } = req.params;
    const { status } = req.body; // status baru yang akan diupdate

    const validStatuses = ['processing', 'shipped', 'completed'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status tidak valid.' });
    }

    db.query('UPDATE Orders SET OrderStatus = ? WHERE ID_Order = ?', [status, ID_Order], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Gagal mengupdate status order.' });
        }
        res.status(200).json({ message: `Status order berhasil diubah menjadi ${status}.` });
    });
};

// Controller untuk user mengkonfirmasi penerimaan barang
const confirmOrderReceived = (req, res) => {
    const { ID_Order } = req.params;
    const ID_User = req.user.id;

    db.query('SELECT * FROM Orders WHERE ID_Order = ? AND ID_User = ?', [ID_Order, ID_User], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan atau bukan milik Anda.' });
        }

        if (results[0].OrderStatus !== 'shipped') {
            return res.status(400).json({ message: 'Hanya bisa mengkonfirmasi order yang sedang diantar.' });
        }

        db.query('UPDATE Orders SET UserConfirmed = true WHERE ID_Order = ?', [ID_Order], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Gagal mengkonfirmasi penerimaan order.' });
            }
            res.status(200).json({ message: 'Order berhasil dikonfirmasi sudah diterima.' });
        });
    });
};

module.exports = {
    createOrder,
    getOrdersByCustomer,
    getOrderById,
    getAllOrders,
    cancelOrder,
    updateOrderStatus,
    confirmOrderReceived
};
