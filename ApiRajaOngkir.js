const express = require('express');
const router = express.Router();
const axios = require('axios')

router.get('/provinces', async (req, res) => {
    try {
        const response = await axios.get('https://api.rajaongkir.com/starter/province', {
            headers: { 'key': '845fc85f13aeb80ed682a6bbc7e56661' }
        });
        res.json(response.data.rajaongkir.results);
    } catch (error) {
        console.error('Error fetching provinces:', error);
        res.status(500).send('Error fetching provinces');
    }
});

router.get('/cities', async (req, res) => {
    const provinceId = req.query.province; // Ambil parameter province dari query
    try {
        const response = await axios.get(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
            headers: { 'key': '845fc85f13aeb80ed682a6bbc7e56661' }
        });
        res.json(response.data.rajaongkir.results);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).send('Error fetching cities');
    }
});

module.exports = router;
