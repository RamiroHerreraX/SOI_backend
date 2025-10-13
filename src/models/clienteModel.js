const pool = require('../db');
const Joi = require('joi');

const clienteSchema = Joi.object({
  nombre: Joi.string().max(100).required().messages({ 'any.required': 'El nombre es obligatorio' }),
  apellido_paterno: Joi.string().max(50).required().messages({ 'any.required': 'El apellido paterno es obligatorio' }),
  apellido_materno: Joi.string().max(50).allow(null, ''),
  correo: Joi.string().email().required().messages({ 'any.required': 'El correo es obligatorio', 'string.email': 'Correo inválido' }),
  telefono: Joi.string().max(20).allow(null, '')
});

const Cliente = {
  validate: (data) => clienteSchema.validate(data),

  getAll: async () => {
    const res = await pool.query('SELECT * FROM cliente ORDER BY id_cliente');
    return res.rows;
  },

  getById: async (id) => {
    const res = await pool.query('SELECT * FROM cliente WHERE id_cliente=$1', [id]);
    return res.rows[0];
  },

  getByCorreo: async (correo) => {
    const res = await pool.query('SELECT * FROM cliente WHERE correo=$1', [correo]);
    return res.rows[0];
  },

  create: async (data) => {
    const { nombre, apellido_paterno, apellido_materno, correo, telefono } = data;
    const res = await pool.query(`
      INSERT INTO cliente (nombre, apellido_paterno, apellido_materno, correo, telefono)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [nombre, apellido_paterno, apellido_materno || null, correo, telefono || null]);
    return res.rows[0];
  },

  update: async (id, data) => {
    let fields = [], values = [], i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key}=$${i++}`);
      values.push(value);
    }
    if (fields.length === 0) throw new Error("No hay datos válidos para actualizar");
    const res = await pool.query(`UPDATE cliente SET ${fields.join(', ')} WHERE id_cliente=$${i} RETURNING *`, [...values, id]);
    return res.rows[0];
  },

  delete: async (id) => {
    const res = await pool.query('DELETE FROM cliente WHERE id_cliente=$1 RETURNING *', [id]);
    return res.rows[0];
  }
};

module.exports = Cliente;
