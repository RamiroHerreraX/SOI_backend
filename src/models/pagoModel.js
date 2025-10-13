const pool = require('../db');
const Joi = require('joi');

const pagoSchema = Joi.object({
  id_contrato: Joi.number().integer().positive().required(),
  numero_pago: Joi.number().integer().positive().required(),
  monto: Joi.number().precision(2).positive().required(),
  fecha_pago: Joi.date().required(),
  metodo_pago: Joi.string().max(50).allow(null, ''),
  estado_pago: Joi.string().valid('pendiente','pagado','atrasado').default('pendiente')
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
