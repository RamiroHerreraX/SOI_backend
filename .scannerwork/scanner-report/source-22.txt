const pool = require('../db');
const Joi = require('joi');

const pagoSchema = Joi.object({
  id_contrato: Joi.number().integer().positive().required().messages({
    'any.required': 'El id del contrato es obligatorio',
    'number.base': 'El id del contrato debe ser un número',
    'number.integer': 'El id del contrato debe ser un número entero',
    'number.positive': 'El id del contrato debe ser mayor a 0'
  }),
  numero_pago: Joi.number().integer().positive().required().messages({
    'any.required': 'El número de pago es obligatorio',
    'number.base': 'El número de pago debe ser un número',
    'number.integer': 'El número de pago debe ser un número entero',
    'number.positive': 'El número de pago debe ser mayor a 0'
  }),
  monto: Joi.number().precision(2).positive().required().messages({
    'any.required': 'El monto del pago es obligatorio',
    'number.base': 'El monto debe ser un número',
    'number.positive': 'El monto debe ser mayor a 0',
    'number.precision': 'El monto no puede tener más de 2 decimales'
  }),
  fecha_pago: Joi.date().required().messages({
    'any.required': 'La fecha de pago es obligatoria',
    'date.base': 'La fecha de pago no es válida'
  }),
  metodo_pago: Joi.string().max(50).allow(null, '').messages({
    'string.base': 'El método de pago debe ser un texto',
    'string.max': 'El método de pago no debe exceder los 50 caracteres'
  }),
  estado_pago: Joi.string().valid('pendiente','pagado','atrasado').default('pendiente').messages({
    'any.only': 'El estado del pago debe ser: pendiente, pagado o atrasado'
  })
});


const Pago = {
  validate: (data) => pagoSchema.validate(data),

  createBulk: async (client, pagos) => {
    // recibe array de objetos {id_contrato, numero_pago, monto, fecha_pago, metodo_pago, estado_pago}
    const insertQ = `INSERT INTO pago (id_contrato, numero_pago, monto, fecha_pago, metodo_pago, estado_pago)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const created = [];
    for (const p of pagos) {
      const res = await client.query(insertQ, [
        p.id_contrato, p.numero_pago, p.monto, p.fecha_pago, p.metodo_pago || 'efectivo', p.estado_pago || 'pendiente'
      ]);
      created.push(res.rows[0]);
    }
    return created;
  }
};

module.exports = Pago;
