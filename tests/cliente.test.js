const request = require("supertest");
const express = require("express");
const clienteController = require("../src/controllers/clienteController");
const Cliente = require("../src/models/clienteModel");

jest.mock("../src/models/clienteModel"); // Mock completo del modelo

// Configuramos un servidor Express mínimo para probar los endpoints
const app = express();
app.use(express.json());
app.get("/clientes", clienteController.getAll);
app.post("/clientes/by-curp", clienteController.getByCurp);
app.post("/clientes", clienteController.create);
app.put("/clientes", clienteController.update);
app.delete("/clientes", clienteController.delete);

describe("💼 Pruebas Cliente Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================= GET /clientes =================
  test("Debe retornar lista de clientes", async () => {
    const mockData = [{ curp: "ABC123", nombre: "Juan" }];
    Cliente.getAll.mockResolvedValue(mockData);

    const res = await request(app).get("/clientes");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  // ================= GET /clientes/by-curp =================
  test("Debe rechazar búsqueda sin CURP", async () => {
    const res = await request(app).post("/clientes/by-curp").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("CURP es requerida para la búsqueda");
  });

  test("Debe retornar 404 si cliente no existe", async () => {
    Cliente.getByCurp.mockResolvedValue(null);
    const res = await request(app).post("/clientes/by-curp").send({ curp: "ABC123" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Cliente no encontrado");
  });

  test("Debe retornar cliente existente", async () => {
    const cliente = { curp: "ABC123", nombre: "Juan" };
    Cliente.getByCurp.mockResolvedValue(cliente);
    const res = await request(app).post("/clientes/by-curp").send({ curp: "ABC123" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(cliente);
  });

  // ================= POST /clientes =================
  test("Debe rechazar creación con datos inválidos", async () => {
    Cliente.validate.mockReturnValue({ error: { details: ["Nombre requerido"] } });
    const res = await request(app).post("/clientes").send({ correo: "test@test.com" });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toBe("Error de validación");
  });

  test("Debe rechazar si ya existe cliente con mismo correo", async () => {
    Cliente.validate.mockReturnValue({ error: null });
    Cliente.getByCorreo.mockResolvedValue({ correo: "test@test.com" });
    const res = await request(app).post("/clientes").send({ correo: "test@test.com" });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Ya existe un cliente con ese correo");
  });

  test("Debe crear cliente correctamente", async () => {
    Cliente.validate.mockReturnValue({ error: null });
    Cliente.getByCorreo.mockResolvedValue(null);
    const newCliente = { curp: "XYZ123", nombre: "Ana" };
    Cliente.create.mockResolvedValue(newCliente);

    const res = await request(app).post("/clientes").send(newCliente);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(newCliente);
  });

  // ================= PUT /clientes =================
  test("Debe rechazar actualización sin CURP", async () => {
    const res = await request(app).put("/clientes").send({ datos: { nombre: "Nuevo" } });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("La CURP es requerida para la actualización");
  });

  test("Debe rechazar actualización sin objeto 'datos'", async () => {
    const res = await request(app).put("/clientes").send({ curp: "ABC123" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('El objeto "datos" es requerido con los campos del cliente');
  });

  test("Debe retornar 404 si cliente a actualizar no existe", async () => {
    Cliente.getByCurp.mockResolvedValue(null);
    const res = await request(app).put("/clientes").send({ curp: "ABC123", datos: { nombre: "Nuevo" } });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Cliente no encontrado");
  });

  test("Debe actualizar cliente correctamente", async () => {
    Cliente.getByCurp.mockResolvedValue({ curp: "ABC123", nombre: "Juan" });
    Cliente.update.mockResolvedValue({ curp: "ABC123", nombre: "Nuevo" });

    const res = await request(app).put("/clientes").send({ curp: "ABC123", datos: { nombre: "Nuevo" } });
    expect(res.statusCode).toBe(200);
    expect(res.body.cliente.nombre).toBe("Nuevo");
  });

  // ================= DELETE /clientes =================
  test("Debe rechazar eliminación sin CURP", async () => {
    const res = await request(app).delete("/clientes").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("La CURP es requerida para eliminar el cliente");
  });

  test("Debe retornar 404 si cliente a eliminar no existe", async () => {
    Cliente.getByCurp.mockResolvedValue(null);
    const res = await request(app).delete("/clientes").send({ curp: "ABC123" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Cliente no encontrado");
  });

  test("Debe eliminar cliente correctamente", async () => {
    Cliente.getByCurp.mockResolvedValue({ curp: "ABC123", nombre: "Juan" });
    Cliente.delete.mockResolvedValue({ curp: "ABC123", nombre: "Juan" });

    const res = await request(app).delete("/clientes").send({ curp: "ABC123" });
    expect(res.statusCode).toBe(200);
    expect(res.body.cliente.nombre).toBe("Juan");
  });
});
