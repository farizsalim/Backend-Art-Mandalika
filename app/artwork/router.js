const {uploadArtwork} = require("../../middleware/index")
const express = require('express');
const { authorize, authenticateJWT } = require('../../middleware/index');
const router = express.Router();
const { getArtworkById,
        getAllArtworks,
        updateArtwork,
        deleteArtwork,
        addArtworkForArtist,
        addArtworkByAdmin
    } = require("./controller")

router.post('/data', authenticateJWT, authorize('create', 'Artwork'), uploadArtwork.single('image'), addArtworkForArtist);
router.post('/data/admin', authenticateJWT, authorize('create', 'Artwork'), uploadArtwork.single('image'), addArtworkByAdmin);
router.get('/data/:id', getArtworkById);
router.get('/data', getAllArtworks);
router.put('/data/:id', authenticateJWT, authorize('update', 'Artwork'), uploadArtwork.single('image'), updateArtwork);
router.delete('/data/:id', authenticateJWT, authorize('delete', 'Artwork'), deleteArtwork);



module.exports = router;