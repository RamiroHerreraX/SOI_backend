const PagoModel = require("../models/pagoModel");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

exports.getResumenPagos = async (req, res) => {
  try {
    const result = await PagoModel.getResumenPagos();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPagosByContrato = async (req, res) => {
  try {
    const result = await PagoModel.getPagosByContrato(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDetalleContrato = async (req, res) => {
  try {
    const result = await PagoModel.getDetalleContrato(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registrarPago = async (req, res) => {
  try {
    const nuevoPago = await PagoModel.registrarPago(req.body);
    res.json(nuevoPago);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generarRecibo = async (req, res) => {
  try {
    const pdfBuffer = await PagoModel.generarReciboPDF(req.params.id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo_${req.params.id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enviarNotificacionPago = async (req, res) => {
  try {
    const { id_contrato } = req.body;
    
    if (!id_contrato) {
      return res.status(400).json({ error: "ID de contrato es requerido" });
    }

    const infoContrato = await PagoModel.getInfoClienteContrato(id_contrato);
    
    if (!infoContrato) {
      return res.status(404).json({ error: "Contrato no encontrado" });
    }

    if (!infoContrato.correo) {
      return res.status(400).json({ error: "El cliente no tiene correo registrado" });
    }

    // Crear plantilla HTML si no existe
    const templatePath = path.join(__dirname, "../templates/notificacion-pago.html");
    let htmlTemplate;
    
    if (fs.existsSync(templatePath)) {
      htmlTemplate = fs.readFileSync(templatePath, "utf8");
    } else {
      // Plantilla básica si no existe el archivo
      htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <body>
          <h2>Recordatorio de Pago - INMOBILIARIA INDES</h2>
          <p>Estimado(a) {{NOMBRE_CLIENTE}},</p>
          <p>Le recordamos que tiene un saldo pendiente de <strong>{{SALDO_PENDIENTE}}</strong> en el contrato {{NUMERO_CONTRATO}}.</p>
          <p><strong>Resumen:</strong></p>
          <ul>
            <li>Precio Total: {{PRECIO_TOTAL}}</li>
            <li>Enganche: {{ENGANCHE}}</li>
            <li>Total Pagado: {{TOTAL_PAGADO}}</li>
            <li>Saldo Pendiente: {{SALDO_PENDIENTE}}</li>
          </ul>
          <p>Por favor, regularice su pago lo antes posible.</p>
          <p>Atentamente,<br>INMOBILIARIA INDES</p>
        </body>
        </html>
      `;
    }

    htmlTemplate = htmlTemplate
      .replace(/{{NOMBRE_CLIENTE}}/g, `${infoContrato.nombre} ${infoContrato.apellido_paterno}`)
      .replace(/{{NUMERO_CONTRATO}}/g, infoContrato.id_contrato)
      .replace(/{{SALDO_PENDIENTE}}/g, `$${parseFloat(infoContrato.saldo_pendiente).toFixed(2)}`)
      .replace(/{{TOTAL_PAGADO}}/g, `$${parseFloat(infoContrato.total_pagado).toFixed(2)}`)
      .replace(/{{PRECIO_TOTAL}}/g, `$${parseFloat(infoContrato.precio_total).toFixed(2)}`)
      .replace(/{{ENGANCHE}}/g, `$${parseFloat(infoContrato.enganche).toFixed(2)}`)
      .replace(/{{ULTIMO_PAGO}}/g, infoContrato.ultimo_pago ? 
        new Date(infoContrato.ultimo_pago).toLocaleDateString() : "No hay pagos registrados");

    await transporter.sendMail({
      from: EMAIL_USER,
      to: infoContrato.correo,
      subject: `Recordatorio de Pago Pendiente - Contrato ${infoContrato.id_contrato}`,
      html: htmlTemplate,
    });

    res.json({ 
      success: true, 
      message: "Notificación enviada correctamente",
      cliente: `${infoContrato.nombre} ${infoContrato.apellido_paterno}`,
      correo: infoContrato.correo 
    });
    
  } catch (error) {
    console.error("Error enviando notificación:", error);
    res.status(500).json({ error: error.message });
  }
};