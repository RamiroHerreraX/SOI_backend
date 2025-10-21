// tests/userModel.test.js
const bcrypt = require('bcrypt');
const pool = require('../src/db'); // Ajusta la ruta si tu archivo db.js está en otra carpeta
const User = require('../src/models/userModel');

// Mock de pool.query y bcrypt
jest.mock('../src/db', () => ({
  query: jest.fn(),
}));
jest.mock('bcrypt');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === VALIDACIÓN ===
  test('validate() debe aprobar datos válidos', () => {
    const result = User.validate({
      usuario: 'Alejandra',
      password: '123456',
      rol: 'secretaria',
      correo: 'ale@example.com',
      telefono: '5512345678',
    });
    expect(result.error).toBeUndefined();
  });

  test('validate() debe fallar si falta un campo obligatorio', () => {
    const result = User.validate({
      usuario: 'Alejandra',
      password: '123456',
      rol: 'secretaria',
    });
    expect(result.error).toBeDefined();
  });

  // === CREAR USUARIO ===
  test('create() debe crear usuario nuevo', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // No existen duplicados
      .mockResolvedValueOnce({
        rows: [
          {
            id_user: 1,
            usuario: 'TestUser',
            rol: 'secretaria',
            correo: 'test@example.com',
            telefono: '5512345678',
          },
        ],
      });

    bcrypt.hash.mockResolvedValue('hashedPassword');

    const result = await User.create({
      usuario: 'TestUser',
      password: '123456',
      rol: 'secretaria',
      correo: 'test@example.com',
      telefono: '5512345678',
    });

    expect(result.usuario).toBe('TestUser');
    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test('create() debe lanzar error si correo o teléfono ya existen', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id_user: 1 }] });
    await expect(
      User.create({
        usuario: 'Duplicado',
        password: '123456',
        rol: 'secretaria',
        correo: 'test@example.com',
        telefono: '5512345678',
      })
    ).rejects.toThrow('El correo o teléfono ya están registrados.');
  });

  // === GETTERS ===
  test('getAll() debe devolver lista de usuarios', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id_user: 1, usuario: 'User1' }],
    });

    const users = await User.getAll();
    expect(users).toHaveLength(1);
    expect(pool.query).toHaveBeenCalled();
  });

  test('getByRole() debe devolver usuarios por rol', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id_user: 2, usuario: 'Encargado' }],
    });

    const result = await User.getByRole('encargado');
    expect(result[0].usuario).toBe('Encargado');
  });

  test('getById() debe devolver un usuario por ID', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id_user: 1, usuario: 'TestUser' }],
    });

    const result = await User.getById(1);
    expect(result.usuario).toBe('TestUser');
  });

  // === UPDATE ===
  test('update() debe actualizar un usuario', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // No hay duplicados
      .mockResolvedValueOnce({
        rows: [{ id_user: 1, usuario: 'Actualizado' }],
      });

    bcrypt.hash.mockResolvedValue('hashedPass');

    const result = await User.update(1, { usuario: 'Actualizado', password: 'nueva' });
    expect(result.usuario).toBe('Actualizado');
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test('update() debe lanzar error si no hay datos', async () => {
    await expect(User.update(1, {})).rejects.toThrow('No hay datos para actualizar');
  });

  // === DELETE ===
  test('delete() debe eliminar un usuario', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id_user: 1, usuario: 'Borrado' }],
    });

    const result = await User.delete(1);
    expect(result.usuario).toBe('Borrado');
  });

  // === UTILIDADES ===
  test('verifyPassword() debe comparar contraseñas correctamente', async () => {
    bcrypt.compare.mockResolvedValue(true);
    const isValid = await User.verifyPassword('123', 'hashed');
    expect(isValid).toBe(true);
  });

  // === EMAIL ===
  test('getByEmail() debe devolver usuario por correo', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id_user: 3, correo: 'test@example.com' }],
    });

    const result = await User.getByEmail('test@example.com');
    expect(result.correo).toBe('test@example.com');
  });

  test('updatePassword() debe actualizar la contraseña', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    await User.updatePassword('test@example.com', 'hashedPass');
    expect(pool.query).toHaveBeenCalled();
  });
});

