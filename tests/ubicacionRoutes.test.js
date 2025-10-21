const request = require('supertest');
const express = require('express');
const ubicacionRoutes = require('../src/routes/ubicacionRoutes');

// Mock del controller
jest.mock('../src/controllers/ubicacionController', () => ({
  getEstados: jest.fn((req, res) => res.status(200).json([{ id: 1, nombre: 'Estado1' }])),
  getCiudades: jest.fn((req, res) => res.status(200).json([{ id: 10, nombre: 'Ciudad1', estadoId: req.params.estadoId }])),
  getColonias: jest.fn((req, res) => res.status(200).json([{ id: 100, nombre: 'Colonia1', ciudadId: req.params.ciudadId }])),
  getCiudadPorCP: jest.fn((req, res) => res.status(200).json({ id: 10, nombre: 'CiudadCP', codigoPostal: req.params.codigoPostal })),
  getCiudadById: jest.fn((req, res) => res.status(200).json({ id: req.params.id_ciudad, nombre: 'CiudadById' })),
}));

const app = express();
app.use(express.json());
app.use('/ubicacion', ubicacionRoutes);

describe('Rutas de Ubicacion', () => {

  test('GET /ubicacion/estados -> Debe devolver lista de estados', async () => {
    const res = await request(app).get('/ubicacion/estados');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, nombre: 'Estado1' }]);
  });

  test('GET /ubicacion/ciudades/:estadoId -> Debe devolver ciudades de un estado', async () => {
    const res = await request(app).get('/ubicacion/ciudades/5');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 10, nombre: 'Ciudad1', estadoId: '5' }]);
  });

  test('GET /ubicacion/colonias/:ciudadId -> Debe devolver colonias de una ciudad', async () => {
    const res = await request(app).get('/ubicacion/colonias/10');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 100, nombre: 'Colonia1', ciudadId: '10' }]);
  });

  test('GET /ubicacion/codigo-postal/:codigoPostal -> Debe devolver ciudad por código postal', async () => {
    const res = await request(app).get('/ubicacion/codigo-postal/12345');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 10, nombre: 'CiudadCP', codigoPostal: '12345' });
  });

  test('GET /ubicacion/ciudad/:id_ciudad -> Debe devolver ciudad por ID', async () => {
    const res = await request(app).get('/ubicacion/ciudad/10');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: '10', nombre: 'CiudadById' });
  });

});
