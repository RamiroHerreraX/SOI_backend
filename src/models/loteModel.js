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
    console.log('Datos recibidos para crear lote:', data);

    // Validamos
    const { error } = loteSchema.validate(data);
    if (error) throw new Error(error.details[0].message);

    // Normalizar / parsear IDs
    const id_estado = data.id_estado ? parseInt(data.id_estado) : null;
    const id_ciudad = data.id_ciudad ? parseInt(data.id_ciudad) : null;
    let id_colonia = data.id_colonia ? parseInt(data.id_colonia) : null;

    // nombre_colonia_nueva (si viene)
    const nombreColoniaNueva = data.nombre_colonia_nueva ? String(data.nombre_colonia_nueva).trim() : null;
    // codigo_postal (puede venir vacío)
    const codigo_postal = data.codigo_postal ? String(data.codigo_postal).trim() : '';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Si no viene id_colonia pero sí viene nombre_colonia_nueva -> crear o buscar colonia
      if (!id_colonia && nombreColoniaNueva) {
        if (!id_ciudad) {
          throw new Error('Para crear una colonia nueva se requiere id_ciudad');
        }

        // 1) Verificar si ya existe (por nombre + ciudad + codigo_postal)
        const existQ = `
          SELECT id_colonia FROM colonia
          WHERE LOWER(nombre_colonia)=LOWER($1) AND id_ciudad=$2 AND codigo_postal=$3
          LIMIT 1
        `;
        const existRes = await client.query(existQ, [nombreColoniaNueva, id_ciudad, codigo_postal]);
        if (existRes.rowCount > 0) {
          id_colonia = existRes.rows[0].id_colonia;
        } else {
          // 2) Insertar nueva colonia
          const insertQ = `
            INSERT INTO colonia (nombre_colonia, id_ciudad, codigo_postal)
            VALUES ($1, $2, $3)
            RETURNING id_colonia
          `;
          const insertRes = await client.query(insertQ, [nombreColoniaNueva, id_ciudad, codigo_postal]);
          id_colonia = insertRes.rows[0].id_colonia;
        }
      }

      // A estas alturas id_colonia debe existir (tu tabla lote tiene FK NOT NULL)
      if (!id_colonia) {
        throw new Error('id_colonia es obligatorio. Proporcione una colonia existente o nombre_colonia_nueva.');
      }

      // Preparar campos para insertar lote
      const values = [
        data.tipo,
        data.numLote,
        data.manzana || null,
        data.direccion,
        id_colonia,
        id_ciudad,
        id_estado,
        data.superficie_m2,
        data.precio,
        data.valor_avaluo || null,
        data.num_habitaciones || null,
        data.num_banos || null,
        data.num_estacionamientos || null,
        data.servicios || null,
        data.descripcion || null,
        data.topografia || null,
        data.documentacion || null,
        data.estado_propiedad,
        data.fecha_disponibilidad || null,
        data.imagen || null,
        data.id_user ? parseInt(data.id_user) : null
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
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20, $21
        ) RETURNING *
      `;

      const res = await client.query(insertLoteQ, values);

      await client.query('COMMIT');
      return res.rows[0];

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en Lote.create:', err.message || err);
      throw err;
    } finally {
      client.release();
    }
  },



  update: async (id, data) => {
    const { error } = loteSchema.validate(data, { presence: 'optional' });
    if(error) throw new Error(error.details[0].message);

    let fields = [], values = [], i=1;
    for(const [key,value] of Object.entries(data)){
      fields.push(`${key}=$${i++}`);
      values.push(value);
    }

    if(fields.length === 0) throw new Error("No hay datos para actualizar");

    const res = await pool.query(
      `UPDATE lote SET ${fields.join(', ')} WHERE id_propiedad=$${i} RETURNING *`,
      [...values, id]
    );
    return res.rows[0];
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
