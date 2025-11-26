const pool = require('../db');
const Joi = require('joi');

// --------------- ESQUEMA COMPLETO DE VALIDACIÓN -----------------

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
    'string.base': 'El documento de identificación debe ser un PDF'
  }),
  doc_curp: Joi.string().allow(null, '').messages({
    'string.base': 'El documento de identificación debe ser un PDF'
  }),
});

// ------------------- OBJETO CLIENTE ----------------------

const Cliente = {
  validate: (data) => clienteSchema.validate(data),

  // Obtener todos
  getAll: async () => {
    const res = await pool.query('SELECT * FROM cliente ORDER BY id_cliente');
    return res.rows;
  },

  // Obtener por CURP
  getByCurp: async (curp) => {
    const res = await pool.query('SELECT * FROM cliente WHERE curp=$1', [curp]);
    return res.rows[0];
  },

  // Buscar por correo
  getByCorreo: async (correo) => {
    const res = await pool.query('SELECT * FROM cliente WHERE correo=$1', [correo]);
    return res.rows[0];
  },

  // Crear cliente
  create: async (data) => {
    const { 
      nombre, apellido_paterno, apellido_materno, correo, telefono,
      curp, clave_elector, doc_identificacion, doc_curp 
    } = data;

    // Validaciones de unicidad
    const checks = [
      { field: 'correo', value: correo },
      { field: 'telefono', value: telefono },
      { field: 'curp', value: curp },
      { field: 'clave_elector', value: clave_elector }
    ];

    for (const check of checks) {
      if (check.value) {
        const query = `SELECT 1 FROM cliente WHERE ${check.field} = $1 LIMIT 1`;
        const result = await pool.query(query, [check.value]);
        if (result.rows.length > 0) {
          throw new Error(`El ${check.field} '${check.value}' ya está registrado en otro cliente.`);
        }
      }
    }

    // Insertar cliente
    const res = await pool.query(`
      INSERT INTO cliente 
        (nombre, apellido_paterno, apellido_materno, correo, telefono, curp, clave_elector, doc_identificacion, doc_curp)
      VALUES 
        ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      nombre,
      apellido_paterno,
      apellido_materno || null,
      correo,
      telefono || null,
      curp,
      clave_elector || null,
      doc_identificacion || null,
      doc_curp || null
    ]);

    return res.rows[0];
  },

  // Actualizar cliente
  update: async (curp, data) => {
    const existing = await pool.query('SELECT * FROM cliente WHERE curp=$1', [curp]);
    if (existing.rows.length === 0) {
      throw new Error(`No existe un cliente con CURP '${curp}'`);
    }

    // Validaciones de unicidad
    const checks = [
      { field: 'correo', value: data.correo },
      { field: 'telefono', value: data.telefono },
      { field: 'clave_elector', value: data.clave_elector }
    ];

    for (const check of checks) {
      if (check.value) {
        const query = `SELECT 1 FROM cliente WHERE ${check.field} = $1 AND curp <> $2 LIMIT 1`;
        const result = await pool.query(query, [check.value, curp]);
        if (result.rows.length > 0) {
          throw new Error(`El ${check.field} '${check.value}' ya está registrado en otro cliente.`);
        }
      }
    }

    // Actualizar dinámicamente
    let fields = [], values = [], i = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key}=$${i++}`);
      values.push(value);
    }

    const res = await pool.query(
      `UPDATE cliente SET ${fields.join(', ')} WHERE curp=$${i} RETURNING *`,
      [...values, curp]
    );

    return res.rows[0];
  },

  // Eliminar cliente
  delete: async (curp) => {
    const res = await pool.query('DELETE FROM cliente WHERE curp=$1 RETURNING *', [curp]);
    return res.rows[0];
  }
};

module.exports = Cliente;
