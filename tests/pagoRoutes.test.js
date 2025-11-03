// tests/pagoRoutes.test.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const pagoController = require('../src/controllers/pagoController');

// Mock del controlador
jest.mock('../src/controllers/pagoController');

const app = express();
app.use(bodyParser.json());

// Configurar rutas como en pagoRoutes.js
const router = express.Router();
router.post('/contrato', pagoController.getByContrato);
router.put('/marcar-pagado', pagoController.marcarPagadoPorCorreo);

app.use('/pagos', router);

describe('📋 Pago Routes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- POST /pagos/contrato ----------
  test('POST /pagos/contrato - debe devolver pagos por contrato', async () => {
    const fakePagos = [{ id_pago: 1, monto: 100 }];
    pagoController.getByContrato.mockImplementation((req, res) => res.status(200).json(fakePagos));

    const res = await request(app).post('/pagos/contrato').send({ id_contrato: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakePagos);
    expect(pagoController.getByContrato).toHaveBeenCalled();
  });

  test('POST /pagos/contrato - manejar error', async () => {
    pagoController.getByContrato.mockImplementation((req, res) => res.status(500).json({ error: 'DB Error' }));

    const res = await request(app).post('/pagos/contrato').send({ id_contrato: 1 });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('DB Error');
    expect(pagoController.getByContrato).toHaveBeenCalled();
  });

  // ---------- PUT /pagos/marcar-pagado ----------
  test('PUT /pagos/marcar-pagado - debe marcar pagos como pagados por correo', async () => {
    const fakeResponse = { mensaje: 'Pagos actualizados' };
    pagoController.marcarPagadoPorCorreo.mockImplementation((req, res) => res.status(200).json(fakeResponse));

    const res = await request(app).put('/pagos/marcar-pagado').send({ correo: 'juan@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeResponse);
    expect(pagoController.marcarPagadoPorCorreo).toHaveBeenCalled();
  });

  test('PUT /pagos/marcar-pagado - manejar error', async () => {
    pagoController.marcarPagadoPorCorreo.mockImplementation((req, res) => res.status(500).json({ error: 'DB Error' }));

    const res = await request(app).put('/pagos/marcar-pagado').send({ correo: 'juan@example.com' });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('DB Error');
    expect(pagoController.marcarPagadoPorCorreo).toHaveBeenCalled();
  });

});
