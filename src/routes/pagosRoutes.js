const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

router.get('/contrato/:id', pagoController.getByContrato);
router.put('/marcar-pagado/:id_pago', pagoController.marcarPagado);

module.exports = router;
