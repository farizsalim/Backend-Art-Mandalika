const db = require('../../database/database');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');

const addArtworkByArtist = async (req, res) => {
    const { title, description, status, category, details } = req.body;
    const id_creator = req.user.id;  // Artist adalah creator dan uploader
    const id_uploader = req.user.id; // Artist juga yang mengupload

    // Pastikan required fields ada
    if (!title || !status || !category) {
        return res.status(400).json({ message: 'Title, Status, dan Category harus diisi.' });
    }

    // Log untuk debug
    console.log('Req body sebelum validasi details:', req.body);

    // Validasi apakah details adalah array
    if (!Array.isArray(details) || details.length === 0) {
        console.log('Details tidak valid:', details);
        return res.status(400).json({ message: 'Details harus berupa array yang valid.' });
    }

    // Validasi setiap detail
    for (const detail of details) {
        console.log('Memvalidasi detail:', detail);
        if (!detail.width || !detail.height || !detail.price || !detail.media) {
            return res.status(400).json({ message: 'Setiap detail harus memiliki width, height, price, dan media.' });
        }
    }

    let artworkImage = null;

    // Proses gambar jika ada
    if (req.file) {
        try {
            // File yang diupload disimpan dalam memori, langsung diakses via req.file.buffer
            const imageBuffer = req.file.buffer; // Ambil file gambar dalam buffer

            // Menentukan nama file kompresi dengan timestamp
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const compressedFileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;

            // Menggunakan sharp untuk mengkompres gambar
            const compressedImageBuffer = await sharp(imageBuffer)
                .resize(800) // Resize gambar jika perlu (misalnya lebar 800px)
                .jpeg({ quality: 80 }) // Atur kualitas untuk kompresi
                .toBuffer(); // Menghasilkan buffer dari gambar yang sudah dikompresi

            // Tentukan direktori penyimpanan gambar kompresi
            const dirPath = path.join(__dirname, '..','..','public', 'uploads', 'artwork');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true }); // Membuat folder jika belum ada
            }

            // Tentukan path untuk gambar terkompresi
            const compressedFilePath = path.join(dirPath, compressedFileName);

            // Menyimpan file kompresi di disk
            await fs.promises.writeFile(compressedFilePath, compressedImageBuffer);
            console.log('Gambar terkompresi berhasil disimpan:', compressedFilePath);

            artworkImage = compressedFileName; // Gunakan gambar yang sudah dikompresi

        } catch (err) {
            console.error("Kesalahan saat memproses gambar:", err);
            return res.status(500).json({ message: 'Kesalahan saat memproses gambar.' });
        }
    }

    try {
        // Menambahkan data ke tabel Artwork
        const artworkQuery = `
            INSERT INTO Artwork (Title_Artwork, ID_Creator, ID_Uploader, Description, ArtworkImage, Status, Category) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const artworkValues = [title, id_creator, id_uploader, description || '', artworkImage, status, category];
        const [result] = await db.query(artworkQuery, artworkValues);

        const artworkId = result.insertId;

        // Menambahkan data ke tabel ArtworkDetails
        const detailValues = details.map(detail => {
            const { width, height, weight, price, media } = detail;

            // Konversi nilai ke angka (jika diperlukan)
            return [
                artworkId,
                parseFloat(height),
                parseFloat(width),
                weight ? parseFloat(weight) : null,
                parseFloat(price),
                media
            ];
        });

        console.log('Detail values untuk database:', detailValues);

        const detailQuery = `
            INSERT INTO ArtworkDetails (ID_Artwork, Height, Width, Weight, Price, Media) 
            VALUES ?
        `;
        await db.query(detailQuery, [detailValues]);

        res.status(201).json({ message: 'Artwork dan detail berhasil ditambahkan oleh artist.', artworkId });
    } catch (err) {
        console.error("Kesalahan saat menyimpan data artwork:", err);
        res.status(500).json({ message: 'Kesalahan saat menyimpan data artwork.' });
    }
};

const addArtworkByAdmin = async (req, res) => {
    const { title, id_creator, description, status, category, details } = req.body;
    const id_uploader = req.user.id;

    // Pastikan required fields ada
    if (!title || !id_creator || !status || !category) {
        return res.status(400).json({ message: 'Title, ID_Creator, Status, dan Category harus diisi.' });
    }

    // Log untuk debug
    console.log('Req body sebelum validasi details:', req.body);

    // Validasi apakah details adalah array
    if (!Array.isArray(details) || details.length === 0) {
        console.log('Details tidak valid:', details);
        return res.status(400).json({ message: 'Details harus berupa array yang valid.' });
    }

    // Validasi setiap detail
    for (const detail of details) {
        console.log('Memvalidasi detail:', detail);
        if (!detail.width || !detail.height || !detail.price || !detail.media) {
            return res.status(400).json({ message: 'Setiap detail harus memiliki width, height, price, dan media.' });
        }
    }

    let artworkImage = null;

    // Proses gambar jika ada
    if (req.file) {
        try {
            // File yang diupload disimpan dalam memori, langsung diakses via req.file.buffer
            const imageBuffer = req.file.buffer; // Ambil file gambar dalam buffer

            // Menentukan nama file kompresi dengan timestamp
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const compressedFileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;

            // Menggunakan sharp untuk mengkompres gambar
            const compressedImageBuffer = await sharp(imageBuffer)
                .resize(800) // Resize gambar jika perlu (misalnya lebar 800px)
                .jpeg({ quality: 80 }) // Atur kualitas untuk kompresi
                .toBuffer(); // Menghasilkan buffer dari gambar yang sudah dikompresi

            // Tentukan direktori penyimpanan gambar kompresi
            const dirPath = path.join(__dirname, '..','..','public', 'uploads', 'artwork');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true }); // Membuat folder jika belum ada
            }

            // Tentukan path untuk gambar terkompresi
            const compressedFilePath = path.join(dirPath, compressedFileName);

            // Menyimpan file kompresi di disk
            await fs.promises.writeFile(compressedFilePath, compressedImageBuffer);
            console.log('Gambar terkompresi berhasil disimpan:', compressedFilePath);

            artworkImage = compressedFileName; // Gunakan gambar yang sudah dikompresi

        } catch (err) {
            console.error("Kesalahan saat memproses gambar:", err);
            return res.status(500).json({ message: 'Kesalahan saat memproses gambar.' });
        }
    }

    try {
        // Menambahkan data ke tabel Artwork
        const artworkQuery = `
            INSERT INTO Artwork (Title_Artwork, ID_Creator, ID_Uploader, Description, ArtworkImage, Status, Category) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const artworkValues = [title, id_creator, id_uploader, description || '', artworkImage, status, category];
        const [result] = await db.query(artworkQuery, artworkValues);

        const artworkId = result.insertId;

        // Menambahkan data ke tabel ArtworkDetails
        const detailValues = details.map(detail => {
            const { width, height, weight, price, media } = detail;
            return [
                artworkId,
                parseFloat(height),
                parseFloat(width),
                weight ? parseFloat(weight) : null,
                parseFloat(price),
                media,
                'artwork'  // Tambahkan type
            ];
        });

        console.log('Detail values untuk database:', detailValues);

        const detailQuery = `
            INSERT INTO ArtworkDetails (ID_Artwork, Height, Width, Weight, Price, Media, Type) 
            VALUES ?
        `;
        await db.query(detailQuery, [detailValues]);

        res.status(201).json({ message: 'Artwork dan detail berhasil ditambahkan oleh admin untuk artist.', artworkId });
    } catch (err) {
        console.error("Kesalahan saat menyimpan data artwork:", err);
        res.status(500).json({ message: 'Kesalahan saat menyimpan data artwork.' });
    }
};

