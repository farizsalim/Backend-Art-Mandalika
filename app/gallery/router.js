const { createGallery,getAllGalleries,updateGallery,deleteGallery,getGalleryById} = require("./controller");
const { authorize, authenticateJWT , uploadGallery} = require('../../middleware/index');
const express = require('express');
const router = express.Router();

router.post(
    '/',
    authenticateJWT,
    authorize('create', 'Gallery'),
    uploadGallery.single('image'),
    createGallery
  );
  
  // Get All Galleries (Public)
  router.get('/', getAllGalleries);
  
  // Get Single Gallery (Public)
  router.get('/:ID_Gallery', getGalleryById);
  
  // Update Gallery (Admin/Owner)
  router.put(
    '/:ID_Gallery',
    authenticateJWT,
    authorize('update', 'Gallery'),
    uploadGallery.single('image'),
    updateGallery
  );
  
  // Delete Gallery (Admin/Owner)
  router.delete(
    '/gallery/:ID_Gallery',
    authenticateJWT,
    authorize('delete', 'Gallery'),
    deleteGallery
  );
  
  module.exports = router;