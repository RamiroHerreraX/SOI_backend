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
