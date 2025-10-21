const pool = require('../db');
const Joi = require('joi');

const contratoSchema = Joi.object({
  id_lote: Joi.number().integer().positive().required().messages({
    'any.required': 'El id_lote es obligatorio',
    'number.base': 'El id_lote debe ser un número',
    'number.integer': 'El id_lote debe ser un número entero',
    'number.positive': 'El id_lote debe ser mayor a 0'
  }),
  id_cliente: Joi.number().integer().positive().allow(null).messages({
    'number.base': 'El id_cliente debe ser un número',
    'number.integer': 'El id_cliente debe ser un número entero',
    'number.positive': 'El id_cliente debe ser mayor a 0'
  }),
  correo_cliente: Joi.string().email().allow(null, '').messages({
    'string.email': 'Correo de cliente inválido',
    'string.base': 'El correo de cliente debe ser un texto'
  }),
  precio_total: Joi.number().precision(2).positive().required().messages({
    'any.required': 'El precio total es obligatorio',
    'number.base': 'El precio total debe ser un número',
    'number.positive': 'El precio total debe ser mayor a 0'
  }),
  enganche: Joi.number().precision(2).min(0).required().messages({
    'any.required': 'El enganche es obligatorio',
    'number.base': 'El enganche debe ser un número',
    'number.min': 'El enganche no puede ser negativo'
  }),
  plazo_meses: Joi.number().integer().positive().required().messages({
    'any.required': 'El plazo en meses es obligatorio',
    'number.base': 'El plazo debe ser un número',
    'number.integer': 'El plazo debe ser un número entero',
    'number.positive': 'El plazo debe ser mayor a 0'
  }),
  estado_contrato: Joi.string().valid('activo','cancelado','pagado').default('activo').messages({
    'any.only': 'El estado del contrato debe ser: activo, cancelado o pagado',
    'string.base': 'El estado del contrato debe ser un texto'
  }),
  // Datos opcionales de cliente si lo creamos:
  nombre: Joi.string().max(100).when('id_cliente', { 
    is: Joi.exist(), 
    then: Joi.forbidden(), 
    otherwise: Joi.optional().messages({
      'string.base': 'El nombre debe ser un texto',
      'string.max': 'El nombre no debe exceder los 100 caracteres'
    })
  }),
  apellido_paterno: Joi.string().max(50).when('id_cliente', { 
    is: Joi.exist(), 
    then: Joi.forbidden(), 
    otherwise: Joi.optional().messages({
      'string.base': 'El apellido paterno debe ser un texto',
      'string.max': 'El apellido paterno no debe exceder los 50 caracteres'
    })
  }),
  apellido_materno: Joi.string().max(50).allow(null).optional().messages({
    'string.base': 'El apellido materno debe ser un texto',
    'string.max': 'El apellido materno no debe exceder los 50 caracteres'
  }),
  telefono: Joi.string().max(20).allow(null).optional().messages({
    'string.base': 'El teléfono debe ser un texto',
    'string.max': 'El teléfono no debe exceder los 20 caracteres'
  })
});


const ContratoVenta = {
  validate: (data) => contratoSchema.validate(data)
};

ContratoVenta.createContractRecord = async (client, payload) => {
  const { id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato } = payload;
  const res = await client.query(`
    INSERT INTO contrato_venta (id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato]);
  return res.rows[0];
};

module.exports = ContratoVenta;
