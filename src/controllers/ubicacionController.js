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

module.exports = { getEstados, getCiudades, getColonias };
