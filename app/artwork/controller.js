const db = require('../../database/database');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const determineWeight = (width, height) => {
    if ((width >= 30 && width <= 40 && height >= 30 && height <= 50) ||
        (width >= 40 && width <= 50 && height >= 40 && height <= 50)) {
        return 2; // Berat otomatis 2 kg untuk ukuran 30x40 cm - 40x50 cm
    } else if ((width >= 50 && width <= 70 && height >= 50 && height <= 100) ||
               (width >= 70 && width <= 100 && height >= 70 && height <= 100)) {
        return 5; // Berat otomatis 5 kg untuk ukuran 50x70 cm - 70x100 cm
    } else {
        return null; // Berat bebas dimasukkan oleh admin atau artist untuk ukuran lebih besar
    }
};

const addArtworkForArtist = async (req, res) => {
    const { title, description, stock, sizes, category } = req.body;
    const id_creator = req.user.id;
    const id_uploader = id_creator;

    if (!title || !stock || !category) {
        return res.status(400).json({ message: 'Title, Stock, dan Category harus diisi.' });
    }

    let artworkImage;
    if (req.file) {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const imageFileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;
        artworkImage = imageFileName;
        const imagePath = path.join(__dirname, '../../public/uploads/artwork', imageFileName);

        try {
            await fs.rename(req.file.path, imagePath);
        } catch (err) {
            console.error("Kesalahan saat menyimpan gambar:", err);
            return res.status(500).json({ message: 'Kesalahan saat menyimpan gambar.' });
        }
    } else {
        artworkImage = null;
    }

    try {
        const artworkQuery = `
            INSERT INTO Artwork (Title_Artwork, ID_Creator, ID_Uploader, Description, ArtworkImage, Stock, Category) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const artworkValues = [title, id_creator, id_uploader, description || '', artworkImage, stock, category];
        const [result] = await db.query(artworkQuery, artworkValues);

        const artworkId = result.insertId;

        if (sizes && sizes.length > 0) {
            const sizeValues = sizes.map(size => {
                let weight = determineWeight(size.width, size.height);
                if (weight === null && size.weight) {
                    weight = size.weight;
                }
                return [artworkId, size.width, size.height, size.price, weight];
            });

            const sizeQuery = `
                INSERT INTO Size (ID_Artwork, Width, Height, Price, Weight) 
                VALUES ?
            `;
            await db.query(sizeQuery, [sizeValues]);

            res.status(201).json({ message: 'Artwork dan ukuran berhasil ditambahkan oleh artist.', artworkId });
        } else {
            res.status(201).json({ message: 'Artwork berhasil ditambahkan tanpa ukuran.', artworkId });
        }
    } catch (err) {
        console.error("Kesalahan saat menyimpan data artwork:", err);
        res.status(500).json({ message: 'Kesalahan saat menyimpan data artwork.' });
    }
};

const addArtworkByAdmin = async (req, res) => {
    const { title, id_creator, description, stock, category } = req.body;
    const id_uploader = req.user.id;

    // Pastikan required fields ada
    if (!title || !id_creator || !stock || !category) {
        return res.status(400).json({ message: 'Title, ID_Creator, Stock, dan Category harus diisi.' });
    }

    // Parsing sizes menjadi array
    let sizes;
    try {
        sizes = JSON.parse(req.body.sizes);
        if (!Array.isArray(sizes)) {
            return res.status(400).json({ message: 'Sizes harus berupa array' });
        }
    } catch (error) {
        return res.status(400).json({ message: 'Data sizes tidak valid' });
    }

    let artworkImage;
    if (req.file) {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const imageFileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;
        artworkImage = imageFileName;
        const imagePath = path.join(__dirname, '../../public/uploads/artwork', imageFileName);

        try {
            await fs.rename(req.file.path, imagePath);
        } catch (err) {
            console.error("Kesalahan saat menyimpan gambar:", err);
            return res.status(500).json({ message: 'Kesalahan saat menyimpan gambar.' });
        }
    } else {
        artworkImage = null;
    }

    try {
        const artworkQuery = `
            INSERT INTO Artwork (Title_Artwork, ID_Creator, ID_Uploader, Description, ArtworkImage, Stock, Category) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const artworkValues = [title, id_creator, id_uploader, description || '', artworkImage, stock, category];
        const [result] = await db.query(artworkQuery, artworkValues);

        const artworkId = result.insertId;

        if (sizes.length > 0) {
            const sizeValues = sizes.map(size => {
                let weight = determineWeight(size.width, size.height);
                if (weight === null && size.weight) {
                    weight = size.weight;
                }
                return [artworkId, size.width, size.height, size.price, weight];
            });

            const sizeQuery = `
                INSERT INTO Size (ID_Artwork, Width, Height, Price, Weight) 
                VALUES ?
            `;
            await db.query(sizeQuery, [sizeValues]);

            res.status(201).json({ message: 'Artwork dan ukuran berhasil ditambahkan oleh admin untuk artist.', artworkId });
        } else {
            res.status(201).json({ message: 'Artwork berhasil ditambahkan tanpa ukuran.', artworkId });
        }
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

const getSizeByIdArtwork = async (req, res) => {
    const { id_artwork } = req.params;

    try {
        // Query SQL untuk mengambil data size berdasarkan ID_Artwork
        const query = 'SELECT * FROM Size WHERE ID_Artwork = ?';
        const [sizes] = await db.query(query, [id_artwork]);

        if (!sizes || sizes.length === 0) {
            return res.status(404).json({ message: 'Size tidak ditemukan untuk ID_Artwork yang diberikan.' });
        }

        // Mengembalikan respons jika data ditemukan
        return res.status(200).json(sizes);
    } catch (error) {
        console.error('Kesalahan saat mengambil ukuran:', error);
        return res.status(500).json({ message: 'Kesalahan internal server.' });
    }
};

const getSizeById = async (req, res) => {
    const { id_size } = req.params;

    try {
        // Query SQL untuk mengambil data size berdasarkan ID_Size
        const query = 'SELECT * FROM Size WHERE ID_Size = ?';
        const [size] = await db.query(query, [id_size]);

        if (!size || size.length === 0) {
            return res.status(404).json({ message: 'Size tidak ditemukan untuk ID_Size yang diberikan.' });
        }

        // Mengembalikan respons jika data ditemukan
        return res.status(200).json(size[0]);
    } catch (error) {
        console.error('Kesalahan saat mengambil ukuran berdasarkan ID_Size:', error);
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

module.exports = { addArtworkForArtist, 
    addArtworkByAdmin, 
    getArtworkById, getAllArtworks, 
    deleteArtwork, updateArtwork, 
    getSizeByIdArtwork,getSizeById, incrementViewCount };
