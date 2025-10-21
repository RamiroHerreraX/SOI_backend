describe("💥 Pruebas de manejo de errores", () => {
  test("Debe manejar error en envío de correo en sendResetLink", async () => {
    const nodemailer = require("nodemailer");
    const fakeTransport = {
      sendMail: jest.fn().mockRejectedValue(new Error("Falla SMTP")),
      verify: jest.fn((cb) => cb(null, true)),
    };
    nodemailer.createTransport.mockReturnValue(fakeTransport);

    const User = require("../src/models/userModel");
    User.getByEmail.mockResolvedValue({ correo: "user@test.com" });

    const res = await request(app)
      .post("/auth/send-reset-link")
      .send({ correo: "user@test.com" });

    expect(res.statusCode).toBe(500);
    expect(res.body.msg).toBe("Error enviando correo");
  });

  test("Debe rechazar OTP incorrecto", async () => {
    const controller = require("../src/controllers/authController");
    controller._otpStore["user@test.com"] = {
      otp: "999999",
      expires: Date.now() + 10000,
    };

    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ correo: "user@test.com", otp: "123456" });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("OTP incorrecto");
  });

  test("Debe manejar error inesperado en verify-otp (try/catch)", async () => {
    const controller = require("../src/controllers/authController");
    controller._otpStore = null;

    const res = await request(app)
      .post("/auth/verify-otp")
      .send({ correo: "user@test.com", otp: "123456" });

    expect(res.statusCode).toBe(500);
    expect(res.body.msg).toBe("Error verificando OTP");
  });

  test("Debe manejar error inesperado en login", async () => {
    const User = require("../src/models/userModel");
    User.getByEmail.mockRejectedValue(new Error("DB Error"));

    const res = await request(app)
      .post("/auth/login")
      .send({ correo: "user@test.com", password: "123456" });

    expect(res.statusCode).toBe(500);
    expect(res.body.msg).toBe("Error en el servidor");
  });
});
