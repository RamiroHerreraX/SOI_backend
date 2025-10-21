// tests/pagoController.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const pagoController = require("../src/controllers/pagoController");
const pool = require("../src/db");

// Crear app de prueba
const app = express();
app.use(bodyParser.json());
app.post("/pagos/por-contrato", pagoController.getByContrato);
app.post("/pagos/marcar", pagoController.marcarPagadoPorCorreo);

// Mock de pool.query
jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

describe("💳 Pruebas de PagoController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Debe devolver 400 si no se envía correo en getByContrato", async () => {
    const res = await request(app).post("/pagos/por-contrato").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("El correo es requerido");
  });

  test("Debe devolver 404 si no hay pagos para el cliente", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = await request(app)
      .post("/pagos/por-contrato")
      .send({ correo: "test@cliente.com" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No se encontraron pagos para este cliente");
  });

  test("Debe devolver los pagos si existen", async () => {
    const fakePagos = [{ id_pago: 1, estado_pago: "pendiente" }];
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: fakePagos });
    const res = await request(app)
      .post("/pagos/por-contrato")
      .send({ correo: "test@cliente.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakePagos);
  });

  test("Debe devolver 404 si no hay pagos pendientes al marcarPagadoPorCorreo", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = await request(app)
      .post("/pagos/marcar")
      .send({ correo: "test@cliente.com" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No hay pagos pendientes para este cliente");
  });

  test("Debe marcar el pago como pagado correctamente", async () => {
    // Mock primer query para obtener pago pendiente
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pago: 1 }] });
    // Mock segundo query para update
    const pagoActualizado = { id_pago: 1, estado_pago: "pagado", metodo_pago: "efectivo" };
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [pagoActualizado] });

    const res = await request(app)
      .post("/pagos/marcar")
      .send({ correo: "test@cliente.com" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Pago marcado como pagado");
    expect(res.body.pago).toEqual(pagoActualizado);
  });
});
