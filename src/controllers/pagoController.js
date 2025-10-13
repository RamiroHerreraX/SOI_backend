const Pago = require('../models/pagoModel');
const pool = require('../db');
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req,res,next)).catch(next);

exports.getByContrato = asyncHandler(async (req, res) => {
  const id_contrato = req.params.id;
  const result = await pool.query('SELECT * FROM pago WHERE id_contrato=$1 ORDER BY numero_pago', [id_contrato]);
  res.json(result.rows);
});

exports.marcarPagado = asyncHandler(async (req, res) => {
  const { id_pago } = req.params;
  const { metodo_pago } = req.body;
  const result = await pool.query('UPDATE pago SET estado_pago=$1, metodo_pago=$2, fecha_pago=NOW() WHERE id_pago=$3 RETURNING *', ['pagado', metodo_pago || 'efectivo', id_pago]);
  if (result.rowCount === 0) return res.status(404).json({ message: 'Pago no encontrado' });
  res.json(result.rows[0]);
});
