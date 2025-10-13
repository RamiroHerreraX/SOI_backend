const pool = require('../db');
const Joi = require('joi');

const contratoSchema = Joi.object({
  id_lote: Joi.number().integer().positive().required().messages({ 'any.required': 'El id_lote es obligatorio' }),
  id_cliente: Joi.number().integer().positive().allow(null), // permitimos null porque podemos crear cliente por correo
  correo_cliente: Joi.string().email().allow(null, '').messages({ 'string.email': 'Correo de cliente inválido' }),
  precio_total: Joi.number().precision(2).positive().required().messages({ 'any.required': 'El precio total es obligatorio' }),
  enganche: Joi.number().precision(2).min(0).required().messages({ 'any.required': 'El enganche es obligatorio' }),
  plazo_meses: Joi.number().integer().positive().required().messages({ 'any.required': 'El plazo en meses es obligatorio' }),
  estado_contrato: Joi.string().valid('activo','cancelado','pagado').default('activo'),
  // Datos opcionales de cliente si lo creamos:
  nombre: Joi.string().max(100).when('id_cliente', { is: Joi.exist(), then: Joi.forbidden(), otherwise: Joi.optional() }),
  apellido_paterno: Joi.string().max(50).when('id_cliente', { is: Joi.exist(), then: Joi.forbidden(), otherwise: Joi.optional() }),
  apellido_materno: Joi.string().max(50).allow(null).optional(),
  telefono: Joi.string().max(20).allow(null).optional()
});

const ContratoVenta = {
  validate: (data) => contratoSchema.validate(data)
};

// funciones DB específicas (se usan en el controller)
ContratoVenta.createContractRecord = async (client, payload) => {
  const { id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato } = payload;
  const res = await client.query(`
    INSERT INTO contrato_venta (id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato]);
  return res.rows[0];
};

module.exports = ContratoVenta;
