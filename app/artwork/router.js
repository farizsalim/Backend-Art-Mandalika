const {uploadArtwork} = require("../../middleware/index")
const { authorize, authenticateJWT } = require('../../middleware/index');
const express = require('express');
const router = express.Router();
const { getArtworkById,
        getAllArtworks,
        updateArtwork,
        deleteArtwork,
        addArtworkByArtist,
        addArtworkByAdmin,
        getDetailsByIdArtwork,
        getDetailById,
        incrementViewCount,
        getCustomArtworkWithDetailsById,
        addArtworkCustom,
        getArtworkByOrderId
    } = require("./controller")

router.post('/data', authenticateJWT, authorize('create', 'Artwork'), uploadArtwork.single('image'), addArtworkByArtist);
router.post('/data/admin', authenticateJWT, authorize('create', 'Artwork'), uploadArtwork.single('image'), addArtworkByAdmin);
router.get('/data/:id', getArtworkById);
router.get('/data', getAllArtworks);
router.put('/data/:id', authenticateJWT, authorize('update', 'Artwork'), uploadArtwork.single('image'), updateArtwork);
router.delete('/data/:id', authenticateJWT, authorize('delete', 'Artwork'), deleteArtwork);
router.get('/details/:id_artwork', getDetailsByIdArtwork)
router.get('/details/data/:id_size', getDetailById);
router.patch('/data/:id/view', incrementViewCount);
router.post('/datacustom', authenticateJWT, authorize('create', 'ArtworkCustom'), uploadArtwork.single('image'), addArtworkCustom);
router.get('/datacustom/:id', getCustomArtworkWithDetailsById);
router.get('/data/order/:ID_Order', getArtworkByOrderId)


module.exports = router;