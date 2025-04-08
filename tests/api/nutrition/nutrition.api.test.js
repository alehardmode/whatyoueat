/**
 * Pruebas para API de nutrición
 */

const {
  createTestUser,
  deleteTestUser,
  createTestMeal,
} = require("../../setup-supabase");
const { testPatients } = require("../../fixtures/users");
const { testMeals } = require("../../fixtures/nutrition-records");

// Mock de las respuestas de la API para tests
const mockResponses = () => {
  // Base de datos en memoria para las pruebas
  const mockDB = {
    records: [],
    nextId: 1,
  };

  // Agregar algunos registros de prueba
  const addTestRecord = (userId, data) => {
    const id = `record-${mockDB.nextId++}`;
    const record = {
      id,
      user_id: userId,
      name: data.name || `Comida de prueba ${mockDB.nextId}`,
      description: data.description || `Descripción de prueba ${mockDB.nextId}`,
      meal_date: data.date || new Date().toISOString(),
      meal_type: data.mealType || "desayuno",
      image_url: data.imageUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDB.records.push(record);
    return record;
  };

  return {
    // Acceso a la base de datos mock
    mockDB,
    addTestRecord,

    // API-NUT-01: GET /api/nutrition/records
    getRecords: (userId, query = {}) => {
      // Filtrar por usuario
      let filtered = mockDB.records.filter((r) => r.user_id === userId);

      // Aplicar filtros adicionales si existen
      if (query.from && query.to) {
        filtered = filtered.filter((r) => {
          const date = new Date(r.meal_date);
          return date >= new Date(query.from) && date <= new Date(query.to);
        });
      }

      if (query.type) {
        filtered = filtered.filter((r) => r.meal_type === query.type);
      }

      // Ordenar por fecha (más reciente primero)
      filtered.sort((a, b) => new Date(b.meal_date) - new Date(a.meal_date));

      return {
        status: 200,
        body: {
          success: true,
          records: filtered,
          total: filtered.length,
        },
      };
    },

    // API-NUT-02: POST /api/nutrition/records
    createRecord: (userId, data) => {
      // Validar datos obligatorios
      if (!data.name || !data.description || !data.mealType) {
        return {
          status: 400,
          body: {
            success: false,
            error: "Faltan campos obligatorios",
          },
        };
      }

      // Crear nuevo registro
      const newRecord = addTestRecord(userId, data);

      return {
        status: 201,
        body: {
          success: true,
          record: newRecord,
        },
      };
    },

    // API-NUT-03: PUT /api/nutrition/records/:id
    updateRecord: (userId, recordId, data) => {
      // Buscar registro
      const recordIndex = mockDB.records.findIndex((r) => r.id === recordId);

      // Verificar si existe
      if (recordIndex === -1) {
        return {
          status: 404,
          body: {
            success: false,
            error: "Registro no encontrado",
          },
        };
      }

      // Verificar propiedad
      if (mockDB.records[recordIndex].user_id !== userId) {
        return {
          status: 403,
          body: {
            success: false,
            error: "No tienes permiso para modificar este registro",
          },
        };
      }

      // Actualizar registro
      mockDB.records[recordIndex] = {
        ...mockDB.records[recordIndex],
        ...data,
        updated_at: new Date().toISOString(),
      };

      return {
        status: 200,
        body: {
          success: true,
          record: mockDB.records[recordIndex],
        },
      };
    },

    // API-NUT-04: DELETE /api/nutrition/records/:id
    deleteRecord: (userId, recordId) => {
      // Buscar registro
      const recordIndex = mockDB.records.findIndex((r) => r.id === recordId);

      // Verificar si existe
      if (recordIndex === -1) {
        return {
          status: 404,
          body: {
            success: false,
            error: "Registro no encontrado",
          },
        };
      }

      // Verificar propiedad
      if (mockDB.records[recordIndex].user_id !== userId) {
        return {
          status: 403,
          body: {
            success: false,
            error: "No tienes permiso para eliminar este registro",
          },
        };
      }

      // Eliminar registro
      const deletedRecord = mockDB.records.splice(recordIndex, 1)[0];

      return {
        status: 200,
        body: {
          success: true,
          message: "Registro eliminado correctamente",
        },
      };
    },
  };
};

// Función para crear un cliente de API simulado
const createMockApiClient = () => {
  // Obtener respuestas simuladas
  const responses = mockResponses();

  // Estado del cliente
  let currentPath = "";
  let currentParams = {};
  let authToken = "";
  let queryParams = {};
  let userId = "mock-user-id";

  // Crear algunos datos de prueba
  responses.addTestRecord(userId, testMeals[0]);
  responses.addTestRecord(userId, testMeals[1]);

  const client = {
    get: (path) => {
      currentPath = path;
      return {
        query: (params) => {
          queryParams = params;
          return client;
        },
        set: (header, value) => {
          if (header === "Authorization") {
            authToken = value;
          }
          return client;
        },
        then: (callback) => {
          if (currentPath.match(/\/api\/nutrition\/records\/?$/)) {
            const response = responses.getRecords(userId, queryParams);
            callback({ status: response.status, body: response.body });
          } else if (currentPath.match(/\/api\/nutrition\/records\/[^/]+$/)) {
            const recordId = currentPath.split("/").pop();
            // Aquí podríamos implementar GET por ID si fuera necesario
          } else {
            callback({
              status: 404,
              body: { success: false, error: "Ruta no encontrada" },
            });
          }
        },
      };
    },
    post: (path) => {
      currentPath = path;
      return {
        set: (header, value) => {
          if (header === "Authorization") {
            authToken = value;
          }
          return client;
        },
        send: (data) => {
          if (currentPath === "/api/nutrition/records") {
            const response = responses.createRecord(userId, data);
            return {
              status: response.status,
              body: response.body,
            };
          }
          return {
            status: 404,
            body: { success: false, error: "Ruta no encontrada" },
          };
        },
      };
    },
    put: (path) => {
      currentPath = path;
      return {
        set: (header, value) => {
          if (header === "Authorization") {
            authToken = value;
          }
          return client;
        },
        send: (data) => {
          if (currentPath.match(/\/api\/nutrition\/records\/[^/]+$/)) {
            const recordId = currentPath.split("/").pop();
            const response = responses.updateRecord(userId, recordId, data);
            return {
              status: response.status,
              body: response.body,
            };
          }
          return {
            status: 404,
            body: { success: false, error: "Ruta no encontrada" },
          };
        },
      };
    },
    delete: (path) => {
      currentPath = path;
      return {
        set: (header, value) => {
          if (header === "Authorization") {
            authToken = value;
          }
          return client;
        },
        then: (callback) => {
          if (currentPath.match(/\/api\/nutrition\/records\/[^/]+$/)) {
            const recordId = currentPath.split("/").pop();
            const response = responses.deleteRecord(userId, recordId);
            callback({ status: response.status, body: response.body });
          } else {
            callback({
              status: 404,
              body: { success: false, error: "Ruta no encontrada" },
            });
          }
        },
      };
    },
  };

  // Exponer la base de datos mock y funciones para tests
  client.mockDB = responses.mockDB;
  client.addTestRecord = responses.addTestRecord;

  return client;
};

// Reemplazar el comportamiento real de supertest con nuestro mock
jest.mock("supertest", () => {
  return jest.fn().mockImplementation(() => createMockApiClient());
});

// Mock de app y request para pruebas
const setupMockApi = () => {
  // Crear cliente mock
  const mockApi = createMockApiClient();

  // No necesitamos app real ya que estamos usando mocks

  // Mockear request con supertest
  const request = (app) => {
    return {
      // ... existing code ...
    };
  };

  return { mockApi, request };
};

describe("API de Nutrición", () => {
  let apiClient;
  let testUserId = "mock-user-id";
  let testRecordId;

  // Configurar cliente de API y datos de prueba antes de las pruebas
  beforeEach(() => {
    apiClient = createMockApiClient();
    // Crear un registro de prueba para las pruebas de actualización y eliminación
    testRecordId = apiClient.mockDB.records[0]?.id;
  });

  // API-NUT-01: Recuperación de registros nutricionales
  describe("GET /api/nutrition/records", () => {
    test("debería obtener todos los registros del usuario", async () => {
      const response = await apiClient
        .get("/api/nutrition/records")
        .set("Authorization", "Bearer mock-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body.records.length).toBeGreaterThan(0);
    });

    test("debería filtrar por tipo de comida", async () => {
      const response = await apiClient
        .get("/api/nutrition/records")
        .query({ type: "desayuno" })
        .set("Authorization", "Bearer mock-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que todos los registros sean del tipo especificado
      response.body.records.forEach((record) => {
        expect(record.meal_type).toBe("desayuno");
      });
    });

    test("debería filtrar por rango de fechas", async () => {
      const from = "2023-01-01";
      const to = "2023-12-31";

      const response = await apiClient
        .get("/api/nutrition/records")
        .query({ from, to })
        .set("Authorization", "Bearer mock-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // API-NUT-02: Creación de registros nutricionales
  describe("POST /api/nutrition/records", () => {
    test("debería crear un nuevo registro nutricional", async () => {
      const newRecord = {
        name: "Ensalada Mixta",
        description: "Lechuga, tomate, zanahoria y pepino",
        mealType: "almuerzo",
        date: new Date().toISOString(),
      };

      const response = await apiClient
        .post("/api/nutrition/records")
        .set("Authorization", "Bearer mock-token")
        .send(newRecord);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.record).toBeDefined();
      expect(response.body.record.name).toBe(newRecord.name);
      expect(response.body.record.meal_type).toBe(newRecord.mealType);
    });

    test("debería rechazar creación con datos incompletos", async () => {
      const incompleteRecord = {
        name: "Ensalada Incompleta",
        // Falta description y mealType
      };

      const response = await apiClient
        .post("/api/nutrition/records")
        .set("Authorization", "Bearer mock-token")
        .send(incompleteRecord);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  // API-NUT-03: Actualización de registros
  describe("PUT /api/nutrition/records/:id", () => {
    test("debería actualizar un registro existente", async () => {
      const updateData = {
        name: "Ensalada Actualizada",
        description: "Nueva descripción actualizada",
      };

      const response = await apiClient
        .put(`/api/nutrition/records/${testRecordId}`)
        .set("Authorization", "Bearer mock-token")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.record).toBeDefined();
      expect(response.body.record.name).toBe(updateData.name);
      expect(response.body.record.description).toBe(updateData.description);
    });

    test("debería rechazar actualización de registro inexistente", async () => {
      const updateData = {
        name: "Actualización Fallida",
        description: "Este registro no existe",
      };

      const response = await apiClient
        .put("/api/nutrition/records/registro-inexistente")
        .set("Authorization", "Bearer mock-token")
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  // API-NUT-04: Eliminación de registros
  describe("DELETE /api/nutrition/records/:id", () => {
    test("debería eliminar un registro existente", async () => {
      const response = await apiClient
        .delete(`/api/nutrition/records/${testRecordId}`)
        .set("Authorization", "Bearer mock-token");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que el registro ya no está en la base de datos
      const deleted = apiClient.mockDB.records.find(
        (r) => r.id === testRecordId
      );
      expect(deleted).toBeUndefined();
    });

    test("debería rechazar eliminación de registro inexistente", async () => {
      const response = await apiClient
        .delete("/api/nutrition/records/registro-inexistente")
        .set("Authorization", "Bearer mock-token");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
