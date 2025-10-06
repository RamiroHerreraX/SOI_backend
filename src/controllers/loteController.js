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

exports.createLote = asyncHandler(async (req,res)=>{
  const lote = await Lote.create(req.body);
  res.status(201).json(lote);
});

exports.updateLote = asyncHandler(async (req,res)=>{
  const lote = await Lote.update(req.params.id, req.body);
  res.json(lote);
});

exports.deleteLote = asyncHandler(async (req,res)=>{
  const lote = await Lote.delete(req.params.id);
  res.json(lote);
});
