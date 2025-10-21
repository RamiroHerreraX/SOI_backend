const Lote = require('../models/loteModel');

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req,res,next)).catch(next);
};

exports.getAllLotes = asyncHandler(async (req,res)=>{
  const lotes = await Lote.getAll();
  res.json(lotes);
});

exports.getLoteById = asyncHandler(async (req,res)=>{
  const lote = await Lote.getById(req.params.id);
  if(!lote) return res.status(404).json({message:"Lote no encontrado"});
  res.json(lote);
});

exports.createLote = asyncHandler(async (req, res) => {
  try {
    const { error } = loteSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        mensaje: "Errores de validación",
        detalles: error.details.map(err => err.message)
      });
    }
    const data = { ...req.body };

    if (req.file) {
      // Guardar la ruta de la imagen en el objeto data
      data.imagen = `/uploads/${req.file.filename}`;
    } else {
      data.imagen = null;
    }

    const lote = await Lote.create(data);
    res.status(201).json(lote);
  } catch (err) {
    console.error('Error createLote:', err.message || err);
    res.status(400).json({ error: err.message || 'Error al crear el lote (backend)' });
  }
});

// Obtener lote por numLote+manzana (terreno) o direccion (otros)
// Obtener lote por numLote+manzana o direccion según tipo
exports.getLote = asyncHandler(async (req, res) => {
  const { tipo, numLote, manzana, direccion } = req.query;

  if (!tipo) return res.status(400).json({ status: "fail", msg: "El campo tipo es obligatorio" });

  let lote;
  if (tipo.toLowerCase() === "terreno") {
    if (!numLote) return res.status(400).json({ status: "fail", msg: "numLote es obligatorio para terrenos" });
    lote = await Lote.getByNumLoteManzana(numLote, manzana || null);
  } else {
    if (!direccion) return res.status(400).json({ status: "fail", msg: "direccion es obligatoria para este tipo" });
    lote = await Lote.getByDireccion(direccion);
  }

  if (!lote) return res.status(404).json({ status: "fail", msg: "Lote no encontrado" });

  res.status(200).json({ status: "success", lote });
});

// Actualizar lote por numLote+manzana o direccion
exports.updateLoteByQuery = asyncHandler(async (req, res) => {
  const { tipo, numLote, manzana, direccion } = req.query;
  let lote;

  if (tipo.toLowerCase() === "terreno") {
    lote = await Lote.getByNumLoteManzana(numLote, manzana || null);
  } else {
    lote = await Lote.getByDireccion(direccion);
  }

  if (!lote) return res.status(404).json({ status: "fail", msg: "Lote no encontrado" });

  const data = { ...req.body };
  if (req.file) data.imagen = `/uploads/${req.file.filename}`;

  const updatedLote = await Lote.update(lote.id_propiedad, data);
  res.status(200).json({ status: "success", lote: updatedLote });
});

// Eliminar lote por numLote+manzana o direccion
exports.deleteLoteByQuery = asyncHandler(async (req, res) => {
  const { tipo, numLote, manzana, direccion } = req.query;
  let lote;

  if (tipo.toLowerCase() === "terreno") {
    lote = await Lote.getByNumLoteManzana(numLote, manzana || null);
  } else {
    lote = await Lote.getByDireccion(direccion);
  }

  if (!lote) return res.status(404).json({ status: "fail", msg: "Lote no encontrado" });

  const deletedLote = await Lote.delete(lote.id_propiedad);
  res.status(200).json({ status: "success", lote: deletedLote });
});




exports.updateLote = asyncHandler(async (req,res)=>{
  const data = { ...req.body };
  if (req.file) {
    data.imagen = `/uploads/${req.file.filename}`;
  }
  const lote = await Lote.update(req.params.id, data);
  res.json(lote);
});


exports.deleteLote = asyncHandler(async (req,res)=>{
  const lote = await Lote.delete(req.params.id);
  res.json(lote);
});
