const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const db = require('../../database/database');


// CREATE - Tambah Gallery
const createGallery = async (req, res) => {
    const { title, description } = req.body;
    const uploaded_by = req.user.id;
    let image_url = null;

    // Validasi input
    if (!title || !req.file) {
        return res.status(400).json({ message: 'Title dan gambar wajib diisi' });
    }

    try {
        // Proses gambar
        if (req.file) {
            const imageBuffer = req.file.buffer;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;

            // Kompresi gambar
            const compressedImage = await sharp(imageBuffer)
                .resize(800)
                .jpeg({ quality: 80 })
                .toBuffer();

            // Simpan ke direktori
            const dirPath = path.join(__dirname, '..', 'public', 'uploads', 'gallery');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            const filePath = path.join(dirPath, fileName);
            await fs.promises.writeFile(filePath, compressedImage);
            image_url = fileName;
        }

        // Simpan ke database
        const query = `
            INSERT INTO community_gallery 
            (Title, Description, Image_URL, Uploaded_By)
            VALUES (?, ?, ?, ?)
        `;
        const values = [title, description || null, image_url, uploaded_by];
        
        const [result] = await db.query(query, values);
        
        res.status(201).json({
            message: 'Gallery berhasil ditambahkan',
            id: result.insertId
        });

    } catch (err) {
        console.error('Error create gallery:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// READ - Dapatkan semua gallery
const getAllGalleries = async (req, res) => {
    try {
        const query = `
            SELECT 
                ID_Gallery, Title, Description, 
                CONCAT('/uploads/gallery/', Image_URL) as Image_URL,
                Uploaded_By, Created_at, Updated_at
            FROM community_gallery 
        `;
        const [galleries] = await db.query(query);
        
        res.json(galleries);
    } catch (err) {
        console.error('Error get galleries:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getGalleryById = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT 
                ID_Gallery, Title, Description,
                CONCAT('/uploads/gallery/', Image_URL) as Image_URL,
                Uploaded_By, Created_at, Updated_at
            FROM community_gallery 
            WHERE ID_Gallery = ?
        `;
        
        const [gallery] = await db.query(query, [id]);
        
        if (gallery.length === 0) {
            return res.status(404).json({ message: 'Gallery tidak ditemukan' });
        }
        
        res.json(gallery[0]);
        
    } catch (err) {
        console.error('Error get gallery by ID:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// UPDATE - Update gallery
const updateGallery = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    let image_url = null;

    try {
        // Dapatkan data lama
        const [oldData] = await db.query('SELECT Image_URL FROM community_gallery  WHERE ID_Gallery = ?', [id]);
        
        // Proses gambar baru jika ada
        if (req.file) {
            // Hapus gambar lama
            if (oldData[0].Image_URL) {
                const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'gallery', oldData[0].Image_URL);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Proses upload gambar baru (sama seperti create)
            const imageBuffer = req.file.buffer;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;

            const compressedImage = await sharp(imageBuffer)
                .resize(800)
                .jpeg({ quality: 80 })
                .toBuffer();

            const dirPath = path.join(__dirname, 'public', 'uploads', 'gallery');
            const filePath = path.join(dirPath, fileName);
            await fs.promises.writeFile(filePath, compressedImage);
            
            image_url = fileName;
        }

        // Update database
        const query = `
            UPDATE community_gallery  SET
                Title = ?,
                Description = ?,
                Image_URL = COALESCE(?, Image_URL)
            WHERE ID_Gallery = ?
        `;
        const values = [title, description, image_url, id];
        
        await db.query(query, values);
        
        res.json({ message: 'Gallery berhasil diupdate' });

    } catch (err) {
        console.error('Error update gallery:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE - Hapus gallery
const deleteGallery = async (req, res) => {
    const { id } = req.params;

    try {
        // Dapatkan data gambar
        const [data] = await db.query('SELECT Image_URL FROM community_gallery  WHERE ID_Gallery = ?', [id]);
        
        // Hapus gambar dari storage
        if (data[0].Image_URL) {
            const filePath = path.join(__dirname, '..', 'public', 'uploads', 'gallery', data[0].Image_URL);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Hapus dari database
        await db.query('DELETE FROM community_gallery  WHERE ID_Gallery = ?', [id]);
        
        res.json({ message: 'Gallery berhasil dihapus' });
    } catch (err) {
        console.error('Error delete gallery:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createGallery,
    getAllGalleries,
    updateGallery,
    deleteGallery,
    getGalleryById
};