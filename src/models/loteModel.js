const Lote = require('../models/loteModel');
const pool = require('../db');

jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
}));

describe('Modelo Lote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- VALIDACIÓN ---
  test('Valida correctamente un lote válido', () => {
    const data = {
      tipo: 'casa',
      numLote: 'A12',
      direccion: 'Calle 5',
      superficie_m2: 200,
      precio: 1500000,
      estado_propiedad: 'disponible',
    };
    const result = Lote.validate(data);
    expect(result.error).toBeUndefined();
  });

  test('Detecta error si falta un campo obligatorio', () => {
    const data = {
      tipo: 'casa',
      superficie_m2: 200,
      precio: 1500000,
      estado_propiedad: 'disponible',
    };
    const result = Lote.validate(data);
    expect(result.error).toBeDefined();
  });

  // --- GET ALL ---
  test('getAll ejecuta la consulta SQL esperada', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_propiedad: 1 }] });
    const res = await Lote.getAll();
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM lote ORDER BY id_propiedad');
    expect(res[0].id_propiedad).toBe(1);
  });

  // --- GET BY ID ---
  test('getById ejecuta la consulta con el ID', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_propiedad: 2 }] });
    const res = await Lote.getById(2);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM lote WHERE id_propiedad=$1', [2]);
    expect(res.id_propiedad).toBe(2);
  });

  // --- GET BY NUM LOTE + MANZANA ---
  test('getByNumLoteManzana ejecuta la consulta correcta', async () => {
    pool.query.mockResolvedValue({ rows: [{ numLote: 'A12', manzana: 'M1' }] });
    const res = await Lote.getByNumLoteManzana('A12', 'M1');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM lote WHERE numLote=$1 AND manzana IS NOT DISTINCT FROM $2 LIMIT 1',
      ['A12', 'M1']
    );
    expect(res.numLote).toBe('A12');
  });

  // --- GET BY DIRECCION ---
  test('getByDireccion ejecuta la consulta correcta', async () => {
    pool.query.mockResolvedValue({ rows: [{ direccion: 'Calle 5' }] });
    const res = await Lote.getByDireccion('Calle 5');
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM lote WHERE direccion=$1 LIMIT 1',
      ['Calle 5']
    );
    expect(res.direccion).toBe('Calle 5');
  });

  // --- DELETE ---
  test('delete ejecuta DELETE correctamente', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_propiedad: 3 }] });
    const res = await Lote.delete(3);
    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM lote WHERE id_propiedad=$1 RETURNING *',
      [3]
    );
    expect(res.id_propiedad).toBe(3);
  });

  // --- CREATE ---
  test('create inserta correctamente un lote', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // check colonia existente
        .mockResolvedValueOnce({ rows: [{ id_colonia: 10 }] }) // insert colonia
        .mockResolvedValueOnce({ rows: [{ id_propiedad: 5 }] }) // insert lote
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    pool.connect.mockResolvedValueOnce(mockClient);

    const data = {
      tipo: 'casa',
      numLote: 'A12',
      direccion: 'Calle 5',
      id_ciudad: 1,
      id_estado: 1,
      nombre_colonia_nueva: 'Colonia Test',
      superficie_m2: 200,
      precio: 1500000,
      estado_propiedad: 'disponible',
    };

    const res = await Lote.create(data);
    expect(mockClient.query).toHaveBeenCalled();
    expect(res.id_propiedad).toBe(5);
    expect(mockClient.release).toHaveBeenCalled();
  });

  // --- UPDATE ---
  test('update modifica correctamente un lote', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // check colonia existente
        .mockResolvedValueOnce({ rows: [{ id_colonia: 10 }] }) // insert colonia
        .mockResolvedValueOnce({ rows: [{ id_propiedad: 5 }] }) // update lote
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    pool.connect.mockResolvedValueOnce(mockClient);

    const data = {
      tipo: 'depto',
      id_ciudad: 1,
      id_estado: 1,
      nombre_colonia_nueva: 'Colonia Test',
    };

    const res = await Lote.update(5, data);
    expect(mockClient.query).toHaveBeenCalled();
    expect(res.id_propiedad).toBe(5);
    expect(mockClient.release).toHaveBeenCalled();
  });
});
