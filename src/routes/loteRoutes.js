const express = require('express');
const router = express.Router();
const loteController = require('../controllers/loteController');
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads')); 
  },
  filename: function(req, file, cb) {
    const ext = file.originalname.split('.').pop();
    cb(null, Date.now() + '.' + ext);
  }
});

const upload = multer({ storage });
router.get('/', loteController.getAllLotes);
router.get('/:id', loteController.getLoteById);
router.post(
  '/',
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'documentacion', maxCount: 1 } // ✅ acepta también el PDF
  ]),
  loteController.createLote
);

router.put('/:id',  
  upload.fields([
        { name: 'imagenes', maxCount: 10 },
        { name: 'documentacion', maxCount: 1 }
    ]), 
    loteController.updateLote
);
router.delete('/:id', loteController.deleteLote);


router.get('/buscar', loteController.getLote);
router.put('/actualizar', upload.array('imagenes', 10), loteController.updateLoteByQuery);
router.delete('/eliminar', loteController.deleteLoteByQuery);


module.exports = router;
