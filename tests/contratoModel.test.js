const ContratoVenta = require('../src/models/contratoModel');

describe('ContratoVenta Model', () => {

  // ---------- Validación Joi ----------
  describe('validate', () => {
    it('debe validar un contrato correcto', () => {
      const data = {
        id_lote: 1,
        id_cliente: 2,
        precio_total: 1000.50,
        enganche: 100,
        plazo_meses: 12,
        estado_contrato: 'activo'
      };
      const { error, value } = ContratoVenta.validate(data);
      expect(error).toBeUndefined();
      expect(value).toMatchObject(data);
    });

    it('debe fallar si falta id_lote', () => {
      const data = { precio_total: 1000, enganche: 100, plazo_meses: 12 };
      const { error } = ContratoVenta.validate(data);
      expect(error).toBeDefined();
      expect(error.message).toContain('El id_lote es obligatorio');
    });

    it('debe permitir datos de cliente si no hay id_cliente', () => {
      const data = { 
        id_lote: 1,
        id_cliente: null,
        precio_total: 1000,
        enganche: 100,
        plazo_meses: 12,
        nombre: 'Juan',
        apellido_paterno: 'Pérez'
      };
      const { error, value } = ContratoVenta.validate(data);
      expect(error).toBeUndefined();
      expect(value.nombre).toBe('Juan');
    });

    it('debe prohibir datos de cliente si hay id_cliente', () => {
      const data = { 
        id_lote: 1,
        id_cliente: 1,
        precio_total: 1000,
        enganche: 100,
        plazo_meses: 12,
        nombre: 'Juan'
      };
      const { error } = ContratoVenta.validate(data);
      expect(error).toBeDefined();
    });
  });

  // ---------- createContractRecord ----------
  describe('createContractRecord', () => {
    it('debe insertar un contrato y retornar el registro', async () => {
      // Cliente mock que simula query
      const fakeClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] })
      };

      const payload = {
        id_lote: 1,
        id_cliente: 2,
        precio_total: 1000,
        enganche: 100,
        plazo_meses: 12,
        estado_contrato: 'activo'
      };

      const result = await ContratoVenta.createContractRecord(fakeClient, payload);

      expect(result).toEqual({ id: 1 });
      expect(fakeClient.query).toHaveBeenCalledTimes(1);
      expect(fakeClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contrato_venta'),
        [payload.id_lote, payload.id_cliente, payload.precio_total, payload.enganche, payload.plazo_meses, payload.estado_contrato]
      );
    });
  });
});