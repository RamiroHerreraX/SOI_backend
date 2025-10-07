const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Obtener todos los usuarios o filtrados por rol
router.get('/', userController.getUsersByRole);

// Obtener un usuario por ID
router.get('/:id', userController.getUserById);

// Crear un usuario
router.post('/', userController.createUser);

// Actualizar un usuario por ID
router.put('/:id', userController.updateUser);

// Eliminar un usuario por ID
router.delete('/:id', userController.deleteUser);

module.exports = router;
