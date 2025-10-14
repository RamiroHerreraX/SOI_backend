const pool = require('../db');
const bcrypt = require('bcrypt');
const Joi = require('joi');

const SALT_ROUNDS = 10;

// ====== VALIDACIÓN DE DATOS ======


const userSchema = Joi.object({
  usuario: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
  // rol: Joi.string().valid('admin','vendedor','cliente','dueño','secretaria').required(),
  rol: Joi.string().valid('secretaria', 'encargado').required(),
  correo: Joi.string().email().required(),
  telefono: Joi.string().pattern(/^[0-9]{10}$/).required() // Solo 10 dígitos
});


const User = {
  // ================== VALIDACIÓN ==================
  validate: (data) => userSchema.validate(data),

  // ================== CONSULTAS GENERALES ==================
  getAll: async () => {
    const res = await pool.query('SELECT id_user, usuario, rol, correo, telefono FROM "users" ORDER BY id_user');
    return res.rows;
  },

  getByRole: async (rol) => {
    const res = await pool.query(
      `SELECT id_user, usuario, rol, correo, telefono 
       FROM "users"
       WHERE rol = $1 
       ORDER BY id_user`,
      [rol]
    );
    return res.rows;
  },

  getById: async (id) => {
    const res = await pool.query('SELECT id_user, usuario, rol, correo, telefono FROM "users" WHERE id_user=$1', [id]);
    return res.rows[0];
  },

  // ================== CREAR USUARIO ==================
  create: async ({ usuario, password, rol, correo, telefono }) => {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const res = await pool.query(
      `INSERT INTO "users" (usuario, password, rol, correo, telefono)
       VALUES ($1,$2,$3,$4,$5) 
       RETURNING id_user, usuario, rol, correo, telefono`,
      [usuario, hashedPassword, rol, correo, telefono]
    );
    return res.rows[0];
  },

  // ================== ACTUALIZAR USUARIO ==================
  update: async (id, data) => {
    let fields = [], values = [], i = 1;

    if (data.usuario) { fields.push(`usuario=$${i++}`); values.push(data.usuario); }
    if (data.password) { 
      const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
      fields.push(`password=$${i++}`); values.push(hashed);
    }
    if (data.rol) { fields.push(`rol=$${i++}`); values.push(data.rol); }
    if (data.correo) { fields.push(`correo=$${i++}`); values.push(data.correo); }
    if (data.telefono) { fields.push(`telefono=$${i++}`); values.push(data.telefono); }

    if (fields.length === 0) throw new Error("No hay datos para actualizar");

    const res = await pool.query(
      `UPDATE "users" SET ${fields.join(', ')} WHERE id_user=$${i} 
       RETURNING id_user, usuario, rol, correo, telefono`,
      [...values, id]
    );
    return res.rows[0];
  },

  // ================== ELIMINAR USUARIO ==================
  delete: async (id) => {
    const res = await pool.query('DELETE FROM "users" WHERE id_user=$1 RETURNING id_user, usuario', [id]);
    return res.rows[0];
  },

  // ================== UTILIDADES ==================
  verifyPassword: async (plain, hash) => {
    return bcrypt.compare(plain, hash);
  },

  // ================== NUEVAS FUNCIONES (2FA / RECUPERACIÓN) ==================
  getByEmail: async (correo) => {
    const res = await pool.query('SELECT * FROM "users" WHERE correo = $1', [correo]);
    return res.rows[0];
  },

  updatePassword: async (correo, hashed) => {
    await pool.query('UPDATE "users" SET password = $1 WHERE correo = $2', [hashed, correo]);
  }
};

module.exports = User;
