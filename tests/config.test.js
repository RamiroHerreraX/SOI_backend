// tests/config.test.js
describe('Config', () => {
  let originalEnv;

  beforeAll(() => {
    // Guardamos las variables de entorno originales
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Restauramos las variables de entorno originales
    process.env = originalEnv;
  });

  test('Debe usar valores por defecto si no hay variables de entorno', () => {
    // Limpiamos variables de entorno
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_HOST;
    delete process.env.DB_NAME;
    delete process.env.DB_PORT;

    // Cargamos config
    const { config } = require('../src/config');

    expect(config.env).toBe('dev');
    expect(config.port).toBe(3000);
    expect(config.dbUser).toBeUndefined();
    expect(config.dbPassword).toBeUndefined();
    expect(config.dbHost).toBeUndefined();
    expect(config.dbName).toBeUndefined();
    expect(config.dbPort).toBeUndefined();
  });

  test('Debe usar valores de variables de entorno si están definidas', () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '4000';
    process.env.DB_USER = 'user';
    process.env.DB_PASSWORD = 'pass';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'mydb';
    process.env.DB_PORT = '5432';

    // Borramos cache para que se recargue config
    jest.resetModules();
    const { config } = require('../src/config');

    expect(config.env).toBe('test');
    expect(config.port).toBe('4000'); // recordatorio: process.env siempre es string
    expect(config.dbUser).toBe('user');
    expect(config.dbPassword).toBe('pass');
    expect(config.dbHost).toBe('localhost');
    expect(config.dbName).toBe('mydb');
    expect(config.dbPort).toBe('5432');
  });
});
