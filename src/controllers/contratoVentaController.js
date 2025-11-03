// src/controllers/contratoVentaController.js (CORREGIDO)

const pool = require('../db');
const Cliente = require('../models/clienteModel');
const ContratoVenta = require('../models/contratoModel');
const Pago = require('../models/pagoModel');
// Probablemente necesites Lote también, aunque no está importado aquí.

// Helper para envolver funciones asíncronas
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req,res,next)).catch(next);

// Helper: sumar meses manteniendo mismo día
function addMonthsPreserveDay(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  const targetMonth = d.getMonth() + months;
  const result = new Date(d.getFullYear(), targetMonth, 1);
  // set to desired day or last day of month
  const daysInMonth = new Date(result.getFullYear(), result.getMonth()+1, 0).getDate();
  result.setDate(Math.min(day, daysInMonth));
  return result;
}

// optional helper to normalize phone (simple)
function phoneNormalizer(phone) {
  if (!phone) return null;
  return String(phone).trim();
}

// ===================================
// 1. OBTENER CONTRATO
// ===================================
exports.obtenerContrato = asyncHandler(async (req, res) => {
  const query = `
    SELECT cv.*, 
           c.nombre AS cliente_nombre, c.apellido_paterno, c.apellido_materno, c.correo, c.telefono,
           l.tipo AS lote_tipo, l.numlote, l.direccion
    FROM contrato_venta cv
    INNER JOIN cliente c ON cv.id_cliente = c.id_cliente
    INNER JOIN lote l ON cv.id_lote = l.id_propiedad
    ORDER BY cv.fecha_contrato DESC
  `;

  const result = await pool.query(query);
  res.json(result.rows);
}); // <-- CIERRE CORRECTO de obtenerContrato

// ===================================
// 2. CREAR CONTRATO
// ===================================
exports.createContrato = asyncHandler(async (req, res) => { // <-- DEFINICIÓN CORRECTA
  // validar input
  const { error } = ContratoVenta.validate(req.body);
  if (error) return res.status(400).json({ mensaje: 'Error de validación', detalles: [error.details[0].message] });

  const {
    id_lote,
    id_cliente,
    correo_cliente,
    precio_total,
    enganche,
    plazo_meses,
    estado_contrato = 'activo',
    nombre, apellido_paterno, apellido_materno, telefono
  } = req.body;

  if (parseFloat(enganche) >= parseFloat(precio_total)) {
    return res.status(400).json({ message: 'El enganche debe ser menor que el precio total' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Verificar lote y que esté disponible
    const loteRes = await client.query('SELECT id_propiedad, estado_propiedad FROM lote WHERE id_propiedad=$1 FOR UPDATE', [id_lote]);
    if (loteRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Lote no encontrado' });
    }
    const lote = loteRes.rows[0];
    if (lote.estado_propiedad !== 'disponible') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Lote no disponible (estado actual: ${lote.estado_propiedad})` });
    }

    // Cliente: si id_cliente dado, comprobar existencia; si no, buscar por correo; si no existe y vienen datos, crear
    let finalClienteId = id_cliente ? parseInt(id_cliente) : null;
    if (finalClienteId) {
      const clienteExist = await client.query('SELECT id_cliente FROM cliente WHERE id_cliente=$1', [finalClienteId]);
      if (clienteExist.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Cliente indicado no existe' });
      }
    } else if (correo_cliente) {
      // buscar por correo
      const existeCorreo = await client.query('SELECT id_cliente FROM cliente WHERE correo=$1', [correo_cliente]);
      if (existeCorreo.rowCount > 0) {
        finalClienteId = existeCorreo.rows[0].id_cliente;
      } else {
        // crear cliente si vienen datos mínimos
        if (!nombre || !apellido_paterno) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'No existe cliente y faltan datos para crearlo (nombre/apellido_paterno)' });
        }
        const insertCli = await client.query(
          `INSERT INTO cliente (nombre, apellido_paterno, apellido_materno, correo, telefono)
           VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [nombre, apellido_paterno, apellido_materno || null, correo_cliente, phoneNormalizer(telefono)]
        );
        finalClienteId = insertCli.rows[0].id_cliente;
      }
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Debe proporcionar id_cliente o correo_cliente con datos para crear cliente' });
    }

    // Crear contrato
    const precioNum = parseFloat(precio_total);
    const engancheNum = parseFloat(enganche);
    const plazoNum = parseInt(plazo_meses, 10);

    const contrato = await ContratoVenta.createContractRecord(client, {
      id_lote,
      id_cliente: finalClienteId,
      precio_total: precioNum,
      enganche: engancheNum,
      plazo_meses: plazoNum,
      estado_contrato
    });

    // Calcular mensualidad (redondeo a 2 decimales)
    const mensualidad = parseFloat(((precioNum - engancheNum) / plazoNum).toFixed(2));

    // Generar pagos mismos día
    const pagos = [];
    const contratoDate = new Date(); // fecha inicio (hoy)
    for (let i = 1; i <= plazoNum; i++) {
      const fechaPago = addMonthsPreserveDay(contratoDate, i); // primer pago = +1 mes
      pagos.push({
        id_contrato: contrato.id_contrato,
        numero_pago: i,
        monto: mensualidad,
        fecha_pago: fechaPago.toISOString().split('T')[0], // DATE format YYYY-MM-DD
        metodo_pago: 'pendiente',
        estado_pago: 'pendiente'
      });
    }

    // Insertar pagos
    const pagosCreados = await Pago.createBulk(client, pagos);

    // Actualizar estado del lote a "en proceso" (o 'vendida' si prefieres)
    await client.query('UPDATE lote SET estado_propiedad=$1 WHERE id_propiedad=$2', ['en proceso', id_lote]);

    await client.query('COMMIT');

    // Responder con contrato y pagos creados
    res.status(201).json({ contrato, mensualidad, pagos: pagosCreados });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error crear contrato:', err);
    res.status(500).json({ message: 'Error al crear contrato', error: err.message });
  } finally {
    client.release();
  }
});


