const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");

const offlineFile = path.join(__dirname, "../offline-users.json");
const resetTokensFile = path.join(__dirname, "../offline-resets.json");

const otpStore = {};
const loginAttempts = {};

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =================== UTILIDADES ===================
const saveOffline = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
const readOffline = (file) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];

// =================== TRANSPORTADOR DE EMAIL ===================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

// Solo verificar SMTP si no estamos en test
if (process.env.NODE_ENV !== "test") {
  transporter.verify((error, success) => {
    if (error) console.error("Error transporter:", error);
    else console.log("Servidor SMTP listo para enviar emails");
  });
}

// =================== EXPORTS PARA TEST ===================
if (process.env.NODE_ENV === "test") {
  module.exports._otpStore = otpStore;
  module.exports._resetTokensFile = resetTokensFile;
  module.exports._transporter = transporter;
}

// =================== LOGIN CON 2FA ===================
exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password)
      return res.status(400).json({ status: "fail", msg: "Correo y contraseña son requeridos" });

    if (!emailRegex.test(correo))
      return res.status(400).json({ status: "fail", msg: "Formato de correo inválido" });

    const user = await User.getByEmail(correo);
    if (!user) return res.status(404).json({ status: "fail", msg: "Usuario no encontrado" });

    if (!loginAttempts[correo])
      loginAttempts[correo] = { intentos: 0, bloqueado: null };

    if (loginAttempts[correo].bloqueado && Date.now() < loginAttempts[correo].bloqueado)
      return res.status(400).json({ status: "fail", msg: "Usuario bloqueado temporalmente" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      loginAttempts[correo].intentos++;
      if (loginAttempts[correo].intentos >= 5) {
        loginAttempts[correo].bloqueado = Date.now() + 60 * 1000;
        loginAttempts[correo].intentos = 0;
        return res.status(400).json({ status: "fail", msg: "Usuario bloqueado por intentos fallidos" });
      }
      return res.status(400).json({ status: "fail", msg: "Contraseña incorrecta" });
    }

    loginAttempts[correo].intentos = 0;

    const otp = speakeasy.totp({
      secret: speakeasy.generateSecret().base32,
      encoding: "base32",
      step: 300,
      digits: 6,
    });
    otpStore[correo] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    await transporter.sendMail({
      from: EMAIL_USER,
      to: correo,
      subject: "Verificación de dos pasos (2FA)",
      html: `<p>Tu código es: <b>${otp}</b></p><p>Válido por 5 minutos.</p>`,
    });

    res.status(200).json({ status: "success", msg: "Código 2FA enviado a tu correo" });
  } catch (err) {
    console.error("Error login:", err.message);
    res.status(500).json({ status: "error", msg: "Error en el servidor" });
  }
};

// =================== VERIFICAR OTP ===================
exports.verifyOtp = async (req, res) => {
  try {
    const { correo, otp } = req.body;

    if (!correo || !otp)
      return res.status(400).json({ status: "fail", msg: "Correo y OTP requeridos" });

    const record = otpStore[correo];
    if (!record) return res.status(400).json({ status: "fail", msg: "OTP no generado" });
    if (Date.now() > record.expires) return res.status(400).json({ status: "fail", msg: "OTP expirado" });
    if (otp !== record.otp) return res.status(400).json({ status: "fail", msg: "OTP incorrecto" });

    delete otpStore[correo];
    const user = await User.getByEmail(correo);
    console.log(user);

    const token = jwt.sign(
      { id: user.id_user, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      status: "success",
      msg: "Autenticación 2FA exitosa",
      token,
      user: {
        nombre: user.usuario,
        rol: user.rol,
        correo: user.correo
      }
    });
  } catch (err) {
    console.error("Error verifyOtp:", err.message);
    res.status(500).json({ status: "error", msg: "Error en el servidor" });
  }
};

// =================== ENVIAR ENLACE RESET PASSWORD ===================
exports.sendResetLink = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) return res.status(400).json({ status: "fail", msg: "Correo requerido" });
    if (!emailRegex.test(correo))
      return res.status(400).json({ status: "fail", msg: "Formato de correo inválido" });

    const user = await User.getByEmail(correo);
    if (!user) return res.status(404).json({ status: "fail", msg: "Usuario no encontrado" });

    const token = crypto.randomBytes(32).toString("hex");

    const resets = readOffline(resetTokensFile);
    resets.push({ correo, token, expires: Date.now() + 15 * 60 * 1000 });
    saveOffline(resetTokensFile, resets);

    const resetUrl = `http://localhost:4200/reset/${token}`;

    await transporter.sendMail({
      from: EMAIL_USER,
      to: correo,
      subject: "Restablecer contraseña",
      html: `<p>Haz clic en el enlace para restablecer tu contraseña:</p>
             <a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.status(200).json({ status: "success", msg: "Enlace de recuperación enviado" });
  } catch (err) {
    console.error("Error enviando correo:", err.message);
    res.status(500).json({ status: "error", msg: "Error enviando correo" });
  }
};

// =================== RESTABLECER CONTRASEÑA ===================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password)
      return res.status(400).json({ status: "fail", msg: "Token y nueva contraseña requeridos" });

    if (password.length < 6)
      return res.status(400).json({ status: "fail", msg: "Contraseña muy corta" });

    const resets = readOffline(resetTokensFile);
    const resetData = resets.find((r) => r.token === token);
    if (!resetData) return res.status(400).json({ status: "fail", msg: "Token inválido" });
    if (Date.now() > resetData.expires)
      return res.status(400).json({ status: "fail", msg: "Token expirado" });

    const hashed = await bcrypt.hash(password, 10);
    await User.updatePassword(resetData.correo, hashed);

    // Eliminar token usado
    saveOffline(resetTokensFile, resets.filter((r) => r.token !== token));

    res.status(200).json({ status: "success", msg: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error resetPassword:", err.message);
    res.status(500).json({ status: "error", msg: "Error en el servidor" });
  }
};

// =================== EXPORTS PARA TEST ===================
if (process.env.NODE_ENV === "test") {
  module.exports._otpStore = otpStore;
  module.exports._resetTokensFile = resetTokensFile;
  module.exports._transporter = transporter;
}
