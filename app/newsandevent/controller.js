const db = require('../../database/database'); // Pastikan path ini sesuai  
const path = require('path');  
const fs = require('fs'); // Menggunakan fs untuk menyimpan file  
const crypto = require('crypto');  
const sharp = require('sharp');  
  
// Create News Event  
const createNewsEvent = async (req, res) => {  
    try {  
        const { title, content, event_date } = req.body; // Ambil data dari body  
        const creatorId = req.user.id; // ID pengguna yang mengupload  
  
        // Validasi input  
        if (!title || !content || !creatorId) {  
            return res.status(400).json({ message: 'Title, content, event date, and creator ID are required.' });  
        }  
  
        // Proses gambar jika ada  
        let imagePath = null;  
        if (req.file) {  
            const file = req.file;  
            const fileExtension = path.extname(file.originalname);  
            const newFileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;  
            const outputDir = path.join(__dirname, '../../public/uploads/eventandnews');  
            const outputPath = path.join(outputDir, newFileName);  
  
            if (!fs.existsSync(outputDir)) {  
                fs.mkdirSync(outputDir, { recursive: true });  
            }  
  
            await sharp(file.buffer)  
                .resize(800)  
                .toFile(outputPath);  
  
            imagePath = newFileName;  
        }  
  
        const newsEventQuery = `  
            INSERT INTO news_events (Title, Content, Image, Event_Date, created_at, id_creator)   
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(), ?)  
        `;  
        const newsEventValues = [  
            title,  
            content,  
            imagePath || null,  
            event_date,  
            creatorId  
        ];  
  
        const [result] = await db.query(newsEventQuery, newsEventValues);  
        res.status(201).json({ message: 'News event berhasil ditambahkan.', eventId: result.insertId });  
    } catch (error) {  
        console.error('Error creating news/event:', error);  
        return res.status(500).json({ message: 'Internal server error' });  
    }  
};  
  
// Read All News Events  
const getAllNewsEvents = async (req, res) => {  
    try {  
        const query = 'SELECT * FROM news_events ORDER BY created_at DESC LIMIT 100'; // Batasi hasil  
        const [results] = await db.query(query);  
          
        // Log jumlah hasil yang ditemukan  
        console.log(`Found ${results.length} news events.`);  
          
        res.status(200).json(results);  
    } catch (error) {  
        console.error('Error fetching news events:', error);  
        return res.status(500).json({ message: 'Internal server error' });  
    }  
};  

  
// Read Single News Event  
const getNewsEventById = async (req, res) => {  
    const { id } = req.params;  
    try {  
        const query = 'SELECT * FROM news_events WHERE ID_News_Event = ?';  
        const [results] = await db.query(query, [id]);  
  
        if (results.length === 0) {  
            return res.status(404).json({ message: 'News event not found.' });  
        }  
  
        res.status(200).json(results[0]);  
    } catch (error) {  
        console.error('Error fetching news event:', error);  
        return res.status(500).json({ message: 'Internal server error' });  
    }  
};  
  
// Update News Event  
const updateNewsEvent = async (req, res) => {  
    const { id } = req.params;  
    const { title, content, event_date } = req.body;  
  
    try {  
        const newsEventQuery = `  
            UPDATE news_events   
            SET Title = ?, Content = ?, Event_Date = ?   
            WHERE ID_News_Event = ?  
        `;  
        const newsEventValues = [title, content, event_date, id];  
  
        const [result] = await db.query(newsEventQuery, newsEventValues);  
  
        if (result.affectedRows === 0) {  
            return res.status(404).json({ message: 'News event not found.' });  
        }  
  
        res.status(200).json({ message: 'News event updated successfully.' });  
    } catch (error) {  
        console.error('Error updating news event:', error);  
        return res.status(500).json({ message: 'Internal server error' });  
    }  
};  
  
// Delete News Event  
const deleteNewsEvent = async (req, res) => {  
    const { id } = req.params;  
  
    try {  
        const newsEventQuery = 'DELETE FROM news_events WHERE ID_News_Event = ?';  
        const [result] = await db.query(newsEventQuery, [id]);  
  
        if (result.affectedRows === 0) {  
            return res.status(404).json({ message: 'News event not found.' });  
        }  
  
        res.status(200).json({ message: 'News event deleted successfully.' });  
    } catch (error) {  
        console.error('Error deleting news event:', error);  
        return res.status(500).json({ message: 'Internal server error' });  
    }  
};  
  
module.exports = {  
    createNewsEvent,  
    getAllNewsEvents,  
    getNewsEventById,  
    updateNewsEvent,  
    deleteNewsEvent  
};  
