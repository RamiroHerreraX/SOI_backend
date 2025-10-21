const request = require('supertest');
const express = require('express');
const loteRoutes = require('../src/routes/loteRoutes');

// Mock de loteController
jest.mock('../src/controllers/loteController', () => ({
  getAllLotes: jest.fn((req, res) => res.status(200).json([{ id: 1, nombre: 'Lote1' }])),
  getLoteById: jest.fn((req, res) => res.status(200).json({ id: req.params.id, nombre: 'Lote1' })),
  createLote: jest.fn((req, res) => res.status(201).json({ id: 2, nombre: 'Nuevo Lote' })),
  updateLote: jest.fn((req, res) => res.status(200).json({ id: req.params.id, nombre: 'Lote Actualizado' })),
  deleteLote: jest.fn((req, res) => res.status(200).json({ message: 'Lote eliminado' })),
  getLote: jest.fn((req, res) => res.status(200).json({ id: 3, nombre: 'Lote Buscado' })),
  updateLoteByQuery: jest.fn((req, res) => res.status(200).json({ id: 4, nombre: 'Lote Actualizado Query' })),
  deleteLoteByQuery: jest.fn((req, res) => res.status(200).json({ message: 'Lote eliminado Query' })),
}));

const app = express();
app.use(express.json());
app.use('/lotes', loteRoutes);

describe('Rutas de Lote', () => {
  test('GET /lotes -> Debe devolver todos los lotes', async () => {
    const res = await request(app).get('/lotes');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, nombre: 'Lote1' }]);
  });

  test('GET /lotes/:id -> Debe devolver un lote por ID', async () => {
    const res = await request(app).get('/lotes/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: '1', nombre: 'Lote1' });
  });

  test('POST /lotes -> Debe crear un lote', async () => {
    const res = await request(app)
      .post('/lotes')
      .field('nombre', 'Nuevo Lote'); // Para multipart/form-data
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 2, nombre: 'Nuevo Lote' });
  });

  test('PUT /lotes/:id -> Debe actualizar un lote', async () => {
    const res = await request(app)
      .put('/lotes/1')
      .field('nombre', 'Lote Actualizado');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: '1', nombre: 'Lote Actualizado' });
  });

  test('DELETE /lotes/:id -> Debe eliminar un lote', async () => {
    const res = await request(app).delete('/lotes/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Lote eliminado' });
  });

  test('GET /lotes/buscar -> Debe buscar un lote', async () => {
    const res = await request(app).get('/lotes/buscar');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 3, nombre: 'Lote Buscado' });
  });

  test('PUT /lotes/actualizar -> Debe actualizar lote por query', async () => {
    const res = await request(app)
      .put('/lotes/actualizar')
      .field('nombre', 'Lote Actualizado Query');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 4, nombre: 'Lote Actualizado Query' });
  });

  test('DELETE /lotes/eliminar -> Debe eliminar lote por query', async () => {
    const res = await request(app).delete('/lotes/eliminar');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Lote eliminado Query' });
  });
});
