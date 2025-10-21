// tests/contratoVenta.test.js
const ContratoVenta = require('../src/models/contratoVenta');
const { Pool } = require('pg');

// Mock de la base de datos
const mockClient = {
  query: jest.fn()
};

describe('ContratoVenta Model', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('debería validar un contrato válido', () => {
      const data = {
        id_lote: 1,
        precio_total: 1000.50,
        enganche: 200,
        plazo_meses: 12
      };

      const { error, value } = ContratoVenta.validate(data);
      expect(error).toBeUndefined();
      expect(value.id_lote).toBe(1);
      expect(value.estado_contrato).toBe('activo'); // valor por default
    });

    it('debería fallar si falta id_lote', () => {
      const data = {
        precio_total: 1000,
        enganche: 200,
        plazo_meses: 12
      };
      const { error } = ContratoVenta.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toContain('El id_lote es obligatorio');
    });
  });

  describe('createContractRecord', () => {
    it('debería insertar un contrato y retornar el registro', async () => {
      const payload = {
        id_lote: 1,
        id_cliente: null,
        precio_total: 1000.50,
        enganche: 200,
        plazo_meses: 12,
        estado_contrato: 'activo'
      };

      // Mock de retorno de la DB
      mockClient.query.mockResolvedValue({
        rows: [ { ...payload, id: 123 } ]
      });

      const result = await ContratoVenta.createContractRecord(mockClient, payload);

      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('id', 123);
      expect(result.id_lote).toBe(1);
      expect(result.precio_total).toBe(1000.50);
    });
  });

});
