// tests/clienteRoutes.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");

// Importa el router real
const clienteRoutes = require("../src/routes/clienteRoutes");

// Mock del controlador
const clienteController = require("../src/controllers/clienteController");
jest.mock("../src/controllers/clienteController");

const app = express();
app.use(bodyParser.json());
app.use("/clientes", clienteRoutes);

describe("📋 Cliente Routes", () => {
  beforeEach(() => jest.clearAllMocks());

  test("GET /clientes - lista de clientes", async () => {
    const fakeClientes = [{ id: 1, nombre: "Juan" }];
    clienteController.getAll.mockImplementation((req, res) => res.status(200).json(fakeClientes));

    const res = await request(app).get("/clientes");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeClientes);
  });

  test("POST /clientes/obtener - cliente por CURP", async () => {
    const fakeCliente = { id: 1, curp: "ABC123" };
    clienteController.getByCurp.mockImplementation((req, res) => res.status(200).json(fakeCliente));

    const res = await request(app).post("/clientes/obtener").send({ curp: "ABC123" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeCliente);
  });

  test("POST /clientes - crear cliente", async () => {
    const nuevoCliente = { id: 1, nombre: "Ana" };
    clienteController.create.mockImplementation((req, res) => res.status(201).json(nuevoCliente));

    const res = await request(app).post("/clientes").send({ nombre: "Ana" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(nuevoCliente);
  });

  test("PUT /clientes/actualizar - actualizar cliente", async () => {
    const actualizado = { id: 1, nombre: "Ana Actualizada" };
    clienteController.update.mockImplementation((req, res) => res.status(200).json(actualizado));

    const res = await request(app).put("/clientes/actualizar").send({ id: 1, nombre: "Ana Actualizada" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(actualizado);
  });

  test("DELETE /clientes/eliminar - eliminar cliente", async () => {
    const eliminado = { id: 1, mensaje: "Cliente eliminado" };
    clienteController.delete.mockImplementation((req, res) => res.status(200).json(eliminado));

    const res = await request(app).delete("/clientes/eliminar").send({ id: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(eliminado);
  });
});
