const express = require("express");
const router = express.Router();
const pagoController = require("../controllers/pagoController");

router.get("/resumen", pagoController.getResumenPagos);
router.get("/detalle/:id", pagoController.getPagosByContrato);
router.get("/contrato/:id", pagoController.getDetalleContrato);
router.post("/registrar", pagoController.registrarPago);
router.get("/recibo/:id", pagoController.generarRecibo);
router.post("/notificar", pagoController.enviarNotificacionPago);

module.exports = router;
