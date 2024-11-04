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
    const { title, description, stock, sizes } = req.body;
    const id_creator = req.user.id;
    const id_uploader = id_creator;

    if (!title || !stock) {
        return res.status(400).json({ message: 'Title dan Stock harus diisi.' });
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
            INSERT INTO Artwork (Title_Artwork, ID_Creator, ID_Uploader, Description, ArtworkImage, Stock) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const artworkValues = [title, id_creator, id_uploader, description || '', artworkImage, stock];
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
    const { title, id_creator, description, stock, sizes } = req.body;
    const id_uploader = req.user.id;

    if (!title || !id_creator || !stock) {
        return res.status(400).json({ message: 'Title, ID_Creator, dan Stock harus diisi.' });
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
            INSERT INTO Artwork (Title_Artwork, ID_Creator, ID_Uploader, Description, ArtworkImage, Stock) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const artworkValues = [title, id_creator, id_uploader, description || '', artworkImage, stock];
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

            res.status(201).json({ message: 'Artwork dan ukuran berhasil ditambahkan oleh admin untuk artist.', artworkId });
        } else {
            res.status(201).json({ message: 'Artwork berhasil ditambahkan tanpa ukuran.', artworkId });
        }
    } catch (err) {
        console.error("Kesalahan saat menyimpan data artwork:", err);
        res.status(500).json({ message: 'Kesalahan saat menyimpan data artwork.' });
    }
};

const getArtworkById = (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM Artwork WHERE ID_Artwork = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error("Kesalahan saat mengambil data artwork:", err);
            return res.status(500).json({ message: 'Kesalahan saat mengambil data artwork.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Karya seni tidak ditemukan.' });
        }

        // Mengirim data karya seni yang ditemukan
        res.status(200).json(results[0]);
    });
};

const getAllArtworks = (req, res) => {
    const query = 'SELECT * FROM Artwork';

    db.query(query, (err, results) => {
        if (err) {
            console.error("Kesalahan saat mengambil data artwork:", err);
            return res.status(500).json({ message: 'Kesalahan saat mengambil data artwork.' });
        }

        // Mengirim data semua karya seni dalam format JSON
        res.status(200).json(results);
    });
};

const updateArtwork = (req, res) => {
    const { id } = req.params;
    const { title, description, stock } = req.body;

    // Mengambil data karya seni lama untuk memeriksa gambar
    db.query('SELECT ArtworkImage FROM Artwork WHERE ID_Artwork = ?', [id], (err, results) => {
        if (err) {
            console.error("Kesalahan saat mengambil data artwork:", err);
            return res.status(500).json({ message: 'Kesalahan saat mengambil data artwork.' });
        }

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
            fs.rename(req.file.path, newImagePath, (err) => {
                if (err) {
                    console.error("Kesalahan saat menyimpan gambar baru:", err);
                    return res.status(500).json({ message: 'Kesalahan saat menyimpan gambar baru.' });
                }
            });

            // Hapus gambar lama jika ada
            if (artworkImage) {
                const oldImagePath = path.join(__dirname, '../../public/uploads/artwork', artworkImage);
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error("Kesalahan saat menghapus gambar lama:", err);
                });
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

        db.query(query, values, (err) => {
            if (err) {
                console.error("Kesalahan saat memperbarui data artwork:", err);
                return res.status(500).json({ message: 'Kesalahan saat memperbarui data artwork.' });
            }
            res.status(200).json({ message: 'Data artwork berhasil diperbarui.' });
        });
    });
};

const deleteArtwork = (req, res) => {
    const { id } = req.params;

    // Mengambil data karya seni untuk memeriksa gambar
    db.query('SELECT ArtworkImage FROM Artwork WHERE ID_Artwork = ?', [id], (err, results) => {
        if (err) {
            console.error("Kesalahan saat mengambil data artwork:", err);
            return res.status(500).json({ message: 'Kesalahan saat mengambil data artwork.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Karya seni tidak ditemukan.' });
        }

        const artworkImage = results[0].ArtworkImage;

        // Hapus karya seni dari database
        db.query('DELETE FROM Artwork WHERE ID_Artwork = ?', [id], (err) => {
            if (err) {
                console.error("Kesalahan saat menghapus data artwork:", err);
                return res.status(500).json({ message: 'Kesalahan saat menghapus data artwork.' });
            }

            // Hapus gambar dari server jika ada
            if (artworkImage) {
                const imagePath = path.join(__dirname, '../../public/uploads/artwork', artworkImage);
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error("Kesalahan saat menghapus gambar artwork:", err);
                    }
                });
            }

            res.status(200).json({ message: 'Artwork berhasil dihapus.' });
        });
    });
};

module.exports = { addArtworkForArtist, addArtworkByAdmin, getArtworkById, getAllArtworks, deleteArtwork, updateArtwork };
