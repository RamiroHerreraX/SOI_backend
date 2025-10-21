const { obtenerContrato, createContrato } = require('../controllers/contratoController');
const pool = require('../db');
const ContratoVenta = require('../models/contratoModel');
const Pago = require('../models/pagoModel');

jest.mock('../db');
jest.mock('../models/contratoModel');
jest.mock('../models/pagoModel');

describe('Controlador Contrato', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // ===============================
  // TEST obtenerContrato
  // ===============================
  it('debe obtener contratos correctamente', async () => {
    const rows = [{ id_contrato: 1, cliente_nombre: 'Alejandra' }];
    pool.query.mockResolvedValue({ rows });

    await obtenerContrato(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  // ===============================
  // TEST createContrato con datos válidos
  // ===============================
  it('debe crear un contrato correctamente', async () => {
    req.body = {
      id_lote: 1,
      id_cliente: 2,
      precio_total: 100000,
      enganche: 10000,
      plazo_meses: 10
    };

    const fakeClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    // Simular que el lote existe y está disponible
    fakeClient.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_propiedad: 1, estado_propiedad: 'disponible' }] }) // Lote OK
      .mockResolvedValueOnce({ rowCount: 1 }); // UPDATE OK

    pool.connect.mockResolvedValue(fakeClient);

    ContratoVenta.validate = jest.fn().mockReturnValue({ error: null });
    ContratoVenta.createContractRecord = jest.fn().mockResolvedValue({ id_contrato: 99 });
    Pago.createBulk = jest.fn().mockResolvedValue([{ id_pago: 1 }]);

    await createContrato(req, res);

    expect(ContratoVenta.createContractRecord).toHaveBeenCalled();
    expect(Pago.createBulk).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      contrato: { id_contrato: 99 },
      mensualidad: expect.any(Number),
      pagos: expect.any(Array)
    }));
  });

  // ===============================
  // TEST createContrato con enganche inválido
  // ===============================
  it('debe retornar error si enganche >= precio_total', async () => {
    req.body = { precio_total: 10000, enganche: 10000 };
    ContratoVenta.validate = jest.fn().mockReturnValue({ error: null });

    await createContrato(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('enganche')
    }));
  });

  // ===============================
  // TEST createContrato con lote inexistente
  // ===============================
  it('debe retornar error si lote no encontrado', async () => {
    req.body = { id_lote: 1, id_cliente: 2, precio_total: 10000, enganche: 1000, plazo_meses: 5 };

    const fakeClient = {
      query: jest.fn().mockResolvedValueOnce({ rowCount: 0 }),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(fakeClient);
    ContratoVenta.validate = jest.fn().mockReturnValue({ error: null });

    await createContrato(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Lote no encontrado'
    }));
  });

  // ===============================
  // TEST helper addMonthsPreserveDay
  // ===============================
  it('debe agregar meses correctamente incluso en meses cortos', () => {
    const { addMonthsPreserveDay } = require('../controllers/contratoController');
    const d = new Date('2024-01-31');
    const result = addMonthsPreserveDay(d, 1);
    expect(result.getMonth()).toBe(1); // febrero
  });

  // ===============================
  // TEST phoneNormalizer
  // ===============================
  it('debe normalizar teléfono correctamente', () => {
    const { phoneNormalizer } = require('../controllers/contratoController');
    expect(phoneNormalizer(' 123 ')).toBe('123');
    expect(phoneNormalizer(null)).toBeNull();
  });
});
