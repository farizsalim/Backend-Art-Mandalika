const db = require('../../database/database');
const axios = require('axios');

const createPaymentCustom = async (req, res) => {
    try {
        const { transaction_details, payment_type, bank_transfer } = req.body;
        const { order_id } = transaction_details;

        // Ambil data order berdasarkan ID_Order
        const [orderResults] = await db.query('SELECT TotalPrice, ID_User, ID_ArtworkCustom, ID_ArtworkDetail, Title FROM Orders WHERE ID_Order = ?', [order_id]);
        if (orderResults.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan.' });
        }

        const { TotalPrice, ID_User, ID_ArtworkCustom, ID_ArtworkDetail, Title } = orderResults[0];

        // Ambil data artwork terkait ID_ArtworkCustom dan ID_ArtworkDetail
        const [artworkResults] = await db.query('SELECT Price FROM ArtworkDetails WHERE ID_ArtworkCustom = ? AND ID_Detail = ?', [ID_ArtworkCustom, ID_ArtworkDetail]);
        if (artworkResults.length === 0) {
            return res.status(404).json({ message: 'Detail karya seni tidak ditemukan.' });
        }

        const { Price } = artworkResults[0];

        // Ambil data pengguna terkait order
        const [userResults] = await db.query('SELECT Username, Email, Phone_Number FROM Users WHERE ID_User = ?', [ID_User]);
        if (userResults.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        const user = userResults[0];

        // Biaya administrasi per metode pembayaran
        const adminFees = {
            'credit_card': 5000,
            'bank_transfer': 3000,
            'gopay': 2000,
            'shopeepay': 2500,
            'echannel': 3500,
            'qris': 1500
        };

        const grossAmount = Math.round(TotalPrice);

        // Susun item_details berdasarkan data artwork
        let itemDetails = [{
            id: ID_ArtworkCustom,
            name: Title || 'Artwork',  // Gunakan Title dari tabel Orders
            price: grossAmount, // Harga asli tanpa admin fee
            quantity: 1
        }];

        // Buat payload untuk Midtrans
        let paymentPayload = {
            transaction_details: {
                order_id: order_id,
                gross_amount: grossAmount
            },
            item_details: itemDetails,
            payment_type: payment_type,
            customer_details: {
                first_name: user.Username.split(' ')[0] || 'Customer',
                last_name: user.Username.split(' ')[1] || '',
                email: user.Email,
                phone: user.Phone_Number
            }
        };

        // Tambahkan biaya admin berdasarkan metode pembayaran
        const adminFee = adminFees[payment_type];
        const realPrice = grossAmount + adminFee;

        // Update item_details dengan harga setelah admin fee
        itemDetails = [{
            id: ID_ArtworkCustom,
            name: Title || 'Artwork',  // Gunakan Title dari tabel Orders
            price: realPrice,
            quantity: 1
        }];

        paymentPayload = {
            transaction_details: {
                order_id: order_id,
                gross_amount: realPrice
            },
            item_details: itemDetails,
            payment_type: payment_type,
            customer_details: {
                first_name: user.Username.split(' ')[0] || 'Customer',
                last_name: user.Username.split(' ')[1] || '',
                email: user.Email,
                phone: user.Phone_Number
            }
        };

        // Tambahkan properti tambahan jika payment_type adalah 'bank_transfer'
        if (payment_type === 'bank_transfer') {
            paymentPayload.bank_transfer = bank_transfer;
        }

        // Kirim permintaan ke Midtrans
        const response = await axios.post('https://api.sandbox.midtrans.com/v2/charge', paymentPayload, {
            headers: {
                Authorization: `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        // Simpan data pembayaran ke database jika respons berhasil
        const paymentData = {
            ID_Order: order_id,
            TransactionID: response.data.transaction_id,
            PaymentType: payment_type,
            GrossAmount: realPrice,
            PaymentStatus: response.data.transaction_status,
            Bank: bank_transfer?.bank || null,
            VANumber: response.data.va_numbers && response.data.va_numbers.length > 0
                        ? response.data.va_numbers[0].va_number // Cek jika ada di va_numbers
                        : (response.data.permata_va_number ? response.data.permata_va_number // Cek permata_va_number
                        : null), // Jika tidak ada, diisi null
            ExpiryTime: response.data.expiry_time || null
        };
        
        await db.query('INSERT INTO Payment SET ?', paymentData);

        res.status(200).json({ message: 'Payment created successfully.', data: response.data });
    } catch (error) {
        console.error('Kesalahan saat memproses pembayaran:', error);
        res.status(500).json({ message: 'Gagal memproses pembayaran.', error: error.message });
    }
};


const createPayment = async (req, res) => {
    try {
        const { transaction_details, payment_type, bank_transfer } = req.body;
        const { order_id } = transaction_details;

        // Ambil data order berdasarkan ID_Order
        const [orderResults] = await db.query('SELECT TotalPrice, ID_User, ID_Artwork, ID_ArtworkDetail, Title FROM Orders WHERE ID_Order = ?', [order_id]);
        if (orderResults.length === 0) {
            return res.status(404).json({ message: 'Order tidak ditemukan.' });
        }

        const { TotalPrice, ID_User, ID_Artwork, ID_ArtworkDetail, Title } = orderResults[0];

        // Ambil data artwork terkait ID_Artwork dan ID_ArtworkDetail
        const [artworkResults] = await db.query('SELECT Price FROM ArtworkDetails WHERE ID_Artwork = ? AND ID_Detail = ?', [ID_Artwork, ID_ArtworkDetail]);
        if (artworkResults.length === 0) {
            return res.status(404).json({ message: 'Detail karya seni tidak ditemukan.' });
        }

        const { Price } = artworkResults[0];

        // Ambil data pengguna terkait order
        const [userResults] = await db.query('SELECT Username, Email, Phone_Number FROM Users WHERE ID_User = ?', [ID_User]);
        if (userResults.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        const user = userResults[0];

        // Biaya administrasi per metode pembayaran
        const adminFees = {
            'credit_card': 5000,
            'bank_transfer': 3000,
            'gopay': 2000,
            'shopeepay': 2500,
            'echannel': 3500,
            'qris': 1500
        };

        const grossAmount = Math.round(TotalPrice);

        // Susun item_details berdasarkan data artwork
        let itemDetails = [{
            id: ID_Artwork,
            name: Title || 'Artwork',  // Gunakan Title dari tabel Orders
            price: grossAmount, // Harga asli tanpa admin fee
            quantity: 1
        }];

        // Buat payload untuk Midtrans
        let paymentPayload = {
            transaction_details: {
                order_id: order_id,
                gross_amount: grossAmount
            },
            item_details: itemDetails,
            payment_type: payment_type,
            customer_details: {
                first_name: user.Username.split(' ')[0] || 'Customer',
                last_name: user.Username.split(' ')[1] || '',
                email: user.Email,
                phone: user.Phone_Number
            }
        };

        // Tambahkan biaya admin berdasarkan metode pembayaran
        const adminFee = adminFees[payment_type];
        const realPrice = grossAmount + adminFee;

        // Update item_details dengan harga setelah admin fee
        itemDetails = [{
            id: ID_Artwork,
            name: Title || 'Artwork',  // Gunakan Title dari tabel Orders
            price: realPrice,
            quantity: 1
        }];

        paymentPayload = {
            transaction_details: {
                order_id: order_id,
                gross_amount: realPrice
            },
            item_details: itemDetails,
            payment_type: payment_type,
            customer_details: {
                first_name: user.Username.split(' ')[0] || 'Customer',
                last_name: user.Username.split(' ')[1] || '',
                email: user.Email,
                phone: user.Phone_Number
            }
        };

        // Tambahkan properti tambahan jika payment_type adalah 'bank_transfer'
        if (payment_type === 'bank_transfer') {
            paymentPayload.bank_transfer = bank_transfer;
        }

        // Kirim permintaan ke Midtrans
        const response = await axios.post('https://api.sandbox.midtrans.com/v2/charge', paymentPayload, {
            headers: {
                Authorization: `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        // Simpan data pembayaran ke database jika respons berhasil
        const paymentData = {
            ID_Order: order_id,
            TransactionID: response.data.transaction_id,
            PaymentType: payment_type,
            GrossAmount: realPrice,
            PaymentStatus: response.data.transaction_status,
            Bank: bank_transfer?.bank || null,
            VANumber: response.data.va_numbers && response.data.va_numbers.length > 0
                        ? response.data.va_numbers[0].va_number // Cek jika ada di va_numbers
                        : (response.data.permata_va_number ? response.data.permata_va_number // Cek permata_va_number
                        : null), // Jika tidak ada, diisi null
            ExpiryTime: response.data.expiry_time || null
        };
        
        await db.query('INSERT INTO Payment SET ?', paymentData);

        res.status(200).json({ message: 'Payment created successfully.', data: response.data });
    } catch (error) {
        console.error('Kesalahan saat memproses pembayaran:', error);
        res.status(500).json({ message: 'Gagal memproses pembayaran.', error: error.message });
    }
};



const handleMidtransNotification = async (req, res) => {
    try {
        const notification = req.body;

        // Log notifikasi yang diterima untuk debugging
        console.log('Notifikasi yang diterima dari Midtrans:', JSON.stringify(notification, null, 2));

        const { transaction_status, order_id, payment_type, transaction_id, va_numbers, settlement_time } = notification;
        let paymentStatus;

        // Log detail transaksi yang diterima
        console.log('Detail transaksi:', {
            transaction_status,
            order_id,
            payment_type,
            transaction_id,
            va_numbers,
            settlement_time
        });

        // Tentukan status pembayaran berdasarkan status transaksi dari Midtrans
        switch (transaction_status) {
            case 'settlement':
                paymentStatus = 'completed';
                console.log('Status transaksi diubah menjadi completed.');
                break;
            case 'capture':
                paymentStatus = payment_type === 'credit_card' && notification.fraud_status === 'challenge' ? 'challenge' : 'completed';
                console.log('Status transaksi diubah menjadi:', paymentStatus);
                break;
            case 'pending':
                paymentStatus = 'pending';
                console.log('Status transaksi diubah menjadi pending.');
                break;
            case 'deny':
            case 'cancel':
            case 'expire':
                paymentStatus = 'failed';
                console.log('Status transaksi diubah menjadi failed.');
                break;
            default:
                console.log('Status transaksi tidak dikenal:', transaction_status);
                paymentStatus = 'unknown';
                break;
        }

        // Log status pembayaran yang diupdate
        console.log('Status pembayaran yang akan diupdate:', paymentStatus);

        // Update status di tabel Payment
        const updatePaymentResult = await db.query(`
            UPDATE Payment
            SET PaymentStatus = ?, UpdatedAt = NOW()
            WHERE ID_Order = ?
        `, [paymentStatus, order_id]);

        // Log hasil update tabel Payment
        if (updatePaymentResult.affectedRows === 0) {
            console.error('ID_Order tidak ditemukan saat memperbarui Payment:', order_id);
            return res.status(404).json({ message: 'ID_Order tidak ditemukan.' });
        } else {
            console.log('Status Payment berhasil diperbarui untuk ID_Order:', order_id);
        }

        // Update status di tabel Orders jika pembayaran selesai
        if (paymentStatus === 'completed') {
            const updateOrderResult = await db.query(`
                UPDATE Orders
                SET OrderStatus = 'Paid', UpdatedAt = NOW()
                WHERE ID_Order = ?
            `, [order_id]);

            // Log hasil update tabel Orders
            if (updateOrderResult.affectedRows === 0) {
                console.error('ID_Order tidak ditemukan saat memperbarui Orders:', order_id);
                return res.status(404).json({ message: 'ID_Order tidak ditemukan di Orders.' });
            } else {
                console.log('Status Order berhasil diperbarui untuk ID_Order:', order_id);
                
                // Ambil ID_Artwork dari order
                const [orderDetails] = await db.query('SELECT ID_Artwork FROM Orders WHERE ID_Order = ?', [order_id]);
                if (orderDetails.length > 0) {
                    const ID_Artwork = orderDetails[0].ID_Artwork;

                    // Panggil fungsi untuk memperbarui status artwork
                    await updateArtworkStatus({ params: { ID_Artwork } }, res);
                }
            }
        }

        // Kirim respons sukses ke Midtrans
        console.log('Notifikasi berhasil diproses.');
        res.status(200).json({ message: 'Notifikasi diproses' });
    } catch (error) {
        console.error('Kesalahan saat memproses notifikasi Midtrans:', error);
        res.status(500).json({ message: 'Gagal memproses notifikasi' });
    }
};


const getPayment = async (req, res) => {
    try {
        const { id_Order } = req.params;

        // Query the Payment table to get the payment details based on ID_Payment
        const [paymentResults] = await db.query('SELECT * FROM Payment WHERE ID_Order = ?', [id_Order]);

        if (paymentResults.length === 0) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        res.status(200).json({ data: paymentResults[0] });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ message: 'Failed to fetch payment details.', error: error.message });
    }
};
module.exports = {
    createPayment,
    handleMidtransNotification,
    getPayment,
    createPaymentCustom
}
