const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.getAll);
router.post('/obtener', clienteController.getByCurp);
router.post('/', clienteController.create);
router.put('/actualizar', clienteController.update);
router.delete('/eliminar', clienteController.delete);
router.get('/buscar-por-correo', clienteController.buscarPorCorreo);

module.exports = router;
