const express = require('express');
const router = express.Router();
const loteController = require('../controllers/loteController');

router.get('/', loteController.getAllLotes);
router.get('/:id', loteController.getLoteById);
router.post('/', loteController.createLote);
router.put('/:id', loteController.updateLote);
router.delete('/:id', loteController.deleteLote);

module.exports = router;
