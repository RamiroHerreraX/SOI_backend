const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

router.post('/contrato', pagoController.getByContrato);
router.put('/marcar-pagado', pagoController.marcarPagadoPorCorreo);

module.exports = router;
