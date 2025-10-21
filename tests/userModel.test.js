// tests/user.test.js
const User = require('../models/userModel');
const pool = require('../src/db/');
const bcrypt = require('bcrypt');

jest.mock('../db', () => ({
  query: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('User Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ================== VALIDACIÓN ==================
  test('validate debe retornar error si faltan campos', () => {
    const { error } = User.validate({ usuario: 'a' }); // datos incompletos
    expect(error).toBeDefined();
  });

  test('validate debe aceptar datos correctos', () => {
    const data = {
      usuario: 'Juan',
      password: '123456',
      rol: 'secretaria',
      correo: 'juan@test.com',
      telefono: '1234567890'
    };
    const { error } = User.validate(data);
    expect(error).toBeUndefined();
  });

  // ================== CONSULTAS ==================
  test('getAll retorna lista de usuarios', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1, usuario: 'Juan' }] });
    const result = await User.getAll();
    expect(result).toEqual([{ id_user: 1, usuario: 'Juan' }]);
  });

  test('getById retorna un usuario', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1, usuario: 'Juan' }] });
    const result = await User.getById(1);
    expect(result).toEqual({ id_user: 1, usuario: 'Juan' });
  });

  test('getByRole retorna usuarios filtrados por rol', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1, rol: 'secretaria' }] });
    const result = await User.getByRole('secretaria');
    expect(result).toEqual([{ id_user: 1, rol: 'secretaria' }]);
  });

  // ================== CREAR ==================
  test('create inserta usuario si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // no existe
    bcrypt.hash.mockResolvedValueOnce('hashedPassword');
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1, usuario: 'Juan' }] });

    const result = await User.create({
      usuario: 'Juan',
      password: '123456',
      rol: 'secretaria',
      correo: 'juan@test.com',
      telefono: '1234567890'
    });
    expect(result).toEqual({ id_user: 1, usuario: 'Juan' });
  });

  test('create lanza error si correo o teléfono existen', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1 }] });
    await expect(User.create({
      usuario: 'Juan',
      password: '123456',
      rol: 'secretaria',
      correo: 'juan@test.com',
      telefono: '1234567890'
    })).rejects.toThrow('El correo o teléfono ya están registrados.');
  });

  // ================== UPDATE ==================
  test('update modifica usuario correctamente', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // check duplicado
    bcrypt.hash.mockResolvedValueOnce('hashedPassword');
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1, usuario: 'Juan2' }] });

    const result = await User.update(1, { usuario: 'Juan2', password: '654321' });
    expect(result).toEqual({ id_user: 1, usuario: 'Juan2' });
  });

  test('update lanza error si no hay datos', async () => {
    await expect(User.update(1, {})).rejects.toThrow('No hay datos para actualizar');
  });

  test('update lanza error si duplicado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 2 }] });
    await expect(User.update(1, { correo: 'dup@test.com' })).rejects.toThrow('El correo o teléfono ya están registrados por otro usuario.');
  });

  // ================== DELETE ==================
  test('delete elimina usuario', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1, usuario: 'Juan' }] });
    const result = await User.delete(1);
    expect(result).toEqual({ id_user: 1, usuario: 'Juan' });
  });

  // ================== UTILIDADES ==================
  test('verifyPassword compara correctamente', async () => {
    bcrypt.compare.mockResolvedValueOnce(true);
    const result = await User.verifyPassword('123', 'hash');
    expect(result).toBe(true);
  });

  // ================== NUEVAS FUNCIONES ==================
  test('getByEmail retorna usuario', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ correo: 'test@test.com' }] });
    const result = await User.getByEmail('test@test.com');
    expect(result).toEqual({ correo: 'test@test.com' });
  });

  test('updatePassword actualiza contraseña', async () => {
    pool.query.mockResolvedValueOnce({});
    await expect(User.updatePassword('test@test.com', 'hash')).resolves.not.toThrow();
  });
});
