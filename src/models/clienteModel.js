const pool = require('../db');
const Joi = require('joi');

const clienteSchema = Joi.object({
  nombre: Joi.string().max(100).required().messages({
    'any.required': 'El nombre es obligatorio',
    'string.base': 'El nombre debe ser un texto',
    'string.max': 'El nombre no debe exceder los 100 caracteres'
  }),
  apellido_paterno: Joi.string().max(50).required().messages({
    'any.required': 'El apellido paterno es obligatorio',
    'string.base': 'El apellido paterno debe ser un texto',
    'string.max': 'El apellido paterno no debe exceder los 50 caracteres'
  }),
  apellido_materno: Joi.string().max(50).allow(null, '').messages({
    'string.base': 'El apellido materno debe ser un texto',
    'string.max': 'El apellido materno no debe exceder los 50 caracteres'
  }),
  correo: Joi.string().email().required().messages({
    'any.required': 'El correo es obligatorio',
    'string.email': 'Correo inválido',
    'string.base': 'El correo debe ser un texto'
  }),
  telefono: Joi.string().pattern(/^\d{10}$/).allow(null, '').messages({
    'string.base': 'El teléfono debe ser un texto',
    'string.max': 'El teléfono debe contener exactamente 10 dígitos'
  }),
   curp: Joi.string().length(18).required().messages({
    'any.required': 'La CURP es obligatoria',
    'string.length': 'La CURP debe tener 18 caracteres'
  }),
  clave_elector: Joi.string().length(20).allow(null, '').messages({
    'string.max': 'La Clave de Elector no debe exceder los 20 caracteres'
  }),

  doc_identificacion: Joi.string().allow(null, '').messages({
    'string.base': 'El documento de identificación debe ser una cadena de texto (ruta o URL)'
  }),

  doc_curp: Joi.string().allow(null, '').messages({
    'string.base': 'El documento de CURP debe ser una cadena de texto (ruta o URL)'
  }),

});


const Cliente = {
  validate: (data) => clienteSchema.validate(data),

  getAll: async () => {
    const res = await pool.query('SELECT * FROM cliente ORDER BY id_cliente');
    return res.rows;
  },

  getByCurp: async (id) => {
    const res = await pool.query('SELECT * FROM cliente WHERE curp=$1', [id]);
    return res.rows[0];
  },

  getByCorreo: async (correo) => {
    const res = await pool.query('SELECT * FROM cliente WHERE correo=$1', [correo]);
    return res.rows[0];
  },

  create: async (data) => {
    const { nombre, apellido_paterno, apellido_materno, correo, telefono, curp, clave_elector, doc_identificacion, doc_curp} = data;
    const res = await pool.query(`
      INSERT INTO cliente (nombre, apellido_paterno, apellido_materno, correo, telefono, curp, clave_elector, doc_identificacion, doc_curp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [nombre, apellido_paterno, apellido_materno || null, correo, telefono || null, curp, clave_elector, doc_identificacion || null, doc_curp || null]);
    return res.rows[0];
  },

  update: async (curp, data) => {
    let fields = [], values = [], i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key}=$${i++}`);
      values.push(value);
    }
    if (fields.length === 0) throw new Error("No hay datos válidos para actualizar");
    const res = await pool.query(`UPDATE cliente SET ${fields.join(', ')} WHERE curp=$${i} RETURNING *`, [...values, curp]);
    return res.rows[0];
  },

  delete: async (curp) => {
    const res = await pool.query('DELETE FROM cliente WHERE curp=$1 RETURNING *', [id]);
    return res.rows[0];
  }
};

module.exports = Cliente;
