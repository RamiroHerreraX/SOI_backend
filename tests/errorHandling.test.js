// MOCKS
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
    verify: jest.fn(),
  })),
}));

jest.mock("../src/models/userModel", () => ({
  getByEmail: jest.fn(),
}));

// IMPORTS
const nodemailer = require("nodemailer");
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/userModel");
const controller = require("../src/controllers/authController");

describe("💥 Pruebas de manejo de errores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Debe manejar error en envío de correo en sendResetLink", async () => {
    const fakeTransport = {
      sendMail: jest.fn().mockRejectedValue(new Error("Falla SMTP")),
      verify: jest.fn((cb) => cb(null, true)),
    };
    nodemailer.createTransport.mockReturnValue(fakeTransport);

    User.getByEmail.mockResolvedValue({ correo: "user@test.com" });

    const res = await request(app)
      .post("/api/auth/send-reset-link")
      .send({ correo: "user@test.com" });

    expect(res.statusCode).toBe(500);
    expect(res.body.msg).toBe("Error enviando correo");
  });

  test("Debe rechazar OTP incorrecto", async () => {
    controller._otpStore["user@test.com"] = {
      otp: "999999",
      expires: Date.now() + 10000,
    };

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ correo: "user@test.com", otp: "123456" });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("OTP incorrecto");
  });
});
