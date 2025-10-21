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
  // Verificar si el correo o teléfono ya existen
  const exists = await pool.query(
    `SELECT id_user FROM "users" WHERE correo = $1 OR telefono = $2`,
    [correo, telefono]
  );

  if (exists.rows.length > 0) {
    throw new Error('El correo o teléfono ya están registrados.');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const res = await pool.query(
    `INSERT INTO "users" (usuario, password, rol, correo, telefono)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_user, usuario, rol, correo, telefono`,
    [usuario, hashedPassword, rol, correo, telefono]
  );

  return res.rows[0];
},


  // ================== ACTUALIZAR USUARIO ==================
  update: async (id, data) => {
  // Verificar duplicados solo si cambia correo o teléfono
  if (data.correo || data.telefono) {
    const checkQuery = [];
    const checkValues = [];
    let i = 1;

    if (data.correo) {
      checkQuery.push(`correo = $${i++}`);
      checkValues.push(data.correo);
    }
    if (data.telefono) {
      checkQuery.push(`telefono = $${i++}`);
      checkValues.push(data.telefono);
    }

    const check = await pool.query(
      `SELECT id_user FROM "users" WHERE (${checkQuery.join(' OR ')}) AND id_user != $${i}`,
      [...checkValues, id]
    );

    if (check.rows.length > 0) {
      throw new Error('El correo o teléfono ya están registrados por otro usuario.');
    }
  }

  // Armar la actualización
  let fields = [], values = [], j = 1;
  if (data.usuario) { fields.push(`usuario=$${j++}`); values.push(data.usuario); }
  if (data.password) { 
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    fields.push(`password=$${j++}`); values.push(hashed);
  }
  if (data.rol) { fields.push(`rol=$${j++}`); values.push(data.rol); }
  if (data.correo) { fields.push(`correo=$${j++}`); values.push(data.correo); }
  if (data.telefono) { fields.push(`telefono=$${j++}`); values.push(data.telefono); }

  if (fields.length === 0) throw new Error("No hay datos para actualizar");

  const res = await pool.query(
    `UPDATE "users" SET ${fields.join(', ')} WHERE id_user=$${j}
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
