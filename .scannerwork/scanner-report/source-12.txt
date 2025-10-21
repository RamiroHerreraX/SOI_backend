const Cliente = require('../models/clienteModel');
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req,res,next)).catch(next);

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
  const { error } = Cliente.validate(req.body);
  if (error) return res.status(400).json({ mensaje: 'Error de validación', detalles: [error.details[0].message] });

  // verificar si existe por correo
  const existing = await Cliente.getByCorreo(req.body.correo);
  if (existing) return res.status(409).json({ message: 'Ya existe un cliente con ese correo', cliente: existing });

  const cliente = await Cliente.create(req.body);
  res.status(201).json(cliente);
});

exports.update = asyncHandler(async (req, res) => {
  const { curp, datos } = req.body;

  if (!curp) {
    return res.status(400).json({ message: 'La CURP es requerida para la actualización' });
  }

  if (!datos || typeof datos !== 'object') {
    return res.status(400).json({ message: 'El objeto "datos" es requerido con los campos del cliente' });
  }

  // No permitir actualizar la CURP misma dentro de "datos"
  delete datos.curp;

  // Verificar si el cliente existe
  const clienteExistente = await Cliente.getByCurp(curp);
  if (!clienteExistente) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  // Proceder con la actualización de todos los campos que envíes
  const clienteActualizado = await Cliente.update(curp, datos);

  res.status(200).json({
    message: 'Cliente actualizado correctamente',
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