const getArtworkById = async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'SELECT * FROM Artwork WHERE ID_Artwork = ?';
        const [results] = await db.query(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Karya seni tidak ditemukan.' });
        }

        // Mengirim data karya seni yang ditemukan
        res.status(200).json(results[0]);
    } catch (err) {
        console.error("Kesalahan saat mengambil data artwork:", err);
        return res.status(500).json({ message: 'Kesalahan saat mengambil data artwork.' });
    }
};

const getAllArtworks = async (req, res) => {
    try {
        const query = 'SELECT * FROM Artwork';
        const [results] = await db.query(query);

        // Mengirim data semua karya seni dalam format JSON
        res.status(200).json(results);
    } catch (err) {
        console.error("Kesalahan saat mengambil data artwork:", err);
        return res.status(500).json({ message: 'Kesalahan saat mengambil data artwork.' });
    }
};

const updateArtwork = async (req, res) => {
    const { id } = req.params;
    const { title, description, stock } = req.body;

    try {
        // Mengambil data karya seni lama untuk memeriksa gambar
        const [results] = await db.query('SELECT ArtworkImage FROM Artwork WHERE ID_Artwork = ?', [id]);
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Karya seni tidak ditemukan.' });
        }

        let artworkImage = results[0].ArtworkImage;

        // Jika ada file gambar baru, ganti gambar lama
        if (req.file) {
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            const newImageFileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;
            const newImagePath = path.join(__dirname, '../../public/uploads/artwork', newImageFileName);

            // Pindahkan gambar baru
            await fs.rename(req.file.path, newImagePath);

            // Hapus gambar lama jika ada
            if (artworkImage) {
                const oldImagePath = path.join(__dirname, '../../public/uploads/artwork', artworkImage);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.error("Kesalahan saat menghapus gambar lama:", err);
                }
            }

            // Perbarui dengan nama file gambar baru
            artworkImage = newImageFileName;
        }

        // Update data karya seni di database
        const query = `
            UPDATE Artwork 
            SET Title_Artwork = ?, Description = ?, ArtworkImage = ?, Stock = ? 
            WHERE ID_Artwork = ?
        `;
        const values = [title, description, artworkImage, stock, id];

        await db.query(query, values);

        res.status(200).json({ message: 'Data artwork berhasil diperbarui.' });
    } catch (err) {
        console.error("Kesalahan saat memperbarui data artwork:", err);
        res.status(500).json({ message: 'Kesalahan saat memperbarui data artwork.' });
    }
};

