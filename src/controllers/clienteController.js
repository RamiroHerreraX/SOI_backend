const Cliente = require('../models/clienteModel');
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req,res,next)).catch(next);

exports.getAll = asyncHandler(async (req, res) => {
  const clientes = await Cliente.getAll();
  res.json(clientes);
});

exports.getById = asyncHandler(async (req, res) => {
  const cliente = await Cliente.getById(req.params.id);
  if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
  res.json(cliente);
});

exports.create = asyncHandler(async (req, res) => {
  const { error } = Cliente.validate(req.body);
  if (error) return res.status(400).json({ mensaje: 'Error de validación', detalles: [error.details[0].message] });

  // verificar si existe por correo
  const existing = await Cliente.getByCorreo(req.body.correo);
  if (existing) return res.status(409).json({ message: 'Ya existe un cliente con ese correo', cliente: existing });

  const cliente = await Cliente.create(req.body);
  res.status(201).json(cliente);
});

exports.update = asyncHandler(async (req, res) => {
  const cliente = await Cliente.update(req.params.id, req.body);
  res.json(cliente);
});

exports.delete = asyncHandler(async (req, res) => {
  const cliente = await Cliente.delete(req.params.id);
  res.json(cliente);
});
