const express = require('express');  
const router = express.Router();  
const { getArtistProfile } = require('./controller');  
  
router.get('/artist/:id', getArtistProfile);  
  
module.exports = router;  
