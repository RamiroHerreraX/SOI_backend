const pool = require('../db');
const PDFDocument = require('pdfkit');

const PagoModel = {

  getResumenPagos: async () => {
    const query = `
      SELECT 
        c.id_cliente,
        c.nombre,
        c.apellido_paterno,
        cv.id_contrato,
        cv.precio_total,
        cv.enganche,
        COALESCE((SELECT SUM(monto) FROM pago WHERE id_contrato=cv.id_contrato),0) AS total_pagado,
        (cv.precio_total - cv.enganche -
         COALESCE((SELECT SUM(monto) FROM pago WHERE id_contrato=cv.id_contrato),0)
        ) AS saldo_restante
      FROM cliente c
      LEFT JOIN contrato_venta cv ON c.id_cliente = cv.id_cliente
      ORDER BY c.id_cliente
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  getPagosByContrato: async (id_contrato) => {
    const { rows } = await pool.query(
      `SELECT * FROM pago WHERE id_contrato=$1 ORDER BY numero_pago`,
      [id_contrato]
    );
    return rows;
  },

  getDetalleContrato: async (id_contrato) => {
    const { rows } = await pool.query(`
      SELECT 
        c.nombre,
        c.apellido_paterno,
        cv.id_contrato,
        cv.precio_total,
        cv.enganche,
        COALESCE(SUM(p.monto), 0) AS total_pagado,
        cv.precio_total - cv.enganche - COALESCE(SUM(p.monto), 0) AS saldo_pendiente
      FROM contrato_venta cv
      JOIN cliente c ON cv.id_cliente = c.id_cliente
      LEFT JOIN pago p ON cv.id_contrato = p.id_contrato
      WHERE cv.id_contrato = $1
      GROUP BY c.nombre, c.apellido_paterno, cv.id_contrato, cv.precio_total, cv.enganche
    `, [id_contrato]);
    return rows[0];
  },

  getInfoClienteContrato: async (id_contrato) => {
    const { rows } = await pool.query(`
      SELECT 
        c.nombre,
        c.apellido_paterno,
        c.correo,
        cv.id_contrato,
        cv.precio_total,
        cv.enganche,
        COALESCE(SUM(p.monto), 0) AS total_pagado,
        cv.precio_total - cv.enganche - COALESCE(SUM(p.monto), 0) AS saldo_pendiente,
        (SELECT MAX(fecha_pago) FROM pago WHERE id_contrato = cv.id_contrato) AS ultimo_pago
      FROM contrato_venta cv
      JOIN cliente c ON cv.id_cliente = c.id_cliente
      LEFT JOIN pago p ON cv.id_contrato = p.id_contrato
      WHERE cv.id_contrato = $1
      GROUP BY c.nombre, c.apellido_paterno, c.correo, cv.id_contrato, cv.precio_total, cv.enganche
    `, [id_contrato]);
    return rows[0];
  },

  registrarPago: async ({ id_contrato, monto, metodo_pago, descripcion }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows: [ultimoPago] } = await client.query(
        `SELECT MAX(numero_pago) as max_num FROM pago WHERE id_contrato=$1`,
        [id_contrato]
      );
      
      const numero_pago = (ultimoPago?.max_num || 0) + 1;
      
      const insert = await client.query(`
        INSERT INTO pago (id_contrato, numero_pago, monto, fecha_pago, metodo_pago, descripcion, estado_pago)
        VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, 'pagado')
        RETURNING *
      `, [id_contrato, numero_pago, monto, metodo_pago, descripcion]);
      
      await client.query(`
        UPDATE contrato_venta 
        SET saldo_pendiente = precio_total - enganche - 
            (SELECT COALESCE(SUM(monto), 0) FROM pago WHERE id_contrato = $1)
        WHERE id_contrato = $1
      `, [id_contrato]);
      
      await client.query('COMMIT');
      return insert.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  generarReciboPDF: async (pagoId) => {
    const { rows: [pago] } = await pool.query(`
      SELECT 
        p.*,
        c.nombre,
        c.apellido_paterno,
        cv.precio_total,
        cv.enganche
      FROM pago p
      JOIN contrato_venta cv ON p.id_contrato = cv.id_contrato
      JOIN cliente c ON cv.id_cliente = c.id_cliente
      WHERE p.id_pago = $1
    `, [pagoId]);

    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    
    doc.fontSize(20).text('RECIBO DE PAGO', { align: 'center' });
    doc.moveDown();
    
    doc.moveTo(50, 120).lineTo(550, 120).stroke();
    doc.moveDown(2);
    
    doc.fontSize(12).text(`Cliente: ${pago.nombre} ${pago.apellido_paterno}`);
    doc.text(`Contrato: ${pago.id_contrato}`);
    doc.text(`Número de pago: ${pago.numero_pago}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Detalles del Pago:', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12);
    doc.text(`Fecha: ${new Date(pago.fecha_pago).toLocaleDateString()}`);
    doc.text(`Monto: $${parseFloat(pago.monto).toFixed(2)}`);
    doc.text(`Método de pago: ${pago.metodo_pago}`);
    
    if (pago.descripcion) {
      doc.text(`Descripción: ${pago.descripcion}`);
    }
    
    doc.moveDown(2);
    
    doc.fontSize(14).text(`TOTAL: $${parseFloat(pago.monto).toFixed(2)}`, { align: 'right' });
    
    doc.moveDown(3);
    
    doc.fontSize(10)
       .text('______________________________', { align: 'center' })
       .text('Firma de recibido', { align: 'center' });
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
    });
  }

};

module.exports = PagoModel;