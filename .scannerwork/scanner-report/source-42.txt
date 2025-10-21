const request = require("supertest");
const express = require("express");
const router = require("../src/routes/authRoutes");



// 🧱 Mocks de dependencias
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
    verify: jest.fn().mockImplementation((cb) => cb(null, true)),
  }),
}));
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue("hashedpassword"),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("fake-jwt-token"),
}));
jest.mock("speakeasy", () => ({
  totp: jest.fn().mockReturnValue("123456"),
  generateSecret: jest.fn().mockReturnValue({ base32: "FAKESECRET" }),
}));
jest.mock("../src/models/userModel", () => ({
  getByEmail: jest.fn(),
  updatePassword: jest.fn(),
}));

const User = require("../src/models/userModel");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use("/auth", router);

describe("🔐 Pruebas de autenticación", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- LOGIN ----------
  test("Debe rechazar login sin correo o contraseña", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("Correo y contraseña son requeridos");
  });

  test("Debe rechazar formato de correo inválido", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ correo: "invalido", password: "123456" });
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("Formato de correo inválido");
  });

  test("Debe rechazar si el usuario no existe", async () => {
    User.getByEmail.mockResolvedValue(null);
    const res = await request(app)
      .post("/auth/login")
      .send({ correo: "user@test.com", password: "123456" });
    expect(res.statusCode).toBe(404);
    expect(res.body.msg).toBe("Usuario no encontrado");
  });

  test("Debe rechazar contraseña incorrecta", async () => {
    User.getByEmail.mockResolvedValue({ password: "hashed" });
    bcrypt.compare.mockResolvedValue(false);
    const res = await request(app)
      .post("/auth/login")
      .send({ correo: "user@test.com", password: "wrongpass" });
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("Contraseña incorrecta");
  });

  test("Debe aceptar login válido y enviar OTP", async () => {
    User.getByEmail.mockResolvedValue({ id_user: 1, correo: "user@test.com", password: "hashed" });
    bcrypt.compare.mockResolvedValue(true);
    const res = await request(app)
      .post("/auth/login")
      .send({ correo: "user@test.com", password: "123456" });
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe("Código 2FA enviado a tu correo");
  });

  // ---------- VERIFY OTP ----------
  test("Debe rechazar verificación OTP sin datos", async () => {
    const res = await request(app).post("/auth/verify-otp").send({});
    expect(res.statusCode).toBe(400);
  });

  test("Debe rechazar OTP expirado", async () => {
    const controller = require("../src/controllers/authController");
    controller.__getOtpStore && delete controller.__getOtpStore;
    controller.otpStore = { "user@test.com": { otp: "123456", expires: Date.now() - 1 } };

    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ correo: "user@test.com", otp: "123456" });
    expect(res.statusCode).toBe(400);
  });

  // ---------- RESET PASSWORD ----------
  test("Debe rechazar reset password sin token o password", async () => {
    const res = await request(app).post("/auth/reset/").send({});
    expect(res.statusCode).toBe(404); // ruta no válida sin token
  });

  test("Debe rechazar reset con contraseña corta", async () => {
    const res = await request(app)
      .post("/auth/reset/faketoken")
      .send({ password: "123" });
    expect(res.statusCode).toBe(400);
  });

  // ---------- SEND RESET LINK ----------
  test("Debe rechazar reset link sin correo", async () => {
    const res = await request(app).post("/auth/send-reset-link").send({});
    expect(res.statusCode).toBe(400);
  });

  test("Debe rechazar reset link con formato inválido", async () => {
    const res = await request(app)
      .post("/auth/send-reset-link")
      .send({ correo: "invalid" });
    expect(res.statusCode).toBe(400);
  });

  test("Debe rechazar reset link si usuario no existe", async () => {
    User.getByEmail.mockResolvedValue(null);
    const res = await request(app)
      .post("/auth/send-reset-link")
      .send({ correo: "user@test.com" });
    expect(res.statusCode).toBe(404);
  });
});
