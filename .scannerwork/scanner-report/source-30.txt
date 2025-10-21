const express = require('express');
const router = express.Router();
const { getEstados, getCiudades, getColonias, getCiudadPorCP, getCiudadById} = require('../controllers/ubicacionController');

router.get('/estados', getEstados);
router.get('/ciudades/:estadoId', getCiudades);
router.get('/colonias/:ciudadId', getColonias);
router.get('/codigo-postal/:codigoPostal', getCiudadPorCP);
router.get('/ciudad/:id_ciudad', getCiudadById);




module.exports = router;
