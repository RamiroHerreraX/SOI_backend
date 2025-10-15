const Pago = require('../models/pagoModel');
const pool = require('../db');
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req,res,next)).catch(next);

exports.getByContrato = asyncHandler(async (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ message: 'El correo es requerido' });
  }

  const query = `
    SELECT p.* FROM pago p
    JOIN contrato_venta c ON p.id_contrato = c.id_contrato
    JOIN cliente cl ON c.id_cliente = cl.id_cliente
    WHERE cl.correo = $1
    ORDER BY p.numero_pago
  `;

  const result = await pool.query(query, [correo]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'No se encontraron pagos para este cliente' });
  }

  res.json(result.rows);
});



exports.marcarPagadoPorCorreo = asyncHandler(async (req, res) => {
  const { correo, metodo_pago } = req.body;

  if (!correo) {
    return res.status(400).json({ message: 'El correo es requerido' });
  }

  // Buscar el siguiente pago pendiente del cliente
  const query = `
    SELECT p.id_pago
    FROM pago p
    JOIN contrato_venta c ON p.id_contrato = c.id_contrato
    JOIN cliente cl ON c.id_cliente = cl.id_cliente
    WHERE cl.correo = $1 AND p.estado_pago = 'pendiente'
    ORDER BY c.fecha_contrato, p.numero_pago
    LIMIT 1
  `;

  const result = await pool.query(query, [correo]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'No hay pagos pendientes para este cliente' });
  }

  const id_pago = result.rows[0].id_pago;

  // Actualizar el pago como pagado
  const updateResult = await pool.query(
    `UPDATE pago SET estado_pago = 'pagado', 
         metodo_pago = $1, 
         fecha_pago = NOW() 
     WHERE id_pago = $2 
     RETURNING *`,
    [metodo_pago || 'efectivo', id_pago]
  );

  res.json({
    message: 'Pago marcado como pagado',
    pago: updateResult.rows[0]
  });
});

