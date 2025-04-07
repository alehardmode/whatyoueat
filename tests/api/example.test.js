const { describe, it, expect } = require("@jest/globals");

// Mock para simular respuestas HTTP
const createMockApi = () => {
  return {
    get: jest.fn().mockImplementation((path) => {
      if (path === "/") {
        return Promise.resolve({
          status: 200,
          data: { message: "API funcionando correctamente" },
        });
      } else if (path === "/ruta-que-no-existe") {
        return Promise.resolve({
          status: 404,
          data: { error: "Ruta no encontrada" },
        });
      }
      return Promise.resolve({ status: 200, data: {} });
    }),
    post: jest.fn().mockImplementation((path, data) => {
      return Promise.resolve({
        status: 201,
        data: { success: true, ...data },
      });
    }),
  };
};

// Asignar el mock a global.api
global.api = createMockApi();

describe("Ejemplo de prueba de API", () => {
  it("debería responder con código 200 en la ruta principal", async () => {
    const response = await global.api.get("/");
    expect(response.status).toBe(200);
  });

  it("debería responder con código 404 en una ruta que no existe", async () => {
    const response = await global.api.get("/ruta-que-no-existe");
    expect(response.status).toBe(404);
  });
});
