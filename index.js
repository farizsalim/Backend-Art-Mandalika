const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const authRoutes = require('./app/auth/router'); // Mengimpor auth router
const artworkRoutes =  require('./app/artwork/router')
const conversationRoutes =  require('./app/conversation/router')
const addressRoutes = require('./app/address/router')
const orderRoutes = require('./app/order/router')
const shipmentRoutes = require('./app/shipment/router')
const midtransRoutes = require('./app/midtrans/router');
const reviewRoutes = require('./app/review/router');
const artist = require('./app/artist/router')
const news_events = require('./app/newsandevent/router')
const testRoutes = require('./ApiRajaOngkir')
const artcustomRoutes = require('./app/artrequestArtwork/router')
const gallerRoutes = require('./app/gallery/router')
const app = express();
require('dotenv').config();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Menggunakan router
const apihash = process.env.apihash;
app.use(`/${apihash}/api/auth`, authRoutes); // Semua rute di authRoutes akan prefiks dengan /api/auth
app.use(`/${apihash}/api/artwork`, artworkRoutes);
app.use(`/${apihash}/api/conversation`, conversationRoutes);
app.use(`/${apihash}/api/addressapi`, addressRoutes);
app.use(`/${apihash}/api/order`, orderRoutes);
app.use(`/${apihash}/api/shipment`, shipmentRoutes);
app.use(`/${apihash}/api/midtrans`, midtransRoutes);
app.use(`/${apihash}/api/review`, reviewRoutes);
app.use(`/${apihash}/api/artist`,artist);
app.use(`/${apihash}/api/artworkcustom`,artcustomRoutes);
app.use(`/${apihash}/api/newsandevent`,news_events);
app.use(`/${apihash}/api/gallery`,gallerRoutes);
app.use(`/${apihash}/images`,express.static('public'))
app.use(`/${apihash}/api/test`, testRoutes)


app.get('/', function (req, res) {
    res.render('index', {
        title: 'Art Mandalika Backend'
    });
});

const PORT = 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server Berjalan di Port ', PORT);
});

module.exports = app;
