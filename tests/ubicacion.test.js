// tests/ubicacionController.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const ubicacionController = require("../src/controllers/ubicacionController");
const pool = require("../src/db");

jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

// Crear app de prueba
const app = express();
app.use(bodyParser.json());
app.get("/estados", ubicacionController.getEstados);
app.get("/ciudades/:estadoId", ubicacionController.getCiudades);
app.get("/colonias/:ciudadId", ubicacionController.getColonias);
app.get("/cp/:codigoPostal", ubicacionController.getCiudadPorCP);
app.get("/ciudad/:id_ciudad", ubicacionController.getCiudadById);

describe("🌎 Pruebas de UbicacionController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- ESTADOS ----------
  test("Debe devolver 404 si no hay estados", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get("/estados");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No hay estados registrados");
  });

  test("Debe devolver lista de estados", async () => {
    const fakeEstados = [{ id_estado: 1, nombre_estado: "Estado1" }];
    pool.query.mockResolvedValueOnce({ rows: fakeEstados });
    const res = await request(app).get("/estados");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeEstados);
  });

  // ---------- CIUDADES ----------
  test("Debe devolver 400 si estadoId no es numérico", async () => {
    const res = await request(app).get("/ciudades/abc");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("El ID del estado debe ser numérico");
  });

  test("Debe devolver 404 si no hay ciudades", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get("/ciudades/1");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No se encontraron ciudades para este estado");
  });

  test("Debe devolver lista de ciudades", async () => {
    const fakeCiudades = [{ id_ciudad: 1, nombre_ciudad: "Ciudad1" }];
    pool.query.mockResolvedValueOnce({ rows: fakeCiudades });
    const res = await request(app).get("/ciudades/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeCiudades);
  });

  // ---------- COLONIAS ----------
  test("Debe devolver 400 si ciudadId no es numérico", async () => {
    const res = await request(app).get("/colonias/abc");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("El ID de la ciudad debe ser numérico");
  });

  test("Debe devolver 404 si no hay colonias", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get("/colonias/1");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No se encontraron colonias para esta ciudad");
  });

  test("Debe devolver lista de colonias", async () => {
    const fakeColonias = [{ id_colonia: 1, nombre_colonia: "Colonia1", codigo_postal: "12345" }];
    pool.query.mockResolvedValueOnce({ rows: fakeColonias });
    const res = await request(app).get("/colonias/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeColonias);
  });

  // ---------- CÓDIGO POSTAL ----------
  test("Debe devolver 404 si código postal no existe", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get("/cp/12345");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Código postal no encontrado");
  });

  test("Debe devolver ciudad y colonias por código postal", async () => {
    const fakeRows = [
      { id_estado: 1, nombre_estado: "E1", id_ciudad: 10, nombre_ciudad: "C1", id_colonia: 100, nombre_colonia: "Col1", codigo_postal: "12345" },
      { id_estado: 1, nombre_estado: "E1", id_ciudad: 10, nombre_ciudad: "C1", id_colonia: 101, nombre_colonia: "Col2", codigo_postal: "12345" }
    ];
    pool.query.mockResolvedValueOnce({ rows: fakeRows });

    const res = await request(app).get("/cp/12345");
    expect(res.statusCode).toBe(200);
    expect(res.body.colonias.length).toBe(2);
    expect(res.body.nombre_estado).toBe("E1");
  });

  // ---------- CIUDAD POR ID ----------
  test("Debe devolver 400 si id_ciudad no es numérico", async () => {
    const res = await request(app).get("/ciudad/abc");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("El ID de la ciudad debe ser numérico");
  });

  test("Debe devolver 404 si ciudad no encontrada", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get("/ciudad/1");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Ciudad no encontrada");
  });

  test("Debe devolver ciudad por ID", async () => {
    const fakeCiudad = { id_ciudad: 1, nombre_ciudad: "C1", id_estado: 10 };
    pool.query.mockResolvedValueOnce({ rows: [fakeCiudad] });
    const res = await request(app).get("/ciudad/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeCiudad);
  });
});
