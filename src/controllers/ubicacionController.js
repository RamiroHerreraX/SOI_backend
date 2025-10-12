const pool = require('../db');

// Obtener todos los estados
const getEstados = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estado ORDER BY nombre_estado');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los estados' });
  }
};

// Obtener ciudades por estado
const getCiudades = async (req, res) => {
  const { estadoId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM ciudad WHERE id_estado = $1 ORDER BY nombre_ciudad',
      [estadoId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las ciudades' });
  }
};

// Obtener colonias por ciudad
const getColonias = async (req, res) => {
  const { ciudadId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM colonia WHERE id_ciudad = $1 ORDER BY nombre_colonia',
      [ciudadId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las colonias' });
  }
};

const getCiudadPorCP = async (req, res) => {
  const { codigoPostal } = req.params;
  try {
    const query = `
      SELECT 
        ci.id_ciudad,
        ci.nombre_ciudad,
        e.id_estado,
        e.nombre_estado,
        c.id_colonia,
        c.nombre_colonia,
        c.codigo_postal
      FROM colonia c
      JOIN ciudad ci ON c.id_ciudad = ci.id_ciudad
      JOIN estado e ON ci.id_estado = e.id_estado
      WHERE c.codigo_postal = $1
      ORDER BY c.nombre_colonia;
    `;
    
    const { rows } = await pool.query(query, [codigoPostal]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Código postal no encontrado' });
    }

    // Estructurar respuesta: Info general + Lista de colonias
    const respuesta = {
      id_estado: rows[0].id_estado,
      nombre_estado: rows[0].nombre_estado,
      id_ciudad: rows[0].id_ciudad,
      nombre_ciudad: rows[0].nombre_ciudad,
      colonias: rows.map(col => ({
        id_colonia: col.id_colonia,
        nombre_colonia: col.nombre_colonia,
        codigo_postal: col.codigo_postal
      }))
    };

    res.json(respuesta);

  } catch (error) {
    console.error('Error al buscar por código postal:', error);
    res.status(500).json({ message: 'Error al buscar por código postal' });
  }
};

const getCiudadById = async (req, res) => {
  const { id_ciudad } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.id_ciudad, c.nombre_ciudad, c.id_estado
       FROM ciudad c
       WHERE c.id_ciudad = $1`,
      [id_ciudad]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ciudad no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener ciudad:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};



module.exports = { getEstados, getCiudades, getColonias, getCiudadPorCP, getCiudadById  };