const deleteArtwork = async (req, res) => {
    const { id } = req.params;

    try {
        // Mengambil data karya seni untuk memeriksa gambar
        const [results] = await db.query('SELECT ArtworkImage FROM Artwork WHERE ID_Artwork = ?', [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Karya seni tidak ditemukan.' });
        }

        const artworkImage = results[0].ArtworkImage;

        // Mulai transaksi untuk memastikan semua operasi berjalan atomik
        await db.query('START TRANSACTION');

        // Hapus data terkait di tabel Size
        await db.query('DELETE FROM Size WHERE ID_Artwork = ?', [id]);

        await db.query('DELETE FROM Artrequest_Artwork WHERE ID_Artwork = ?', [id]);

        // Hapus data terkait di tabel lain jika ada hubungan ke Artwork

        // Hapus data karya seni dari tabel Artwork
        await db.query('DELETE FROM Artwork WHERE ID_Artwork = ?', [id]);

        // Commit transaksi jika semua operasi berhasil
        await db.query('COMMIT');

        // Hapus gambar dari server jika ada
        if (artworkImage) {
            const imagePath = path.join(__dirname, '../../public/uploads/artwork', artworkImage);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.error("Kesalahan saat menghapus gambar artwork:", err);
            }
        }

        res.status(200).json({ message: 'Artwork dan data terkait berhasil dihapus.' });
    } catch (err) {
        // Rollback transaksi jika terjadi kesalahan
        await db.query('ROLLBACK');
        console.error("Kesalahan saat menghapus data artwork:", err);
        res.status(500).json({ message: 'Kesalahan saat menghapus data artwork.' });
    }
};

