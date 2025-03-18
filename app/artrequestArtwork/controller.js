const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const db = require('../../database/database');

// Create
const createArtRequestCustomArtwork = async (req, res) => {
    try {
        console.log("Mulai proses createArtRequestCustomArtwork");

        // Log data yang diterima dari permintaan
        console.log("Data yang diterima:", {
            body: req.body,
            user: req.user // Pastikan req.user berisi ID_User
        });

        const { Title_Artwork, Description, Category, Height, Width, Media } = req.body;
        const ID_User = req.user ? req.user.id : null; // Pastikan ID_User diambil dari token yang valid
        console.log("ID_User:", ID_User);
        
        // Validasi input
        if (!Title_Artwork || !ID_User || !Height || !Width || !Media) {
            console.error('Validasi gagal: Title_Artwork, ID_User, Height, Width, dan Media harus diisi.');
            return res.status(400).json({ message: 'Title_Artwork, ID_User, Height, Width, dan Media harus diisi.' });
        }

        console.log("Input valid: ", { Title_Artwork, Description, Category, Height, Width, Media, ID_User });

        let requestImage = null;

        // Proses gambar jika ada
        if (req.file) {
            console.log("File gambar ditemukan, memproses gambar...");

            try {
                const imageBuffer = req.file.buffer; // Ambil file gambar dalam buffer

                // Menentukan nama file kompresi dengan timestamp
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                requestImage = `${uniqueSuffix}${path.extname(req.file.originalname)}`;

                // Menggunakan sharp untuk mengkompres gambar
                const compressedImageBuffer = await sharp(imageBuffer)
                    .resize(800) // Resize gambar jika perlu (misalnya lebar 800px)
                    .jpeg({ quality: 80 }) // Atur kualitas untuk kompresi
                    .toBuffer(); // Menghasilkan buffer dari gambar yang sudah dikompresi

                // Tentukan direktori penyimpanan gambar kompresi
                const dirPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'artwork');
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true }); // Membuat folder jika belum ada
                    console.log('Direktori untuk menyimpan gambar dibuat:', dirPath);
                }

                // Tentukan path untuk gambar terkompresi
                const compressedFilePath = path.join(dirPath, requestImage);

                // Menyimpan file kompresi di disk
                await fs.promises.writeFile(compressedFilePath, compressedImageBuffer);
                console.log('Gambar terkompresi berhasil disimpan:', compressedFilePath);

            } catch (err) {
                console.error("Kesalahan saat memproses gambar:", err);
                return res.status(500).json({ message: 'Kesalahan saat memproses gambar.' });
            }
        } else {
            console.error('File gambar tidak ditemukan.');
            return res.status(400).json({ message: 'File gambar harus diupload.' });
        }

        // Simpan Artwork Custom Request di database dengan status default 'pending'
        const query = `
            INSERT INTO ArtworkCustom (ID_User, Title_Artwork, Description, RequestImage, Status, Category)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [ID_User, Title_Artwork, Description || null, requestImage, 'pending', Category || 'Animal'];

        console.log("Menyimpan data ke database dengan nilai:", values);

        const [result] = await db.query(query, values);
        console.log('Permintaan artwork custom berhasil dibuat dengan ID:', result.insertId);

        // Simpan detail artwork ke tabel ArtworkDetails
        
        const artworkDetailQuery = `
            INSERT INTO ArtworkDetails (ID_Artwork, Height, Width, Media, ID_ArtworkCustom, Type)
            VALUES (?, ?, ?, ?, ?,'artworkcustom')
        `;
        const artworkDetailValues = [null, Height, Width, Media, result.insertId]; // ID_Artwork diisi null untuk custom artwork

        await db.query(artworkDetailQuery, artworkDetailValues);
        console.log('Detail artwork berhasil disimpan.');

        res.status(201).json({ 
            message: 'Permintaan artwork custom berhasil dibuat.', 
            ID_ArtworkCustom: result.insertId 
        });
    } catch (err) {
        console.error('Kesalahan saat membuat permintaan artwork custom:', err);
        res.status(500).json({ message: 'Gagal membuat permintaan artwork custom.' });
    }
};

// Read All
const getAllArtRequestCustomArtwork = async (req, res) => {
    try {
        const query = 'SELECT * FROM ArtworkCustom';
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('Kesalahan saat mengambil semua permintaan artwork custom:', err);
        res.status(500).json({ message: 'Gagal mengambil semua permintaan artwork custom.' });
    }
};

// Read by User ID
const getArtRequestCustomArtworkByCustomer = async (req, res) => {
    const ID_User = req.user.id; // Ambil ID pengguna dari token

    try {
        const query = `
            SELECT 
                ArtworkCustom.ID_ArtworkCustom,
                ArtworkCustom.Title_artwork,
                ArtworkCustom.Description,
                ArtworkCustom.Category,
                ArtworkCustom.Status,
                ArtworkCustom.Created_At,
                ArtworkCustom.Updated_At,
                ArtworkDetails.ID_Detail,  -- Menambahkan ID_Detail dari ArtworkDetail
                ArtworkDetails.Price,        -- Menambahkan harga dari ArtworkDetail
                ArtworkDetails.Weight,       -- Menambahkan berat dari ArtworkDetail
                ArtworkDetails.Width,        -- Menambahkan lebar dari ArtworkDetail
                ArtworkDetails.Height,       -- Menambahkan tinggi dari ArtworkDetail
                ArtworkDetails.Media         -- Menambahkan media dari ArtworkDetail
            FROM 
                ArtworkCustom
            JOIN 
                ArtworkDetails ON ArtworkCustom.ID_ArtworkCustom = ArtworkDetails.ID_ArtworkCustom
            WHERE 
                ArtworkCustom.ID_User = ?;`;

        const [results] = await db.query(query, [ID_User]); // Eksekusi query dengan ID_User sebagai parameter

        if (results.length === 0) {
            return res.status(404).json({ message: 'Tidak ada permintaan artwork custom ditemukan.' });
        }

        return res.status(200).json(results); // Mengembalikan hasil query
    } catch (error) {
        console.error('Error fetching artwork requests:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data.' });
    }
};



// Update
const updateArtRequestCustomArtwork = async (req, res) => {
    try {
        const { id } = req.params;
        const { Status, Weight, Price } = req.body;

        // Log data yang diterima
        console.log("Data yang diterima untuk pembaruan:", req.body);
        
        // Validasi input
        if (!id || !Status) {
            return res.status(400).json({ message: 'ID dan Status harus diisi.' });
        }

        // Query untuk memperbarui status di ArtworkCustom
        const query = `
            UPDATE ArtworkCustom 
            SET Status = ?
            WHERE ID_ArtworkCustom = ?
        `;
        const values = [Status, id];

        // Menjalankan query untuk memperbarui status
        const [result] = await db.query(query, values);

        // Memeriksa apakah ada baris yang terpengaruh
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Artwork tidak ditemukan.' });
        }

        // Jika Weight dan Price disediakan, perbarui di ArtworkDetails
        if (Weight !== undefined && Price !== undefined) {
            const detailQuery = `
                UPDATE ArtworkDetails 
                SET Weight = ?, Price = ?
                WHERE ID_ArtworkCustom = ?
            `;
            const detailValues = [Weight, Price, id]; // Menggunakan ID_ArtworkCustom untuk mengupdate

            const [detailResult] = await db.query(detailQuery, detailValues);

            if (detailResult.affectedRows === 0) {
                return res.status(404).json({ message: 'Detail artwork tidak ditemukan.' });
            }
        }

        res.status(200).json({ message: 'Permintaan artwork berhasil diperbarui.' });
    } catch (err) {
        console.error('Kesalahan saat memperbarui permintaan artwork custom:', err);
        res.status(500).json({ message: 'Gagal memperbarui permintaan artwork custom.' });
    }
};

// Delete
const deleteArtRequestCustomArtwork = async (req, res) => {
    try {
        const { id } = req.params;

        // Validasi input
        if (!id) {
            return res.status(400).json({ message: 'ID harus diisi.' });
        }

        const query = 'DELETE FROM ArtworkCustom WHERE ID_ArtworkCustom = ?';
        const values = [id];

        await db.query(query, values);
        res.status(200).json({ message: 'Permintaan artwork custom berhasil dihapus.' });
    } catch (err) {
        console.error('Kesalahan saat menghapus permintaan artwork custom:', err);
        res.status(500).json({ message: 'Gagal menghapus permintaan artwork custom.' });
    }
};

module.exports = {
    createArtRequestCustomArtwork,
    getAllArtRequestCustomArtwork,
    getArtRequestCustomArtworkByCustomer,
    updateArtRequestCustomArtwork,
    deleteArtRequestCustomArtwork
};