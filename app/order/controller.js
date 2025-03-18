const db = require('../../database/database');

    const createOrder = async (req, res) => {
        try {
            const { ID_Artwork, ID_ArtworkDetail, ID_Address, ID_Shipment } = req.body;
            const ID_User = req.user.id;

            // Ambil data ArtworkDetails untuk mendapatkan harga
            const [artworkDetailResults] = await db.query(
                'SELECT Price FROM ArtworkDetails WHERE ID_Artwork = ? AND ID_Detail = ?',
                [ID_Artwork, ID_ArtworkDetail]
            );

            if (artworkDetailResults.length === 0) {
                return res.status(400).json({ message: 'Artwork detail tidak ditemukan.' });
            }

            const artworkPrice = parseFloat(artworkDetailResults[0].Price); // pastikan ini angka

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
                INSERT INTO Orders (ID_User, ID_Address, ID_Artwork, ID_ArtworkDetail, ID_Shipment, TotalPrice, OrderStatus, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
            `;
            const [result] = await db.query(orderQuery, [ID_User, ID_Address, ID_Artwork, ID_ArtworkDetail, ID_Shipment, totalPrice]);

            res.status(201).json({ message: 'Order berhasil dibuat.', ID_Order: result.insertId });
        } catch (err) {
            console.error('Kesalahan saat membuat order:', err);
            res.status(500).json({ message: 'Gagal membuat order.', error: err.message });
        }
    };
    const createOrderArtworkCustom = async (req, res) => {
        try {
            // Destructuring data dari request body dan user ID dari request object
            const { ID_ArtworkCustom, ID_ArtworkDetail, ID_Address, ID_Shipment } = req.body;
            const ID_User = req.user.id;
    
            // Log untuk memeriksa data yang diterima
            console.log("Received data:", req.body);
    
            // Validasi input untuk memastikan semua field wajib ada dan memiliki tipe data yang benar
            if (!ID_ArtworkCustom || !ID_ArtworkDetail || !ID_Address || !ID_Shipment) {
                return res.status(400).json({ message: 'Semua field harus diisi.' });
            }
    
            // Memastikan ID adalah angka
            if (typeof ID_ArtworkCustom !== 'number' || typeof ID_ArtworkDetail !== 'number' || typeof ID_Address !== 'number' || typeof ID_Shipment !== 'number') {
                return res.status(400).json({ message: 'ID harus berupa angka.' });
            }
    
            // Log untuk memeriksa ID yang diterima
            console.log("User ID:", ID_User);
            console.log("Artwork Custom ID:", ID_ArtworkCustom);
            console.log("Artwork Detail ID:", ID_ArtworkDetail);
            console.log("Address ID:", ID_Address);
            console.log("Shipment ID:", ID_Shipment);
    
            // Mengambil data ArtworkDetails untuk mendapatkan harga
            const [artworkDetailResults] = await db.query(
                'SELECT Price FROM ArtworkDetails WHERE ID_ArtworkCustom = ? AND ID_Detail = ?',
                [ID_ArtworkCustom, ID_ArtworkDetail]
            );
    
            // Memeriksa apakah data artwork detail ditemukan
            if (artworkDetailResults.length === 0) {
                return res.status(400).json({ message: 'Artwork detail tidak ditemukan.' });
            }
    
            // Mengambil harga dan memastikan tipe datanya adalah angka
            const artworkPrice = parseFloat(artworkDetailResults[0].Price);
            if (isNaN(artworkPrice)) {
                return res.status(500).json({ message: 'Harga artwork tidak valid.' });
            }
    
            // Mengambil biaya pengiriman dari tabel Shipment
            const [shipmentResults] = await db.query(
                'SELECT Cost FROM Shipment WHERE ID_Shipment = ?',
                [ID_Shipment]
            );
    
            // Memeriksa apakah data pengiriman ditemukan
            if (shipmentResults.length === 0) {
                return res.status(400).json({ message: 'Data pengiriman tidak ditemukan.' });
            }
    
            // Mengambil biaya pengiriman dan memastikan tipe datanya adalah angka
            const shippingCost = parseFloat(shipmentResults[0].Cost);
            if (isNaN(shippingCost)) {
                return res.status(500).json({ message: 'Biaya pengiriman tidak valid.' });
            }
    
            // Menghitung total harga termasuk biaya pengiriman dan membulatkannya ke 2 desimal
            const totalPrice = (artworkPrice + shippingCost).toFixed(2);
    
            // Menyiapkan query untuk menyimpan data order ke dalam database
            const orderQuery = `
                INSERT INTO Orders (ID_User, ID_Address, ID_ArtworkCustom, ID_ArtworkDetail, ID_Shipment, TotalPrice, OrderStatus, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
            `;
    
            // Menjalankan query dan mendapatkan hasilnya
            const [result] = await db.query(orderQuery, [ID_User, ID_Address, ID_ArtworkCustom, ID_ArtworkDetail, ID_Shipment, totalPrice]);
    
            // Log untuk memeriksa hasil order
            console.log("Order created successfully with ID:", result.insertId);
    
            // Mengirimkan respons sukses dengan ID order yang baru dibuat
            res.status(201).json({ message: 'Order berhasil dibuat.', ID_Order: result.insertId });
        } catch (err) {
            // Menangani kesalahan yang terjadi selama proses pembuatan order
            console.error('Kesalahan saat membuat order:', err);
            res.status(500).json({ message: 'Gagal membuat order.', error: err.message });
        }
    };

    const getOrdersByCustomer = async (req, res) => {
        const ID_User = req.user.id;
    
        try {
            const query = `
                SELECT 
                    o.ID_Order,
                    o.ID_User,
                    o.ID_Address,
                    o.ID_Shipment,
                    o.TotalPrice,
                    o.OrderStatus,
                    o.UserConfirmed,
                    o.CreatedAt,
                    o.UpdatedAt,
                    s.TrackingNumber,
                    s.Courier,
                    s.Service,
                    COALESCE(a.Title_artwork, ac.Title_artwork) AS ArtworkTitle,
                    CASE
                        WHEN o.ID_Artwork IS NOT NULL THEN 'artwork'
                        WHEN o.ID_ArtworkCustom IS NOT NULL THEN 'artworkcustom'
                    END AS Type
                FROM orders o
                LEFT JOIN shipment s ON o.ID_Shipment = s.ID_Shipment
                LEFT JOIN artwork a ON o.ID_Artwork = a.ID_Artwork
                LEFT JOIN artworkcustom ac ON o.ID_ArtworkCustom = ac.ID_ArtworkCustom
                WHERE o.ID_User = ?
                ORDER BY o.CreatedAt DESC
            `;
    
            const [results] = await db.query(query, [ID_User]);
    
            // Transformasi format response
            const formattedOrders = results.map(order => ({
                ...order,
                ArtworkTitle: order.ArtworkTitle || 'No Title Available',
                TotalPrice: parseFloat(order.TotalPrice).toLocaleString('id-ID')
            }));
    
            res.status(200).json(formattedOrders);
    
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({
                message: 'Gagal mengambil data order',
                error: err.message,
                solution: 'Pastikan ID_Artwork/ID_ArtworkCustom valid di tabel orders'
            });
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
                SELECT 
                    Orders.*, 
                    Users.Username, 
                    Shipment.TrackingNumber, 
                    Shipment.Courier, 
                    Shipment.Service
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
    getShippedOrdersCount,
    updateTrackingNumber,
    createOrderArtworkCustom
};