const getDetailsByIdArtwork = async (req, res) => {
    const { id_artwork } = req.params;

    try {
        // Query SQL untuk mengambil data detail berdasarkan ID_Artwork
        const query = 'SELECT * FROM ArtworkDetails WHERE ID_Artwork = ?';
        const [details] = await db.query(query, [id_artwork]);

        if (!details || details.length === 0) {
            return res.status(404).json({ message: 'Detail tidak ditemukan untuk ID_Artwork yang diberikan.' });
        }

        // Mengembalikan respons jika data ditemukan
        return res.status(200).json(details);
    } catch (error) {
        console.error('Kesalahan saat mengambil detail artwork:', error);
        return res.status(500).json({ message: 'Kesalahan internal server.' });
    }
};

const getDetailById = async (req, res) => {
    const { id_detail } = req.params;

    try {
        // Query SQL untuk mengambil data detail berdasarkan ID_Detail
        const query = 'SELECT * FROM ArtworkDetails WHERE ID_Detail = ?';
        const [detail] = await db.query(query, [id_detail]);

        if (!detail || detail.length === 0) {
            return res.status(404).json({ message: 'Detail tidak ditemukan untuk ID_Detail yang diberikan.' });
        }

        // Mengembalikan respons jika data ditemukan
        return res.status(200).json(detail[0]);
    } catch (error) {
        console.error('Kesalahan saat mengambil detail berdasarkan ID_Detail:', error);
        return res.status(500).json({ message: 'Kesalahan internal server.' });
    }
};

const incrementViewCount = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('UPDATE Artwork SET ViewCount = ViewCount + 1 WHERE ID_Artwork = ?', [id]);
        res.status(200).json({ message: 'View count incremented' });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({ message: 'Failed to increment view count' });
    }
};

const addArtworkCustom = async (req, res) => {
    const { title, description, category, details } = req.body;
    const { width, height, weight, price, media } = details;  // Perubahan di sini
    const id_user = req.user.id;

    // Pastikan required fields ada
    if (!title || !category || !height || !width || !price || !media) {
        return res.status(400).json({ 
            message: 'Title, Category, Height, Width, Price, dan Media harus diisi.' 
        });
    }

    // Validasi media yang diizinkan
    if (!['watercolor', 'oil paint', 'acrylic'].includes(media)) {
        return res.status(400).json({ 
            message: 'Media harus watercolor, oil paint, atau acrylic.' 
        });
    }

    // Validasi apakah semua detail ada
    if (!width || !height || !price || !media) {
        return res.status(400).json({ 
            message: 'Setiap detail harus memiliki width, height, price, dan media.' 
        });
    }

    let requestImage = null;

    // Proses gambar jika ada
    if (req.file) {
        try {
            const imageBuffer = req.file.buffer;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;

            const compressedImageBuffer = await sharp(imageBuffer)
                .resize(800) // Resize jika perlu
                .jpeg({ quality: 80 }) // Kompres gambar dengan kualitas 80
                .toBuffer();

            const dirPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'artworkcustom');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            const filePath = path.join(dirPath, fileName);
            await fs.promises.writeFile(filePath, compressedImageBuffer);
            
            requestImage = fileName;
        } catch (err) {
            console.error("Kesalahan saat memproses gambar referensi:", err);
            return res.status(500).json({ message: 'Kesalahan saat memproses gambar referensi.' });
        }
    }

    try {
        // Menambahkan data ke tabel ArtworkCustom
        const [artworkResult] = await db.query(
            `INSERT INTO ArtworkCustom (Title_Artwork, ID_User, Description, RequestImage, Status, Category) 
            VALUES (?, ?, ?, ?, 'available', ?)`,
            [title, id_user, description || '', requestImage, category]
        );

        const artworkId = artworkResult.insertId;  // ID dari ArtworkCustom yang baru dimasukkan

        // Menambahkan data ke tabel ArtworkDetails
        const detailValues = [
            [
                artworkId,  // Menggunakan ID_Artwork yang valid
                parseFloat(height),
                parseFloat(width),
                weight ? parseFloat(weight) : null,
                parseFloat(price),
                media,
                'artworkcustom'  // Type yang sesuai
            ]
        ];

        console.log('Detail values untuk database:', detailValues);

        const detailQuery = `
            INSERT INTO ArtworkDetails (ID_Artwork, Height, Width, Weight, Price, Media, Type) 
            VALUES ?
        `;
        await db.query(detailQuery, [detailValues]);

        res.status(201).json({
            message: 'Request custom artwork berhasil dibuat.',
            customArtworkId: artworkId
        });
    } catch (err) {
        console.error("Kesalahan saat menyimpan request custom artwork:", err);
        res.status(500).json({ message: 'Kesalahan saat menyimpan request custom artwork.' });
    }
};

