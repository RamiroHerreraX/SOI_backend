// tests/userController.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const UserController = require("../src/controllers/userController");
const User = require("../src/models/userModel");

jest.mock("../src/models/userModel");

const app = express();
app.use(bodyParser.json());

app.get("/users", UserController.getUsersByRole);
app.get("/user/:id", UserController.getUserById);
app.post("/user", UserController.createUser);
app.put("/user/:id", UserController.updateUser);
app.delete("/user/:id", UserController.deleteUser);

describe("👤 Pruebas UserController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- GET USERS ----------
  test("Debe devolver todos los usuarios si no se pasa rol", async () => {
    const fakeUsers = [{ id_user: 1, nombre: "Juan" }];
    User.getAll.mockResolvedValueOnce(fakeUsers);

    const res = await request(app).get("/users");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeUsers);
  });

  test("Debe devolver usuarios por rol", async () => {
    const fakeUsers = [{ id_user: 2, nombre: "Ana", rol: "encargado" }];
    User.getByRole.mockResolvedValueOnce(fakeUsers);

    const res = await request(app).get("/users?rol=encargado");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeUsers);
  });

  // ---------- GET USER BY ID ----------
  test("Debe devolver 404 si usuario no encontrado", async () => {
    User.getById.mockResolvedValueOnce(null);

    const res = await request(app).get("/user/1");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Usuario no encontrado");
  });

  test("Debe devolver usuario por ID", async () => {
    const fakeUser = { id_user: 1, nombre: "Juan" };
    User.getById.mockResolvedValueOnce(fakeUser);

    const res = await request(app).get("/user/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeUser);
  });

  // ---------- CREATE USER ----------
  test("Debe devolver 400 si validación falla", async () => {
    User.validate.mockReturnValueOnce({ error: { details: [{ message: "Error" }] } });

    const res = await request(app).post("/user").send({ nombre: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Error");
  });

  test("Debe crear usuario correctamente", async () => {
    const fakeUser = { id_user: 3, nombre: "Pedro" };
    User.validate.mockReturnValueOnce({ error: null });
    User.create.mockResolvedValueOnce(fakeUser);

    const res = await request(app).post("/user").send({ nombre: "Pedro" });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(fakeUser);
  });

  // ---------- UPDATE USER ----------
  test("Debe actualizar usuario correctamente", async () => {
    const fakeUser = { id_user: 1, nombre: "Juan actualizado" };
    User.update.mockResolvedValueOnce(fakeUser);

    const res = await request(app).put("/user/1").send({ nombre: "Juan actualizado" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeUser);
  });

  // ---------- DELETE USER ----------
  test("Debe eliminar usuario correctamente", async () => {
    const fakeUser = { id_user: 1, nombre: "Juan" };
    User.delete.mockResolvedValueOnce(fakeUser);

    const res = await request(app).delete("/user/1");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeUser);
  });
});
