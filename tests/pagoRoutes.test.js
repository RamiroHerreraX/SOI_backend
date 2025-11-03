// tests/pagoRoutes.test.js
const request = require('supertest');
const express = require('express');

// Mock del controlador
jest.mock('../src/controllers/pagoController', () => ({
  getByContrato: jest.fn((req, res) => res.status(200).json({ message: 'Contrato encontrado' })),
  marcarPagadoPorCorreo: jest.fn((req, res) => res.status(200).json({ message: 'Pago marcado como pagado' })),
}));

const pagoController = require('../src/controllers/pagoController');
const pagoRoutes = require('../src/routes/pagoRoutes');

describe('Rutas de pago', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/pagos', pagoRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/pagos/contrato llama a pagoController.getByContrato', async () => {
    const response = await request(app)
      .post('/api/pagos/contrato')
      .send({ contratoId: 123 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Contrato encontrado');
    expect(pagoController.getByContrato).toHaveBeenCalledTimes(1);
  });

  test('PUT /api/pagos/marcar-pagado llama a pagoController.marcarPagadoPorCorreo', async () => {
    const response = await request(app)
      .put('/api/pagos/marcar-pagado')
      .send({ correo: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Pago marcado como pagado');
    expect(pagoController.marcarPagadoPorCorreo).toHaveBeenCalledTimes(1);
  });
});
