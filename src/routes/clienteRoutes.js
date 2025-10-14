const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.getAll);
router.get('/:curp', clienteController.getByCurp);
router.post('/', clienteController.create);
router.put('/:curp', clienteController.update);
router.delete('/:curp', clienteController.delete);

module.exports = router;
