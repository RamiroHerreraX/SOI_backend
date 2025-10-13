const express = require('express');
const router = express.Router();
const contratoController = require('../controllers/contratoVentaController');

router.post('/', contratoController.createContrato);

module.exports = router;
