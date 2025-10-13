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
router.post('/', upload.single('imagen'), loteController.createLote);
router.put('/:id', upload.single('imagen'), loteController.updateLote);
router.delete('/:id', loteController.deleteLote);

module.exports = router;
