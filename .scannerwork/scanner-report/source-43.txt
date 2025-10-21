const request = require('supertest');
const express = require('express');

// Mock del controlador
jest.mock('../src/controllers/contratoVentaController', () => ({
  createContrato: jest.fn((req, res) => res.status(201).json({ message: 'Contrato creado' })),
  obtenerContrato: jest.fn((req, res) => res.status(200).json([{ id_contrato: 1, cliente_nombre: 'Alejandra' }])),
}));

const contratoController = require('../src/controllers/contratoVentaController');
const contratoRoutes = require('../src/routes/contratoRoutes');

describe('Rutas de contrato', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/contratos', contratoRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/contratos debe llamar contratoController.createContrato', async () => {
    const response = await request(app)
      .post('/api/contratos')
      .send({ id_lote: 1, id_cliente: 2, precio_total: 100000, enganche: 10000, plazo_meses: 10 });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Contrato creado');
    expect(contratoController.createContrato).toHaveBeenCalledTimes(1);
  });

  test('GET /api/contratos debe llamar contratoController.obtenerContrato', async () => {
    const response = await request(app)
      .get('/api/contratos');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id_contrato: 1, cliente_nombre: 'Alejandra' }]);
    expect(contratoController.obtenerContrato).toHaveBeenCalledTimes(1);
  });
});

