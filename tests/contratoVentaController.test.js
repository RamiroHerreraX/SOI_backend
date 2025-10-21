const { obtenerContrato, createContrato, addMonthsPreserveDay, phoneNormalizer } = require('../src/controllers/contratoVentaController');
const pool = require('../src/db');
const ContratoVenta = require('../src/models/contratoModel');
const Pago = require('../src/models/pagoModel');

jest.mock('../src/db'); // solo mock de pool para queries
jest.mock('../src/models/pagoModel'); // opcional, para controlar insert de pagos

describe('ContratoVenta Controller', () => {
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
  // TEST createContrato exitoso
  // ===============================
  it('debe crear contrato correctamente', async () => {
    req.body = {
      id_lote: 1,
      id_cliente: 2,
      precio_total: 100000,
      enganche: 10000,
      plazo_meses: 10
    };

    // Mock cliente conectado
    const fakeClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_propiedad: 1, estado_propiedad: 'disponible' }] }) // lote OK
        .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE lote
        .mockResolvedValue({ rowCount: 1 }), // otros queries
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(fakeClient);

    // Mock de ContratoVenta real
    ContratoVenta.validate = jest.fn().mockReturnValue({ error: null });
    ContratoVenta.createContractRecord = jest.fn().mockResolvedValue({ id_contrato: 99 });

    // Mock Pago
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
  // TEST createContrato enganche inválido
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
  // TEST createContrato lote inexistente
  // ===============================
  it('debe retornar error si lote no encontrado', async () => {
    req.body = { id_lote: 1, id_cliente: 2, precio_total: 10000, enganche: 1000, plazo_meses: 5 };

    const fakeClient = { query: jest.fn().mockResolvedValueOnce({ rowCount: 0 }), release: jest.fn() };
    pool.connect.mockResolvedValue(fakeClient);
    ContratoVenta.validate = jest.fn().mockReturnValue({ error: null });

    await createContrato(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Lote no encontrado' }));
  });

  // ===============================
  // TEST helper addMonthsPreserveDay
  // ===============================
  it('addMonthsPreserveDay debe funcionar correctamente', () => {
    const d = new Date('2024-01-31');
    const result = addMonthsPreserveDay(d, 1);
    expect(result.getMonth()).toBe(1); // febrero
  });

  // ===============================
  // TEST phoneNormalizer
  // ===============================
  it('phoneNormalizer normaliza correctamente', () => {
    expect(phoneNormalizer(' 123 ')).toBe('123');
    expect(phoneNormalizer(null)).toBeNull();
  });
});