const {uploadArtwork} = require("../../middleware/index")
const { authorize, authenticateJWT } = require('../../middleware/index');
const express = require('express');
const router = express.Router();
const { getArtworkById,
        getAllArtworks,
        updateArtwork,
        deleteArtwork,
        addArtworkForArtist,
        addArtworkByAdmin,
        getSizeByIdArtwork,
        getSizeById,
        incrementViewCount
    } = require("./controller")

router.post('/data', authenticateJWT, authorize('create', 'Artwork'), uploadArtwork.single('image'), addArtworkForArtist);
router.post('/data/admin', authenticateJWT, authorize('create', 'Artwork'), uploadArtwork.single('image'), addArtworkByAdmin);
router.get('/data/:id', getArtworkById);
router.get('/data', getAllArtworks);
router.put('/data/:id', authenticateJWT, authorize('update', 'Artwork'), uploadArtwork.single('image'), updateArtwork);
router.delete('/data/:id', authenticateJWT, authorize('delete', 'Artwork'), deleteArtwork);
router.get('/size/:id_artwork', getSizeByIdArtwork)
router.get('/size/data/:id_size', getSizeById);
router.patch('/data/:id/view', incrementViewCount);

module.exports = router;