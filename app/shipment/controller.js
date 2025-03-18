const db = require('../../database/database');
const axios = require('axios');

const createShipment = async (req, res) => {
    const { courier, service, cost, estimatedDelivery } = req.body;

    try {
        const shipmentQuery = `
            INSERT INTO Shipment (Courier, Service, Cost, EstimatedDelivery, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        `;
        const [result] = await db.query(shipmentQuery, [courier, service, cost, estimatedDelivery]);

        const ID_Shipment = result.insertId;
        res.status(201).json({ message: 'Data pengiriman berhasil disimpan.', ID_Shipment });
    } catch (err) {
        console.error("Kesalahan saat menyimpan data pengiriman:", err);
        res.status(500).json({ message: 'Gagal menyimpan data pengiriman.' });
    }
};

const getShipmentById = async (req, res) => {
    const { ID_Shipment } = req.params;

    try {
        const [results] = await db.query('SELECT * FROM Shipment WHERE ID_Shipment = ?', [ID_Shipment]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Data pengiriman tidak ditemukan.' });
        }
        res.status(200).json(results[0]);
    } catch (err) {
        console.error("Kesalahan saat mengambil data pengiriman:", err);
        res.status(500).json({ message: 'Gagal mengambil data pengiriman.' });
    }
};

const updateTrackingNumber = async (req, res) => {
    const { ID_Shipment } = req.params;
    const { trackingNumber } = req.body;

    try {
        const [result] = await db.query(`
            UPDATE Shipment 
            SET TrackingNumber = ?, UpdatedAt = NOW() 
            WHERE ID_Shipment = ?
        `, [trackingNumber, ID_Shipment]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Data pengiriman tidak ditemukan.' });
        }
        res.status(200).json({ message: 'Nomor resi berhasil diperbarui.' });
    } catch (err) {
        console.error("Kesalahan saat memperbarui nomor resi:", err);
        res.status(500).json({ message: 'Gagal memperbarui nomor resi.' });
    }
};

const getAllShipments = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Shipment');
        res.status(200).json(results);
    } catch (err) {
        console.error("Kesalahan saat mengambil semua data pengiriman:", err);
        res.status(500).json({ message: 'Gagal mengambil semua data pengiriman.' });
    }
};

const getCityIdByNameAndSave = async (cityName, provinceName, type) => {
    try {
        const [locationResult] = await db.query(
            'SELECT city_id, province_id FROM location WHERE city = ? AND province = ? AND type = ?',
            [cityName, provinceName, type]
        );

        if (locationResult.length > 0) {
            return locationResult[0];
        }

        const response = await axios.get('https://api.rajaongkir.com/starter/city', {
            headers: {
                key: process.env.RAJAONGKIR_API_KEY
            }
        });

        const cities = response.data.rajaongkir.results;
        const city = cities.find(c =>
            c.city_name.toLowerCase() === cityName.toLowerCase() &&
            c.province.toLowerCase() === provinceName.toLowerCase() &&
            c.type.toLowerCase() === type.toLowerCase()
        );

        if (city) {
            await db.query(
                'INSERT INTO location (city_id, province_id, city, province, type) VALUES (?, ?, ?, ?, ?)',
                [city.city_id, city.province_id, city.city_name, city.province, city.type]
            );

            return { city_id: city.city_id, province_id: city.province_id };
        } else {
            throw new Error('City or province not found in API');
        }
    } catch (error) {
        console.error('Error fetching or saving city ID:', error.message);
        throw error;
    }
};

const getShippingCost = async (req, res) => {
    const { ID_Origin, ID_Address, ID_Detail } = req.body;
    const couriers = ['jne', 'pos', 'tiki'];

    try {
        const [originResult] = await db.query('SELECT City, Province, Type FROM OriginAddress WHERE ID_Origin = ?', [ID_Origin]);
        if (originResult.length === 0) {
            return res.status(400).json({ message: 'Alamat asal tidak ditemukan.' });
        }
        const originCityName = originResult[0].City;
        const originProvinceName = originResult[0].Province;
        const originType = originResult[0].Type;

        const { city_id: originCityId } = await getCityIdByNameAndSave(originCityName, originProvinceName, originType);

        const [addressResult] = await db.query('SELECT City, Province, Type FROM Address WHERE ID_Address = ?', [ID_Address]);
        if (addressResult.length === 0) {
            return res.status(400).json({ message: 'Alamat tujuan tidak ditemukan.' });
        }
        const destCityName = addressResult[0].City;
        const destProvinceName = addressResult[0].Province;
        const destType = addressResult[0].Type;

        const { city_id: destCityId } = await getCityIdByNameAndSave(destCityName, destProvinceName, destType);

        const [artworkDetailResult] = await db.query('SELECT Weight FROM ArtworkDetails WHERE ID_Detail = ?', [ID_Detail]);
        if (artworkDetailResult.length === 0) {
            return res.status(400).json({ message: 'Detail artwork tidak ditemukan.' });
        }
        const weight = artworkDetailResult[0].Weight * 1000;

        let allShippingCosts = [];

        for (const courier of couriers) {
            const response = await axios.post('https://api.rajaongkir.com/starter/cost',
                new URLSearchParams({
                    origin: originCityId,
                    destination: destCityId,
                    weight: weight,
                    courier: courier
                }).toString(),
                {
                    headers: {
                        key: process.env.RAJAONGKIR_API_KEY,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data.rajaongkir && response.data.rajaongkir.results.length > 0) {
                response.data.rajaongkir.results.forEach(result => {
                    if (result.costs.length > 0) {
                        result.costs.forEach(cost => {
                            allShippingCosts.push({
                                courier: result.name,
                                code: result.code,
                                service: cost.service,
                                description: cost.description,
                                costDetails: cost.cost.map(detail => ({
                                    value: detail.value,
                                    etd: detail.etd,
                                    note: detail.note
                                }))
                            });
                        });
                    }
                });
            }
        }

        res.status(200).json({
            message: 'Biaya pengiriman berhasil diambil dari semua kurir.',
            data: allShippingCosts
        });
    } catch (error) {
        console.error('Error saat mengambil biaya pengiriman:', error);
        res.status(500).json({ message: 'Gagal mengambil biaya pengiriman.', error: error.message });
    }
};

module.exports = {
    createShipment,
    getShipmentById,
    updateTrackingNumber,
    getAllShipments,
    getShippingCost
};