const getCustomArtworkWithDetailsById = async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.query(
            `SELECT ac.*, ad.Height, ad.Width, ad.Weight, ad.Price, ad.Media, ad.Type
            FROM ArtworkCustom ac
            LEFT JOIN ArtworkDetails ad ON ac.ID_Artwork = ad.ID_Artwork
            WHERE ac.ID_Artwork = ? AND ad.Type = 'artworkcustom'`,
            [id]
        );

        if (!results.length) {
            return res.status(404).json({ message: 'Custom artwork request tidak ditemukan.' });
        }

        const { Height, Width, Weight, Price, Media, Type, ...artworkData } = results[0];

        res.status(200).json({
            ...artworkData,
            detail: { height: Height, width: Width, weight: Weight, price: Price, media: Media, type: Type }
        });
    } catch (err) {
        console.error("Kesalahan saat mengambil data custom artwork:", err);
        return res.status(500).json({ message: 'Kesalahan saat mengambil data custom artwork.' });
    }
};

const getArtworkByOrderId = async (req, res) => {
    const { ID_Order } = req.params;

    try {
        const [results] = await db.query(`
            SELECT 
                o.ID_Order,
                o.TotalPrice,
                o.OrderStatus,
                a.Title_Artwork AS ArtworkTitle,
                ac.Title_Artwork AS CustomArtworkTitle,
                ad.Height,
                ad.Width,
                ad.Price,
                ad.Media,
                o.ID_Artwork,
                o.ID_ArtworkDetail,
                ad.Type  -- Ambil Type dari ArtworkDetails
            FROM Orders o
            LEFT JOIN Artwork a ON o.ID_Artwork = a.ID_Artwork
            LEFT JOIN ArtworkCustom ac ON o.ID_Artwork = ac.ID_Artwork
            LEFT JOIN ArtworkDetails ad ON o.ID_ArtworkDetail = ad.ID_Detail
            WHERE o.ID_Order = ? AND (ad.Type = 'artwork' OR ad.Type = 'artworkcustom')
        `, [ID_Order]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Art request tidak ditemukan untuk ID Order tersebut.' });
        }

        res.status(200).json(results[0]);
    } catch (error) {
        console.error('Kesalahan saat mengambil art request berdasarkan order ID:', error);
        res.status(500).json({ message: 'Gagal mengambil art request berdasarkan order ID.' });
    }
};

module.exports = { addArtworkByArtist, 
    addArtworkByAdmin, 
    getArtworkById, getAllArtworks, 
    deleteArtwork, updateArtwork, 
    getDetailsByIdArtwork,getDetailById, incrementViewCount, addArtworkCustom, getCustomArtworkWithDetailsById, 
    getArtworkByOrderId
};
