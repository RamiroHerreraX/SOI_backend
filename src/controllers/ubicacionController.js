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
        c.id_ciudad,
        ci.nombre_ciudad,
        ci.id_estado,
        e.nombre_estado
      FROM "Colonia" c
      JOIN "Ciudad" ci ON c.id_ciudad = ci.id_ciudad
      JOIN "Estado" e ON ci.id_estado = e.id_estado
      WHERE c.codigo_postal = $1
      LIMIT 1;  
    `;
    const { rows } = await pool.query(query, [codigoPostal]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Código postal no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al buscar por código postal:', error);
    res.status(500).json({ message: 'Error al buscar por código postal' });
  }
};


module.exports = { getEstados, getCiudades, getColonias, getCiudadPorCP  };
