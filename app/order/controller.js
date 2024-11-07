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
const getOrdersByCustomer = async (req, res) => {
    const ID_User = req.user.id;

    try {
        const [results] = await db.query('SELECT * FROM Orders WHERE ID_User = ?', [ID_User]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Gagal mengambil data order.' });
    }
};

const getOrderById = async (req, res) => {
    const { ID_Order } = req.params;

    try {
        const [results] = await db.query('SELECT * FROM Orders WHERE ID_Order = ?', [ID_Order]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan.' });
        }
        res.status(200).json(results[0]);
    } catch (err) {
        console.error('Error fetching order by ID:', err);
        res.status(500).json({ message: 'Gagal mengambil detail order.' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        // Query untuk join antara Orders, Users, dan Shipment
        const query = `
            SELECT Orders.*, Users.Username, Shipment.TrackingNumber 
            FROM Orders
            JOIN Users ON Orders.ID_User = Users.ID_User
            LEFT JOIN Shipment ON Orders.ID_Shipment = Shipment.ID_Shipment
        `;
        
        const [results] = await db.query(query);
        
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching all orders with user and shipment information:', err);
        res.status(500).json({ message: 'Gagal mengambil semua data order dengan informasi pengguna dan pengiriman.' });
    }
};

const updateOrderStatus = async (req, res) => {
    const { ID_Order } = req.params;
    const { status } = req.body;

    // Tambahkan semua status yang ada di frontend ke validasi backend
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status tidak valid.' });
    }

    try {
        await db.query('UPDATE Orders SET OrderStatus = ? WHERE ID_Order = ?', [status, ID_Order]);
        res.status(200).json({ message: `Status order berhasil diubah menjadi ${status}.` });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ message: 'Gagal mengupdate status order.' });
    }
};

const confirmOrderReceived = async (req, res) => {
    const { ID_Order } = req.params;
    const ID_User = req.user.id;

    try {
        const [results] = await db.query('SELECT * FROM Orders WHERE ID_Order = ? AND ID_User = ?', [ID_Order, ID_User]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan atau bukan milik Anda.' });
        }

        if (results[0].OrderStatus !== 'shipped') {
            return res.status(400).json({ message: 'Hanya bisa mengkonfirmasi order yang sedang diantar.' });
        }

        await db.query('UPDATE Orders SET UserConfirmed = true WHERE ID_Order = ?', [ID_Order]);
        await db.query('UPDATE Orders SET OrderStatus = "Completed" WHERE ID_Order = ?', [ID_Order]);

        res.status(200).json({ message: 'Order berhasil dikonfirmasi sudah diterima.' });
    } catch (err) {
        console.error('Error confirming order received:', err);
        res.status(500).json({ message: 'Gagal mengkonfirmasi penerimaan order.' });
    }
};

// Controller untuk mendapatkan order berdasarkan ID_ArtRequest
const getOrderByArtRequestId = async (req, res) => {
    const { ID_ArtRequest } = req.params;

    try {
        const [results] = await db.query('SELECT * FROM Orders WHERE ID_ArtRequest = ?', [ID_ArtRequest]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan untuk ID ArtRequest tersebut.' });
        }
        res.status(200).json(results[0]);
    } catch (err) {
        console.error('Error fetching order by ID_ArtRequest:', err);
        res.status(500).json({ message: 'Gagal mengambil order berdasarkan ID ArtRequest.' });
    }
};

const getShippedOrdersCount = async (req, res) => {
    const ID_User = req.user.id;

    try {
        const [results] = await db.query(`
            SELECT COUNT(*) AS shippedCount
            FROM Orders
            WHERE ID_User = ? AND OrderStatus = 'shipped'
        `, [ID_User]);

        res.status(200).json({ shippedCount: results[0].shippedCount });
    } catch (error) {
        console.error('Error fetching shipped orders:', error);
        res.status(500).json({ message: 'Failed to fetch shipped orders.' });
    }
};

const updateTrackingNumber = async (req, res) => {
    const { ID_Order } = req.params;
    const { trackingNumber } = req.body;

    try {
        // Pastikan order yang di-update berstatus 'paid'
        const [orderResult] = await db.query(`SELECT * FROM Orders WHERE ID_Order = ? AND (OrderStatus = "paid" OR OrderStatus = 'shipped')`, [ID_Order]);

        if (orderResult.length === 0) {
            return res.status(400).json({ message: 'Order tidak ditemukan atau belum berstatus paid.' });
        }

        // Update TrackingNumber pada tabel Shipment
        await db.query('UPDATE Shipment SET TrackingNumber = ? WHERE ID_Shipment = ?', [trackingNumber, orderResult[0].ID_Shipment]);

        res.status(200).json({ message: 'Tracking number berhasil diperbarui.' });
    } catch (err) {
        console.error('Error updating tracking number:', err);
        res.status(500).json({ message: 'Gagal memperbarui tracking number.' });
    }
};

const cancelOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        // Query untuk mencari order berdasarkan ID
        const [order] = await db.query('SELECT * FROM orders WHERE ID_Order = ?', [orderId]);
        
        // Pastikan order ditemukan dan statusnya bisa dibatalkan
        if (order.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order[0].OrderStatus !== 'pending') {
            return res.status(400).json({ message: "Order cannot be canceled" });
        }

        // Update status order ke "cancelled"
        await db.query('UPDATE orders SET OrderStatus = ? WHERE ID_Order = ?', ['cancelled', orderId]);

        return res.status(200).json({ message: "Order has been canceled successfully" });
    } catch (error) {
        console.error("Error canceling order:", error);
        res.status(500).json({ message: "An error occurred while canceling the order" });
    }
};

module.exports = {
    createOrder,
    getOrdersByCustomer,
    getOrderById,
    getAllOrders,
    cancelOrder,
    updateOrderStatus,
    confirmOrderReceived,
    getOrderByArtRequestId,
    getShippedOrdersCount,
    updateTrackingNumber
};
