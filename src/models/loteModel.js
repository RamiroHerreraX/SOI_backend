const pool = require('../db');
const Joi = require('joi');

// Validación de los campos del lote
const loteSchema = Joi.object({
  tipo: Joi.string().valid('casa','depto','terreno','local','otro').required(),
  numLote: Joi.string().max(20).required(),
  manzana: Joi.string().max(10).allow(null, ''),
  direccion: Joi.string().required(),
  colonia: Joi.string().max(100).allow(null, ''),
  ciudad: Joi.string().max(100).allow(null, ''),
  estado: Joi.string().max(100).allow(null, ''),
  codigo_postal: Joi.string().max(10).allow(null, ''),
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
  // Validamos solo los campos que vienen del cliente
  const { error } = loteSchema.validate(data);
  if (error) throw new Error(error.details[0].message);

  // Convertir nombres en IDs
  let id_estado = null, id_ciudad = null, id_colonia = null;

  if(data.estado){
    const estadoRow = await pool.query(
      'SELECT id_estado FROM estado WHERE nombre_estado=$1', [data.estado]
    );
    if(estadoRow.rowCount === 0) throw new Error('Estado no encontrado');
    id_estado = estadoRow.rows[0].id_estado;
  }

  if(data.ciudad){
    const ciudadRow = await pool.query(
      'SELECT id_ciudad FROM ciudad WHERE nombre_ciudad=$1 AND id_estado=$2',
      [data.ciudad, id_estado]
    );
    if(ciudadRow.rowCount === 0) throw new Error('Ciudad no encontrada');
    id_ciudad = ciudadRow.rows[0].id_ciudad;
  }

  if(data.colonia){
    const coloniaRow = await pool.query(
      'SELECT id_colonia FROM colonia WHERE nombre_colonia=$1 AND id_ciudad=$2',
      [data.colonia, id_ciudad]
    );
    if(coloniaRow.rowCount === 0) throw new Error('Colonia no encontrada');
    id_colonia = coloniaRow.rows[0].id_colonia;
  }

  // --- Ahora sí armamos el INSERT solo con los IDs internos ---
  const values = [
    data.tipo,
    data.numLote,
    data.manzana,
    data.direccion,
    id_colonia,
    id_ciudad,
    id_estado,
    data.superficie_m2,
    data.precio,
    data.valor_avaluo,
    data.num_habitaciones,
    data.num_banos,
    data.num_estacionamientos,
    data.servicios,
    data.descripcion,
    data.topografia,
    data.documentacion,
    data.estado_propiedad,
    data.fecha_disponibilidad,
    data.imagen,
    data.id_user
  ];

  const res = await pool.query(
    `INSERT INTO lote (
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
    ) RETURNING *`,
    values
  );

  return res.rows[0];
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
