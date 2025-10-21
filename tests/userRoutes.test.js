const request = require('supertest');
const express = require('express');
const userRoutes = require('../src/routes/userRoutes');

// Mock del controller
jest.mock('../src/controllers/userController', () => ({
  getUsersByRole: jest.fn((req, res) => res.status(200).json([{ id: 1, nombre: 'Juan', rol: 'admin' }])),
  getUserById: jest.fn((req, res) => res.status(200).json({ id: req.params.id, nombre: 'Juan', rol: 'admin' })),
  createUser: jest.fn((req, res) => res.status(201).json({ id: 2, ...req.body })),
  updateUser: jest.fn((req, res) => res.status(200).json({ id: req.params.id, ...req.body })),
  deleteUser: jest.fn((req, res) => res.status(200).json({ id: req.params.id, mensaje: 'Usuario eliminado' })),
}));

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

describe('Rutas de User', () => {

  test('GET /users -> Debe devolver lista de usuarios', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, nombre: 'Juan', rol: 'admin' }]);
  });

  test('GET /users/:id -> Debe devolver un usuario por ID', async () => {
    const res = await request(app).get('/users/5');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: '5', nombre: 'Juan', rol: 'admin' });
  });

  test('POST /users -> Debe crear un usuario', async () => {
    const newUser = { nombre: 'Ana', rol: 'user' };
    const res = await request(app).post('/users').send(newUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 2, ...newUser });
  });

  test('PUT /users/:id -> Debe actualizar un usuario', async () => {
    const updatedUser = { nombre: 'Ana Actualizada', rol: 'user' };
    const res = await request(app).put('/users/2').send(updatedUser);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: '2', ...updatedUser });
  });

  test('DELETE /users/:id -> Debe eliminar un usuario', async () => {
    const res = await request(app).delete('/users/2');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: '2', mensaje: 'Usuario eliminado' });
  });

});
