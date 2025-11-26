const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const multer = require('multer');
const path = require('path');

// 📂 Configuración de Multer para guardar PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // carpeta donde se guardarán
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// 📌 Solo permitir archivos PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos PDF"), false);
  }
};

// 📌 Crear instancia de Multer
const upload = multer({ storage, fileFilter });

// RUTAS
router.get('/', clienteController.getAll);
router.post('/obtener', clienteController.getByCurp);

router.post(
  '/',
  upload.fields([
    { name: 'doc_identificacion', maxCount: 1 },
    { name: 'doc_curp', maxCount: 1 }
  ]),
  clienteController.create
);

router.put("/actualizar",
  upload.fields([
    { name: "doc_identificacion", maxCount: 1 },
    { name: "doc_curp", maxCount: 1 }
  ]),
  clienteController.update
);

router.delete('/eliminar', clienteController.delete);
router.get('/buscar-por-correo', clienteController.buscarPorCorreo);

module.exports = router;
