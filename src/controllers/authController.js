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

// =================== UTILIDADES ===================
const saveOffline = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));
const readOffline = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : []);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =================== TRANSPORTADOR DE EMAIL ===================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});
transporter.verify((error, success) => {
  if (error) console.error("Error transporter:", error);
  else console.log("Servidor SMTP listo para enviar emails");
});


// =================== LOGIN CON 2FA ===================
exports.login = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password)
    return res.status(400).json({ msg: "Correo y contraseña son requeridos" });
  if (!emailRegex.test(correo))
    return res.status(400).json({ msg: "Formato de correo inválido" });

  try {
    const user = await User.getByEmail(correo);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    if (!loginAttempts[correo])
      loginAttempts[correo] = { intentos: 0, bloqueado: null };

    if (loginAttempts[correo].bloqueado && Date.now() < loginAttempts[correo].bloqueado)
      return res.status(403).json({ msg: "Usuario bloqueado temporalmente" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      loginAttempts[correo].intentos++;
      if (loginAttempts[correo].intentos >= 5) {
        loginAttempts[correo].bloqueado = Date.now() + 60 * 1000; // 1 min
        loginAttempts[correo].intentos = 0;
        return res.status(403).json({ msg: "Usuario bloqueado por intentos fallidos" });
      }
      return res.status(400).json({ msg: "Contraseña incorrecta" });
    }

    loginAttempts[correo].intentos = 0;

    // Generar OTP de 6 dígitos
    const otp = speakeasy.totp({
      secret: speakeasy.generateSecret().base32,
      encoding: "base32",
      step: 300,
      digits: 6,
    });
    otpStore[correo] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // Enviar OTP por correo
    await transporter.sendMail({
      from: EMAIL_USER,
      to: correo,
      subject: "Verificación de dos pasos (2FA)",
      html: `<p>Tu código es: <b>${otp}</b></p><p>Válido por 5 minutos.</p>`,
    });

    res.json({ msg: "Código 2FA enviado a tu correo" });
  } catch (err) {
    console.error("Error login:", err.message);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// =================== VERIFICAR OTP ===================
exports.verifyOtp = async (req, res) => {
  const { correo, otp } = req.body;

  if (!correo || !otp)
    return res.status(400).json({ msg: "Correo y OTP requeridos" });

  const record = otpStore[correo];
  if (!record) return res.status(400).json({ msg: "OTP no generado" });
  if (Date.now() > record.expires)
    return res.status(400).json({ msg: "OTP expirado" });
  if (otp !== record.otp)
    return res.status(400).json({ msg: "OTP incorrecto" });

  delete otpStore[correo];
  const user = await User.getByEmail(correo);
  const token = jwt.sign(
    { id: user.id_user, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  res.json({ msg: "Autenticación 2FA exitosa", token });
};

// =================== ENVIAR ENLACE RESET PASSWORD ===================
// =================== ENVIAR ENLACE RESET PASSWORD ===================
exports.sendResetLink = async (req, res) => {
  const { correo } = req.body;

  if (!correo) return res.status(400).json({ msg: "Correo requerido" });
  if (!emailRegex.test(correo))
    return res.status(400).json({ msg: "Formato de correo inválido" });

  try {
    const user = await User.getByEmail(correo);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    // Generar token
    const token = crypto.randomBytes(32).toString("hex");

    // Guardar token en archivo JSON
    const resets = readOffline(resetTokensFile);
    resets.push({ correo, token, expires: Date.now() + 15 * 60 * 1000 });
    saveOffline(resetTokensFile, resets);

    const resetUrl = `http://localhost:4200/reset/${token}`;

    console.log("Enviando email de reset a:", correo);
    console.log("Token generado:", token);
    console.log("URL reset:", resetUrl);

    // Enviar correo
    await transporter.sendMail({
      from: EMAIL_USER,
      to: correo,
      subject: "Restablecer contraseña",
      html: `<p>Haz clic en el enlace para restablecer tu contraseña:</p>
             <a href="${resetUrl}">${resetUrl}</a>`,
    });

    console.log("Correo enviado correctamente");

    // Responder al cliente
    return res.status(200).json({ msg: "Enlace de recuperación enviado" });
  } catch (err) {
    console.error("Error enviando correo:", err);
    return res.status(500).json({ msg: "Error enviando correo" });
  }
};




// =================== RESTABLECER CONTRASEÑA ===================
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password)
    return res.status(400).json({ msg: "Token y nueva contraseña requeridos" });
  if (password.length < 6)
    return res.status(400).json({ msg: "Contraseña muy corta" });

  const resets = readOffline(resetTokensFile);
  const resetData = resets.find((r) => r.token === token);
  if (!resetData) return res.status(400).json({ msg: "Token inválido" });
  if (Date.now() > resetData.expires)
    return res.status(400).json({ msg: "Token expirado" });

  const hashed = await bcrypt.hash(password, 10);
  await User.updatePassword(resetData.correo, hashed);

  saveOffline(resetTokensFile, resets.filter((r) => r.token !== token));
  res.json({ msg: "Contraseña actualizada correctamente" });
};
