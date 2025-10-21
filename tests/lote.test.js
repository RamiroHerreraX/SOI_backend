// tests/loteController.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const LoteController = require("../src/controllers/loteController");
const Lote = require("../src/models/loteModel");

jest.mock("../src/models/loteModel");

const app = express();
app.use(bodyParser.json());

// Endpoints
app.get("/lotes", LoteController.getAllLotes);
app.get("/lote/:id", LoteController.getLoteById);
app.post("/lote", LoteController.createLote);
app.get("/lote-query", LoteController.getLote);
app.put("/lote-query", LoteController.updateLoteByQuery);
app.delete("/lote-query", LoteController.deleteLoteByQuery);
app.put("/lote/:id", LoteController.updateLote);
app.delete("/lote/:id", LoteController.deleteLote);

describe("🏠 LoteController", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------- GET ALL ----------
  test("Debe devolver lista de lotes", async () => {
    const fakeLotes = [{ id_propiedad: 1, nombre: "Lote1" }];
    Lote.getAll.mockResolvedValueOnce(fakeLotes);

    const res = await request(app).get("/lotes");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeLotes);
  });

  // ---------- GET BY ID ----------
  test("Debe devolver 404 si lote no encontrado", async () => {
    Lote.getById.mockResolvedValueOnce(null);
    const res = await request(app).get("/lote/1");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Lote no encontrado");
  });

  test("Debe devolver lote por ID", async () => {
    const fakeLote = { id_propiedad: 1, nombre: "Lote1" };
    Lote.getById.mockResolvedValueOnce(fakeLote);

    const res = await request(app).get("/lote/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeLote);
  });

  // ---------- GET LOTE POR QUERY ----------
  test("Debe devolver 400 si tipo no provisto", async () => {
    const res = await request(app).get("/lote-query");
    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toBe("El campo tipo es obligatorio");
  });

  test("Debe devolver 404 si lote no encontrado por query", async () => {
    Lote.getByNumLoteManzana.mockResolvedValueOnce(null);
    const res = await request(app).get("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(404);
    expect(res.body.msg).toBe("Lote no encontrado");
  });

  test("Debe devolver lote encontrado por query", async () => {
    const fakeLote = { id_propiedad: 1, nombre: "Lote1" };
    Lote.getByNumLoteManzana.mockResolvedValueOnce(fakeLote);

    const res = await request(app).get("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(200);
    expect(res.body.lote).toEqual(fakeLote);
  });

  // ---------- CREATE ----------
  test("Debe devolver 400 si hay errores de validación", async () => {
    const res = await request(app).post("/lote").send({ tipo: "invalid" });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toBe("Errores de validación");
  });

  test("Debe crear lote correctamente", async () => {
    const fakeLote = { id_propiedad: 1, tipo: "casa" };
    Lote.create.mockResolvedValueOnce(fakeLote);

    const res = await request(app)
      .post("/lote")
      .send({
        tipo: "casa",
        numLote: "A1",
        direccion: "Calle 1",
        superficie_m2: 100,
        precio: 500000,
        estado_propiedad: "disponible"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(fakeLote);
  });

  // ---------- UPDATE BY QUERY ----------
  test("Debe devolver 404 si lote no encontrado al actualizar", async () => {
    Lote.getByNumLoteManzana.mockResolvedValueOnce(null);
    const res = await request(app)
      .put("/lote-query?tipo=terreno&numLote=1")
      .send({ nombre: "Nuevo" });
    expect(res.statusCode).toBe(404);
    expect(res.body.msg).toBe("Lote no encontrado");
  });

  test("Debe actualizar lote por query", async () => {
    const fakeLote = { id_propiedad: 1, nombre: "Lote1" };
    Lote.getByNumLoteManzana.mockResolvedValueOnce(fakeLote);
    Lote.update.mockResolvedValueOnce({ ...fakeLote, nombre: "Nuevo" });

    const res = await request(app)
      .put("/lote-query?tipo=terreno&numLote=1")
      .send({ nombre: "Nuevo" });

    expect(res.statusCode).toBe(200);
    expect(res.body.lote.nombre).toBe("Nuevo");
  });

  // ---------- DELETE BY QUERY ----------
  test("Debe devolver 404 si lote no encontrado al eliminar", async () => {
    Lote.getByNumLoteManzana.mockResolvedValueOnce(null);
    const res = await request(app).delete("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(404);
    expect(res.body.msg).toBe("Lote no encontrado");
  });

  test("Debe eliminar lote por query", async () => {
    const fakeLote = { id_propiedad: 1, nombre: "Lote1" };
    Lote.getByNumLoteManzana.mockResolvedValueOnce(fakeLote);
    Lote.delete.mockResolvedValueOnce(fakeLote);

    const res = await request(app).delete("/lote-query?tipo=terreno&numLote=1");
    expect(res.statusCode).toBe(200);
    expect(res.body.lote).toEqual(fakeLote);
  });

  // ---------- UPDATE BY ID ----------
  test("Debe actualizar lote por ID", async () => {
    const fakeLote = { id_propiedad: 1, nombre: "Lote1" };
    Lote.update.mockResolvedValueOnce({ ...fakeLote, nombre: "Actualizado" });

    const res = await request(app)
      .put("/lote/1")
      .send({ nombre: "Actualizado" });

    expect(res.statusCode).toBe(200);
    expect(res.body.nombre).toBe("Actualizado");
  });

  // ---------- DELETE BY ID ----------
  test("Debe eliminar lote por ID", async () => {
    const fakeLote = { id_propiedad: 1, nombre: "Lote1" };
    Lote.delete.mockResolvedValueOnce(fakeLote);

    const res = await request(app).delete("/lote/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeLote);
  });
});
