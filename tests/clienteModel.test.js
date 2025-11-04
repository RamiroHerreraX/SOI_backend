const Cliente = require('../src/models/clienteModel');
const pool = require('../src/db');

jest.mock('../src/db', () => ({
  query: jest.fn()
}));

describe('Cliente model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const clienteEjemplo = {
    nombre: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'Gómez',
    correo: 'juan@example.com',
    telefono: '5512345678',
    curp: 'JUAP800101HDFABC01',
    clave_elector: 'ABC12345678901234567',
    doc_identificacion: 'ruta/doc.pdf',
    doc_curp: 'ruta/curp.pdf'
  };

  test('validate: debe validar correctamente un cliente', () => {
    const { error } = Cliente.validate(clienteEjemplo);
    expect(error).toBeUndefined();
  });

  test('getAll: debe retornar todos los clientes', async () => {
    pool.query.mockResolvedValue({ rows: [clienteEjemplo] });
    const result = await Cliente.getAll();
    expect(result).toEqual([clienteEjemplo]);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM cliente ORDER BY id_cliente');
  });

  test('getByCurp: debe retornar un cliente por CURP', async () => {
    pool.query.mockResolvedValue({ rows: [clienteEjemplo] });
    const result = await Cliente.getByCurp(clienteEjemplo.curp);
    expect(result).toEqual(clienteEjemplo);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM cliente WHERE curp=$1', [clienteEjemplo.curp]);
  });

  test('getByCorreo: debe retornar un cliente por correo', async () => {
    pool.query.mockResolvedValue({ rows: [clienteEjemplo] });
    const result = await Cliente.getByCorreo(clienteEjemplo.correo);
    expect(result).toEqual(clienteEjemplo);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM cliente WHERE correo=$1', [clienteEjemplo.correo]);
  });

  test('create: debe crear un cliente', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // verificaciones de unicidad
      .mockResolvedValueOnce({ rows: [clienteEjemplo] }); // insert
    const result = await Cliente.create(clienteEjemplo);
    expect(result).toEqual(clienteEjemplo);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test('update: debe actualizar un cliente', async () => {
    const datosActualizados = { nombre: 'Juanito' };
    pool.query
      .mockResolvedValueOnce({ rows: [clienteEjemplo] }) // check existente
      .mockResolvedValueOnce({ rows: [] }) // check unicidad
      .mockResolvedValueOnce({ rows: [{ ...clienteEjemplo, ...datosActualizados }] }); // update
    const result = await Cliente.update(clienteEjemplo.curp, datosActualizados);
    expect(result.nombre).toBe('Juanito');
  });

  test('delete: debe eliminar un cliente', async () => {
    pool.query.mockResolvedValue({ rows: [clienteEjemplo] });
    const result = await Cliente.delete(clienteEjemplo.curp);
    expect(result).toEqual(clienteEjemplo);
    expect(pool.query).toHaveBeenCalledWith('DELETE FROM cliente WHERE curp=$1 RETURNING *', [clienteEjemplo.curp]);
  });
});