const Lote = require('../models/loteModel');
const pool = require('../src/db/');

jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
}));

describe('Modelo Lote', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Valida correctamente los datos de un lote válido', () => {
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

  test('Detecta error cuando falta un campo obligatorio', () => {
    const data = {
      tipo: 'casa',
      direccion: 'Calle 5',
      superficie_m2: 200,
      estado_propiedad: 'disponible',
    };
    const result = Lote.validate(data);
    expect(result.error).toBeDefined();
  });

  test('getAll ejecuta la consulta SQL esperada', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_propiedad: 1 }] });
    const res = await Lote.getAll();
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM lote ORDER BY id_propiedad');
    expect(res[0].id_propiedad).toBe(1);
  });

  test('delete ejecuta el DELETE esperado', async () => {
    pool.query.mockResolvedValue({ rows: [{ id_propiedad: 2 }] });
    const result = await Lote.delete(2);
    expect(pool.query).toHaveBeenCalledWith('DELETE FROM lote WHERE id_propiedad=$1 RETURNING *', [2]);
    expect(result.id_propiedad).toBe(2);
  });
});
