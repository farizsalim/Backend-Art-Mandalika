const express = require('express');
const router = express.Router();
const {
    createArtRequestArtwork,
    getArtRequestsArtworkByCustomer,
    getArtRequestArtworkById,
    updateArtRequestArtwork,
    deleteArtRequestArtwork,
    getAllArtRequestsArtwork
} = require('./controller');
const { authenticateJWT, authorize } = require('../../middleware/index'); // Sesuaikan path dengan middleware yang kamu buat

router.post('/request/artwork', authenticateJWT, authorize('create', 'ArtRequest_Artwork'), createArtRequestArtwork);
router.get('/request/artwork/all', authenticateJWT, authorize('manage', 'all'), getAllArtRequestsArtwork); // Hanya admin yang bisa
router.get('/request/artwork', authenticateJWT, authorize('read', 'ArtRequest_Artwork'), getArtRequestsArtworkByCustomer);
router.get('/request/artwork/:ID_ArtRequest', authenticateJWT, authorize('read', 'ArtRequest_Artwork'), getArtRequestArtworkById);
router.put('/request/artwork/:ID_ArtRequest', authenticateJWT, authorize('update', 'ArtRequest_Artwork'), updateArtRequestArtwork);
router.delete('/request/artwork/:ID_ArtRequest', authenticateJWT, authorize('delete', 'ArtRequest_Artwork'), deleteArtRequestArtwork); // Hanya admin yang bisa

module.exports = router;
