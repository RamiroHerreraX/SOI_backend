const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");

// Archivos de respaldo (offline)
const offlineFile = path.join(__dirname, "../offline-users.json");
const resetTokensFile = path.join(__dirname, "../offline-resets.json");

// Datos temporales en memoria
const otpStore = {};
const loginAttempts = {};

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =================== FUNCIONES AUXILIARES ===================
const saveOffline = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

const readOffline = (file) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];

// =================== CONFIGURACIÓN SMTP ===================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

if (process.env.NODE_ENV !== "test") {
  transporter.verify((err) => {
    if (err) console.error("Error con el servidor SMTP:", err);
    else console.log("SMTP listo para enviar correos");
  });
}

// ============================================================
// ======================== LOGIN 2FA ==========================
// ============================================================
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", correo);

    if (!correo || !password)
      return res
        .status(400)
        .json({ status: "fail", msg: "Correo y contraseña son requeridos" });

    if (!emailRegex.test(correo))
      return res
        .status(400)
        .json({ status: "fail", msg: "Formato de correo inválido" });

    const user = await User.getByEmail(correo);
    console.log("Usuario encontrado:", !!user);

    if (!user)
      return res
        .status(404)
        .json({ status: "fail", msg: "Usuario no encontrado" });

    // Manejo de intentos fallidos
    if (!loginAttempts[correo])
      loginAttempts[correo] = { intentos: 0, bloqueado: null };

    if (
      loginAttempts[correo].bloqueado &&
      Date.now() < loginAttempts[correo].bloqueado
    ) {
      return res
        .status(400)
        .json({ status: "fail", msg: "Usuario bloqueado temporalmente" });
    }

    // Validar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    console.log("Password válida:", validPassword);

    if (!validPassword) {
      loginAttempts[correo].intentos++;

      if (loginAttempts[correo].intentos >= 5) {
        loginAttempts[correo].bloqueado = Date.now() + 60 * 1000;
        loginAttempts[correo].intentos = 0;
        return res.status(400).json({
          status: "fail",
          msg: "Usuario bloqueado por intentos fallidos",
        });
      }

      return res
        .status(400)
        .json({ status: "fail", msg: "Contraseña incorrecta" });
    }

    loginAttempts[correo].intentos = 0;

    // =================== GENERAR OTP ===================
    const otp = speakeasy.totp({
      secret: speakeasy.generateSecret().base32,
      encoding: "base32",
      step: 300, // 5 minutos
      digits: 6,
    });

    otpStore[correo] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    // =================== CARGAR PLANTILLA HTML ===================
    let htmlTemplate = fs.readFileSync(
      path.join(__dirname, "../templates/2fa.html"),
      "utf8"
    );

    htmlTemplate = htmlTemplate.replace("{{OTP}}", otp);

    await transporter.sendMail({
      from: EMAIL_USER,
      to: correo,
      subject: "Código de verificación (2FA)",
      html: htmlTemplate,
    });

    return res.status(200).json({
      status: "success",
      msg: "Código 2FA enviado al correo",
    });
  } catch (err) {
    console.error("Error login:", err.message);
    res.status(500).json({ status: "error", msg: "Error en el servidor" });
  }
};

// ============================================================
// ======================= VERIFICAR OTP =======================
// ============================================================
exports.verifyOtp = async (req, res) => {
  try {
    const { correo, otp } = req.body;

    console.log("=== VERIFY OTP ===", correo, otp);

    if (!correo || !otp)
      return res
        .status(400)
        .json({ status: "fail", msg: "Correo y OTP requeridos" });

    const record = otpStore[correo];
    if (!record)
      return res.status(400).json({ status: "fail", msg: "OTP no generado" });

    if (Date.now() > record.expires)
      return res.status(400).json({ status: "fail", msg: "OTP expirado" });

    if (otp !== record.otp)
      return res.status(400).json({ status: "fail", msg: "OTP incorrecto" });

    delete otpStore[correo];

    const user = await User.getByEmail(correo);

    const token = jwt.sign(
      { id: user.id_user, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      status: "success",
      msg: "Autenticación exitosa",
      token,
      user: {
        nombre: user.usuario,
        rol: user.rol,
        correo: user.correo,
      },
    });
  } catch (err) {
    console.error("Error verifyOtp:", err.message);
    res.status(500).json({ status: "error", msg: "Error en el servidor" });
  }
};

// ============================================================
// ================== ENVIAR LINK DE RECUPERACIÓN ==============
// ============================================================
exports.sendResetLink = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo)
      return res
        .status(400)
        .json({ status: "fail", msg: "Correo requerido" });

    if (!emailRegex.test(correo))
      return res
        .status(400)
        .json({ status: "fail", msg: "Formato de correo inválido" });

    const user = await User.getByEmail(correo);
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", msg: "Usuario no encontrado" });

    const token = crypto.randomBytes(32).toString("hex");

    const resets = readOffline(resetTokensFile);
    resets.push({
      correo,
      token,
      expires: Date.now() + 15 * 60 * 1000,
    });
    saveOffline(resetTokensFile, resets);

    const resetUrl = `http://localhost:4200/reset/${token}`;

    await transporter.sendMail({
      from: EMAIL_USER,
      to: correo,
      subject: "Restablecer contraseña",
      html: `
        <h2>Recuperación de contraseña</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Válido por 15 minutos.</p>
      `,
    });

    res
      .status(200)
      .json({ status: "success", msg: "Correo enviado correctamente" });
  } catch (err) {
    console.error("Error enviando correo:", err.message);
    res.status(500).json({ status: "error", msg: "Error enviando correo" });
  }
};

// ============================================================
// ================== RESTABLECER CONTRASEÑA ===================
// ============================================================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password)
      return res.status(400).json({
        status: "fail",
        msg: "Token y nueva contraseña requeridos",
      });

    if (password.length < 6)
      return res
        .status(400)
        .json({ status: "fail", msg: "Contraseña muy corta" });

    const resets = readOffline(resetTokensFile);
    const resetData = resets.find((r) => r.token === token);

    if (!resetData)
      return res.status(400).json({ status: "fail", msg: "Token inválido" });

    if (Date.now() > resetData.expires)
      return res.status(400).json({ status: "fail", msg: "Token expirado" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updatePassword(resetData.correo, hashedPassword);

    saveOffline(
      resetTokensFile,
      resets.filter((r) => r.token !== token)
    );

    return res.status(200).json({
      status: "success",
      msg: "Contraseña actualizada correctamente",
    });
  } catch (err) {
    console.error("Error resetPassword:", err.message);
    res.status(500).json({ status: "error", msg: "Error en el servidor" });
  }
};
