const Cliente = require('../models/clienteModel');
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req,res,next)).catch(next);
const pool = require('../db');

exports.getAll = asyncHandler(async (req, res) => {
  const clientes = await Cliente.getAll();
  res.json(clientes);
});

exports.getByCurp = asyncHandler(async (req, res) => {
  const { curp } = req.body;

  if (!curp) {
    return res.status(400).json({ message: 'CURP es requerida para la búsqueda' });
  }

  const cliente = await Cliente.getByCurp(curp);
  if (!cliente) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  res.json(cliente);
});


exports.create = asyncHandler(async (req, res) => {
  
  // Archivos PDF recibidos por multer
  const docIdent = req.files?.doc_identificacion?.[0]?.filename || null;
  const docCurp = req.files?.doc_curp?.[0]?.filename || null;

  // Cuerpo del formulario
  const datos = {
    nombre: req.body.nombre,
    apellido_paterno: req.body.apellido_paterno,
    apellido_materno: req.body.apellido_materno || null,
    correo: req.body.correo,
    telefono: req.body.telefono || null,
    curp: req.body.curp,
    clave_elector: req.body.clave_elector || null,
    doc_identificacion: docIdent,
    doc_curp: docCurp
  };

  // Validación
  const { error } = Cliente.validate(datos);
  if (error) {
    return res.status(400).json({
      mensaje: 'Error de validación',
      detalles: [error.details[0].message]
    });
  }

  // Verificar correo duplicado
  const existente = await Cliente.getByCorreo(datos.correo);
  if (existente) {
    return res.status(409).json({
      message: 'Ya existe un cliente con ese correo'
    });
  }

  // Crear cliente
  const cliente = await Cliente.create(datos);

  res.status(201).json({
    message: 'Cliente creado correctamente',
    cliente
  });
});

exports.update = asyncHandler(async (req, res) => {
  const curp = req.body.curp;

  if (!curp) {
    return res.status(400).json({ message: "La CURP es requerida para la actualización" });
  }

  const clienteExistente = await Cliente.getByCurp(curp);
  if (!clienteExistente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  let docIdentificacion = clienteExistente.doc_identificacion;
  let docCurp = clienteExistente.doc_curp;

  if (req.body.borrar_identificacion === "true") docIdentificacion = null;
  if (req.body.borrar_curp === "true") docCurp = null;

  if (req.files?.doc_identificacion)
    docIdentificacion = req.files.doc_identificacion[0].filename;

  if (req.files?.doc_curp)
    docCurp = req.files.doc_curp[0].filename;

  const body = req.body; // ← aquí ya vienen los datos del FormData

  const datosActualizados = {
    nombre: body.nombre,
    apellido_paterno: body.apellido_paterno,
    apellido_materno: body.apellido_materno || null,
    correo: body.correo,
    telefono: body.telefono || null,
    clave_elector: body.clave_elector || null,
    doc_identificacion: docIdentificacion,
    doc_curp: docCurp
  };

  const clienteActualizado = await Cliente.update(curp, datosActualizados);

  res.status(200).json({
    message: "Cliente actualizado correctamente",
    cliente: clienteActualizado
  });
});





exports.delete = asyncHandler(async (req, res) => {
  const { curp } = req.body; // tomamos la CURP del body

  if (!curp) {
    return res.status(400).json({ message: 'La CURP es requerida para eliminar el cliente' });
  }

  // Verificar si existe el cliente
  const clienteExistente = await Cliente.getByCurp(curp);
  if (!clienteExistente) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  // Proceder con la eliminación
  const clienteEliminado = await Cliente.delete(curp);

  res.status(200).json({
    message: 'Cliente eliminado correctamente',
    cliente: clienteEliminado
  });
});

exports.buscarPorCorreo = asyncHandler(async (req, res) => {
  const { correo } = req.query;

  if (!correo) {
    return res.status(400).json({ message: "Correo requerido" });
  }

  const result = await pool.query(
    "SELECT * FROM cliente WHERE correo = $1",
    [correo]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  res.json(result.rows[0]);
});

