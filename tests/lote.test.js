// tests/loteController.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");

const LoteController = require("../src/controllers/loteController");
const Lote = require("../src/models/loteModel");

// Mock del modelo
jest.mock("../src/models/loteModel");

// Configuración Express
const app = express();
app.use(bodyParser.json());

// Rutas
app.get("/lotes", LoteController.getAllLotes);
app.get("/lote/:id", LoteController.getLoteById);
app.post("/lote", LoteController.createLote);
app.get("/lote-query", LoteController.getLote);
app.put("/lote-query", LoteController.updateLoteByQuery);
app.delete("/lote-query", LoteController.deleteLoteByQuery);
app.put("/lote/:id", LoteController.updateLote);
app.delete("/lote/:id", LoteController.deleteLote);

describe("🏠 LoteController tests completos", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------- GET ALL ----------
  test("Debe devolver lista de lotes", async () => {
    Lote.getAll.mockResolvedValue([{ id_propiedad: 1, nombre: "Lote1" }]);
    const res = await request(app).get("/lotes");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id_propiedad: 1, nombre: "Lote1" }]);
  });

  test("Debe manejar error en getAllLotes", async () => {
    Lote.getAll.mockRejectedValue(new Error("DB Error"));
    const res = await request(app).get("/lotes");
    expect(res.statusCode).toBe(500);
  });

  // ---------- GET BY ID ----------
  test("Debe devolver 404 si lote no encontrado", async () => {
    Lote.getById.mockResolvedValue(null);
    const res = await request(app).get("/lote/1");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Lote no encontrado");
  });

  test("Debe devolver lote por ID", async () => {
    const lote = { id_propiedad: 1, nombre: "Lote1" };
    Lote.getById.mockResolvedValue(lote);
    const res = await request(app).get("/lote/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(lote);
  });

  test("Debe manejar error en getLoteById", async () => {
    Lote.getById.mockRejectedValue(new Error("DB Error"));
    const res = await request(app).get("/lote/1");
    expect(res.statusCode).toBe(500);
  });

  // ---------- CREATE ----------
  test("Debe devolver 400 si hay errores de validación", async () => {
    const res = await request(app).post("/lote").send({ tipo: "invalid" });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toBe("Errores de validación");
  });

  test("Debe crear lote correctamente sin req.file", async () => {
    const fakeLote = { id_propiedad: 1, tipo: "casa", imagen: null };
    Lote.create.mockResolvedValue(fakeLote);

    const res = await request(app).post("/lote").send({
      tipo: "casa",
      numLote: "A1",
      direccion: "Calle 1",
      superficie_m2: 100,
      precio: 500000,
      estado_propiedad: "disponible",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(fakeLote);
  });

  test("Debe crear lote con req.file", async () => {
    const fakeLote = { id_propiedad: 1, tipo: "casa", imagen: "/uploads/img.png" };
    Lote.create.mockResolvedValue(fakeLote);

    const res = await request(app)
      .post("/lote")
      .field("tipo", "casa")
      .field("numLote", "A1")
      .field("direccion", "Calle 1")
      .attach("file", Buffer.from("fake"), "img.png");

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(fakeLote);
  });

  test("Debe manejar error en createLote", async () => {
    Lote.create.mockRejectedValue(new Error("DB Error"));
    const res = await request(app)
      .post("/lote")
      .send({
        tipo: "casa",
        numLote: "A1",
        direccion: "Calle 1",
        superficie_m2: 100,
        precio: 500000,
        estado_propiedad: "disponible",
      });
    expect(res.statusCode).toBe(400);
  });

  // ---------- GET LOTE QUERY ----------
  test("Debe devolver 400 si tipo no provisto", async () => {
    const res = await request(app).get("/lote-query");
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("El campo tipo es obligatorio");
  });

  test("Debe devolver 400 si numLote faltante para terreno", async () => {
    const res = await request(app).get("/lote-query?tipo=terreno");
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toMatch(/numLote es obligatorio/);
  });

  test("Debe devolver 400 si direccion faltante para otro tipo", async () => {
    const res = await request(app).get("/lote-query?tipo=casa");
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toMatch(/direccion es obligatoria/);
  });

  test("Debe devolver 404 si lote no encontrado por query", async () => {
    Lote.getByNumLoteManzana.mockResolvedValue(null);
    const res = await request(app).get("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(404);
  });

  test("Debe devolver lote encontrado por query tipo terreno", async () => {
    const fakeLote = { id_propiedad: 1 };
    Lote.getByNumLoteManzana.mockResolvedValue(fakeLote);
    const res = await request(app).get("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(200);
    expect(res.body.lote).toEqual(fakeLote);
  });

  test("Debe devolver lote encontrado por query tipo otro", async () => {
    const fakeLote = { id_propiedad: 2 };
    Lote.getByDireccion.mockResolvedValue(fakeLote);
    const res = await request(app).get("/lote-query?tipo=casa&direccion=Calle+1");
    expect(res.statusCode).toBe(200);
    expect(res.body.lote).toEqual(fakeLote);
  });

  test("Debe manejar error en getLote", async () => {
    Lote.getByNumLoteManzana.mockRejectedValue(new Error("DB Error"));
    const res = await request(app).get("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(500);
  });

  // ---------- UPDATE BY QUERY ----------
  test("Debe devolver 404 si lote no encontrado al actualizar por query", async () => {
    Lote.getByNumLoteManzana.mockResolvedValue(null);
    const res = await request(app)
      .put("/lote-query?tipo=terreno&numLote=1")
      .send({ nombre: "Nuevo" });
    expect(res.statusCode).toBe(404);
  });

  test("Debe actualizar lote por query con req.file", async () => {
    const lote = { id_propiedad: 1 };
    Lote.getByNumLoteManzana.mockResolvedValue(lote);
    Lote.update.mockResolvedValue({ ...lote, nombre: "Nuevo" });

    const res = await request(app)
      .put("/lote-query?tipo=terreno&numLote=1")
      .send({ nombre: "Nuevo" });
    expect(res.statusCode).toBe(200);
    expect(res.body.lote.nombre).toBe("Nuevo");
  });

  test("Debe manejar error en updateLoteByQuery", async () => {
    Lote.getByNumLoteManzana.mockResolvedValue({ id_propiedad: 1 });
    Lote.update.mockRejectedValue(new Error("DB Error"));
    const res = await request(app)
      .put("/lote-query?tipo=terreno&numLote=1")
      .send({ nombre: "Nuevo" });
    expect(res.statusCode).toBe(500);
  });

  // ---------- DELETE BY QUERY ----------
  test("Debe devolver 404 si lote no encontrado al eliminar por query", async () => {
    Lote.getByNumLoteManzana.mockResolvedValue(null);
    const res = await request(app).delete("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(404);
  });

  test("Debe eliminar lote por query", async () => {
    const lote = { id_propiedad: 1 };
    Lote.getByNumLoteManzana.mockResolvedValue(lote);
    Lote.delete.mockResolvedValue(lote);

    const res = await request(app).delete("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(200);
    expect(res.body.lote).toEqual(lote);
  });

  test("Debe manejar error en deleteLoteByQuery", async () => {
    Lote.getByNumLoteManzana.mockResolvedValue({ id_propiedad: 1 });
    Lote.delete.mockRejectedValue(new Error("DB Error"));
    const res = await request(app).delete("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(500);
  });

  // ---------- UPDATE BY ID ----------
  test("Debe actualizar lote por ID", async () => {
    const lote = { id_propiedad: 1 };
    Lote.update.mockResolvedValue({ ...lote, nombre: "Actualizado" });

    const res = await request(app)
      .put("/lote/1")
      .send({ nombre: "Actualizado" });
    expect(res.statusCode).toBe(200);
    expect(res.body.nombre).toBe("Actualizado");
  });

  test("Debe manejar error en updateLote", async () => {
    Lote.update.mockRejectedValue(new Error("DB Error"));
    const res = await request(app).put("/lote/1").send({ nombre: "Nuevo" });
    expect(res.statusCode).toBe(500);
  });

  // ---------- DELETE BY ID ----------
  test("Debe eliminar lote por ID", async () => {
    const lote = { id_propiedad: 1 };
    Lote.delete.mockResolvedValue(lote);

    const res = await request(app).delete("/lote/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(lote);
  });

  test("Debe manejar error en deleteLote", async () => {
    Lote.delete.mockRejectedValue(new Error("DB Error"));
    const res = await request(app).delete("/lote/1");
    expect(res.statusCode).toBe(500);
  });
});
