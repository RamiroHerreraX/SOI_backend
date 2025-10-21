const User = require('../models/userModel');

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req,res,next)).catch(next);
};

exports.getUsersByRole = asyncHandler(async (req, res) => {
  const { rol } = req.query;

  let users;
  if (rol) {
    // Si se pasa un rol (?rol=encargado)
    const result = await User.getByRole(rol);
    users = result;
  } else {
    // Si no se pasa rol, traer todos
    users = await User.getAll();
  }

  res.json(users);
});

exports.getUserById = asyncHandler(async (req,res)=>{
  const user = await User.getById(req.params.id);
  if(!user) return res.status(404).json({message:"Usuario no encontrado"});
  res.json(user);
});

exports.createUser = asyncHandler(async (req,res)=>{
  const { error } = User.validate(req.body);
  if(error) return res.status(400).json({message: error.details[0].message});

  const user = await User.create(req.body);
  res.status(201).json(user);
});

exports.updateUser = asyncHandler(async (req,res)=>{
  const user = await User.update(req.params.id, req.body);
  res.json(user);
});

exports.deleteUser = asyncHandler(async (req,res)=>{
  const user = await User.delete(req.params.id);
  res.json(user);
});

