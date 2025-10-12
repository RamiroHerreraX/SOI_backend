const pool = require('../db');
const Joi = require('joi');

// Validación de los campos del lote
const loteSchema = Joi.object({
  tipo: Joi.string().valid('casa','depto','terreno','local','otro').required(),
  numLote: Joi.string().max(20).required(),
  manzana: Joi.string().max(10).allow(null, ''),
  direccion: Joi.string().required(),
  id_colonia: Joi.number().integer().allow(null),
  id_ciudad: Joi.number().integer().allow(null),
  id_estado: Joi.number().integer().allow(null),
  codigo_postal: Joi.string().max(10).allow(null, ''),
  nombre_colonia_nueva: Joi.string().max(100).allow(null, ''),
  superficie_m2: Joi.number().positive().required(),
  precio: Joi.number().min(0).required(),
  valor_avaluo: Joi.number().min(0).allow(null),
  num_habitaciones: Joi.number().integer().min(0).allow(null),
  num_banos: Joi.number().integer().min(0).allow(null),
  num_estacionamientos: Joi.number().integer().min(0).allow(null),
  servicios: Joi.string().allow(null, ''),
  descripcion: Joi.string().allow(null, ''),
  topografia: Joi.string().max(50).allow(null, ''),
  documentacion: Joi.string().allow(null, ''),
  estado_propiedad: Joi.string().valid('disponible','rentada','vendida','en proceso').required(),
  fecha_disponibilidad: Joi.date().allow(null),
  imagen: Joi.string().uri().allow(null, ''),
  id_user: Joi.number().integer().allow(null)
});

const Lote = {
  validate: (data) => loteSchema.validate(data),

  getAll: async () => {
    const res = await pool.query('SELECT * FROM lote ORDER BY id_propiedad');
    return res.rows;
  },

  getById: async (id) => {
    const res = await pool.query('SELECT * FROM lote WHERE id_propiedad=$1', [id]);
    return res.rows[0];
  },

create: async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let id_colonia = data.id_colonia || null;
    const nombreColoniaNueva = data.nombre_colonia_nueva?.trim();
    const id_ciudad = parseInt(data.id_ciudad);
    const codigo_postal = data.codigo_postal || '';

    // Crear colonia nueva si no existe
    if (!id_colonia && nombreColoniaNueva) {
      const existRes = await client.query(`
        SELECT id_colonia FROM colonia
        WHERE LOWER(nombre_colonia)=LOWER($1) AND id_ciudad=$2
        LIMIT 1
      `, [nombreColoniaNueva, id_ciudad]);

      if (existRes.rowCount > 0) {
        id_colonia = existRes.rows[0].id_colonia;
      } else {
        const insertRes = await client.query(`
          INSERT INTO colonia (nombre_colonia, id_ciudad, codigo_postal)
          VALUES ($1, $2, $3)
          RETURNING id_colonia
        `, [nombreColoniaNueva, id_ciudad, codigo_postal]);
        id_colonia = insertRes.rows[0].id_colonia;
      }
    }

    if (!id_colonia) throw new Error('id_colonia es obligatorio');

    const values = [
      data.tipo, data.numLote, data.manzana || null, data.direccion,
      id_colonia, id_ciudad, parseInt(data.id_estado),
      data.superficie_m2, data.precio, data.valor_avaluo || null,
      data.num_habitaciones || null, data.num_banos || null, data.num_estacionamientos || null,
      data.servicios || null, data.descripcion || null, data.topografia || null,
      data.documentacion || null, data.estado_propiedad, data.fecha_disponibilidad || null,
      data.imagen || null, data.id_user ? parseInt(data.id_user) : null
    ];

    const insertLoteQ = `
      INSERT INTO lote (
        tipo, numLote, manzana, direccion,
        id_colonia, id_ciudad, id_estado,
        superficie_m2, precio, valor_avaluo,
        num_habitaciones, num_banos, num_estacionamientos,
        servicios, descripcion, topografia, documentacion,
        estado_propiedad, fecha_disponibilidad, imagen, id_user
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      ) RETURNING *
    `;

    const res = await client.query(insertLoteQ, values);
    await client.query('COMMIT');
    return res.rows[0];

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    throw err;
  } finally {
    client.release();
  }
},



  update: async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let id_colonia = data.id_colonia || null;
    const nombreColoniaNueva = data.nombre_colonia_nueva?.trim();
    const id_ciudad = parseInt(data.id_ciudad);
    const codigo_postal = data.codigo_postal || '';

    if (!id_colonia && nombreColoniaNueva) {
      const existRes = await client.query(`
        SELECT id_colonia FROM colonia
        WHERE LOWER(nombre_colonia)=LOWER($1) AND id_ciudad=$2
        LIMIT 1
      `, [nombreColoniaNueva, id_ciudad]);

      if (existRes.rowCount > 0) {
        id_colonia = existRes.rows[0].id_colonia;
      } else {
        const insertRes = await client.query(`
          INSERT INTO colonia (nombre_colonia, id_ciudad, codigo_postal)
          VALUES ($1, $2, $3)
          RETURNING id_colonia
        `, [nombreColoniaNueva, id_ciudad, codigo_postal]);
        id_colonia = insertRes.rows[0].id_colonia;
      }
    }

    if (!id_colonia) throw new Error('id_colonia es obligatorio');

    data.id_colonia = id_colonia;
    delete data.nombre_colonia_nueva;
    delete data.codigo_postal;

    // UPDATE dinámico
    let fields = [], values = [], i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key}=$${i++}`);
      values.push(value);
    }
    if (fields.length === 0) throw new Error("No hay datos válidos para actualizar");

    const res = await client.query(
      `UPDATE lote SET ${fields.join(', ')} WHERE id_propiedad=$${i} RETURNING *`,
      [...values, id]
    );

    await client.query('COMMIT');
    return res.rows[0];

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
},



  delete: async (id) => {
    const res = await pool.query(
      'DELETE FROM lote WHERE id_propiedad=$1 RETURNING *',
      [id]
    );
    return res.rows[0];
  }
};

module.exports = Lote;
