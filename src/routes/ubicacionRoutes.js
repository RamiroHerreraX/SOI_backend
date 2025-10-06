const express = require('express');
const router = express.Router();
const { getEstados, getCiudades, getColonias } = require('../controllers/ubicacionController');

router.get('/estados', getEstados);
router.get('/ciudades/:estadoId', getCiudades);
router.get('/colonias/:ciudadId', getColonias);

module.exports = router;
