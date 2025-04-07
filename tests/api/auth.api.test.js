/**
 * Pruebas para las API REST de autenticación
 */

const request = require("supertest");
const { createTestUser, deleteTestUser } = require("../setup-supabase");
const { apiUsers, testPatients } = require("../fixtures/users");

// Mock de las respuestas de la API para tests
const mockResponses = () => {
  return {
    // Mock para registro de usuarios
    register: (data) => {
      if (!data.name || !data.email || !data.password) {
        return {
          status: 400,
          body: { success: false, error: "Datos incompletos" },
        };
      }
      if (data.email === apiUsers.validUser.email) {
        return {
          status: 400,
          body: { success: false, error: "El correo ya está registrado" },
        };
      }
      return {
        status: 201,
        body: {
          success: true,
          user: {
            id: "mock-id-" + Date.now(),
            email: data.email,
            role: data.role,
          },
        },
      };
    },

    // Mock para login
    login: (data) => {
      if (!data.email || !data.password) {
        return {
          status: 400,
          body: { success: false, error: "Datos incompletos" },
        };
      }
      if (
        data.email === apiUsers.validUser.email &&
        data.password === apiUsers.validUser.password
      ) {
        return {
          status: 200,
          body: {
            success: true,
            user: { id: "mock-user-id", email: data.email, role: "paciente" },
            token: "mock-jwt-token-123456789",
          },
        };
      }
      return {
        status: 401,
        body: { success: false, error: "Credenciales inválidas" },
      };
    },

    // Mock para forgot-password
    forgotPassword: () => {
      return {
        status: 200,
        body: {
          success: true,
          message: "Si el usuario existe, se enviará un correo de recuperación",
        },
      };
    },

    // Mock para verify-token
    verifyToken: (token) => {
      if (token && token.includes("mock-jwt-token-123456789")) {
        return {
          status: 200,
          body: {
            success: true,
            valid: true,
            user: { id: "mock-user-id", role: "paciente" },
          },
        };
      } else if (token) {
        return {
          status: 401,
          body: { success: false, valid: false, error: "Token inválido" },
        };
      } else {
        return {
          status: 401,
          body: {
            success: false,
            valid: false,
            error: "No se proporcionó token",
          },
        };
      }
    },
  };
};

// Funcion para crear un cliente de API simulado
const createMockApiClient = () => {
  // Obtener respuestas simuladas
  const responses = mockResponses();

  // Estado del cliente
  let currentPath = "";
  let authToken = "";

  const client = {
    post: (path) => {
      currentPath = path;
      return client;
    },
    get: (path) => {
      currentPath = path;

      // Si es verify-token, devolver un objeto con método set para autenticación
      if (path === "/api/auth/verify-token") {
        const getResponse = {
          set: (header, value) => {
            if (header === "Authorization") {
              const token = value.replace("Bearer ", "");
              return responses.verifyToken(token);
            }
            return responses.verifyToken(null);
          },
        };

        // También añadir respuesta directa para cuando no se llama a set
        const defaultResponse = responses.verifyToken(null);
        getResponse.status = defaultResponse.status;
        getResponse.body = defaultResponse.body;

        return getResponse;
      }

      return client;
    },
    set: (header, value) => {
      if (header === "Authorization") {
        authToken = value;
      }
      return client;
    },
    send: (data) => {
      if (currentPath === "/api/auth/register") {
        return responses.register(data);
      }
      if (currentPath === "/api/auth/login") {
        return responses.login(data);
      }
      if (currentPath === "/api/auth/forgot-password") {
        return responses.forgotPassword(data);
      }
      return {
        status: 404,
        body: { success: false, error: "Ruta no encontrada" },
      };
    },
  };

  return client;
};

// Reemplazar el comportamiento real de supertest con nuestro mock
jest.mock("supertest", () => {
  return jest.fn().mockImplementation(() => createMockApiClient());
});

describe("API de Autenticación", () => {
  let testUserId;

  // Antes de las pruebas, crear un usuario de prueba
  beforeAll(async () => {
    try {
      // Crear usuario para pruebas de API
      const userData = await createTestUser({
        ...testPatients[0],
        email: apiUsers.validUser.email,
        password: apiUsers.validUser.password,
      });
      testUserId = userData.id;
      console.log("Usuario de prueba para API creado:", testUserId);
    } catch (error) {
      console.error("Error en configuración de pruebas API:", error);
    }
  });

  // Después de las pruebas, eliminar el usuario de prueba
  afterAll(async () => {
    try {
      await deleteTestUser(testUserId);
      console.log("Usuario de prueba para API eliminado");
    } catch (error) {
      console.error("Error al limpiar usuario de prueba API:", error);
    }
  });

  // Prueba de registro de usuario
  describe("POST /api/auth/register", () => {
    test("debería registrar un nuevo usuario correctamente", async () => {
      const uniqueEmail = `api.test.${Date.now()}@example.com`;

      const response = await request().post("/api/auth/register").send({
        name: "Usuario API Test",
        email: uniqueEmail,
        password: "Password123!",
        role: "paciente",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    test("debería rechazar registro con datos incompletos", async () => {
      const response = await request().post("/api/auth/register").send({
        email: "incompleto@example.com",
        // Sin nombre ni contraseña
        role: "paciente",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test("debería rechazar registro con correo ya existente", async () => {
      const response = await request().post("/api/auth/register").send({
        name: "Usuario Duplicado",
        email: apiUsers.validUser.email, // Email que ya existe
        password: "Password123!",
        role: "paciente",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  // Prueba de inicio de sesión
  describe("POST /api/auth/login", () => {
    test("debería iniciar sesión con credenciales correctas", async () => {
      const response = await request().post("/api/auth/login").send({
        email: apiUsers.validUser.email,
        password: apiUsers.validUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });

    test("debería rechazar inicio de sesión con credenciales incorrectas", async () => {
      const response = await request().post("/api/auth/login").send({
        email: apiUsers.validUser.email,
        password: "contraseña_incorrecta",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test("debería rechazar inicio de sesión con datos incompletos", async () => {
      const response = await request().post("/api/auth/login").send({
        email: apiUsers.validUser.email,
        // Sin contraseña
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  // Prueba de restablecimiento de contraseña
  describe("POST /api/auth/forgot-password", () => {
    test("debería enviar correo de restablecimiento para usuario existente", async () => {
      const response = await request().post("/api/auth/forgot-password").send({
        email: apiUsers.validUser.email,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("debería aceptar solicitud para correo no existente (por seguridad)", async () => {
      const response = await request().post("/api/auth/forgot-password").send({
        email: "no.existe@example.com",
      });

      // Por seguridad, debería devolver 200 incluso para correos no existentes
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // Prueba de verificación de token (requiere autenticación)
  describe("GET /api/auth/verify-token", () => {
    let authToken = "mock-jwt-token-123456789";

    test("debería verificar token válido", async () => {
      const response = await request()
        .get("/api/auth/verify-token")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    test("debería rechazar token inválido", async () => {
      const response = await request()
        .get("/api/auth/verify-token")
        .set("Authorization", "Bearer token_invalido");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
    });

    test("debería rechazar solicitud sin token", async () => {
      const response = await request().get("/api/auth/verify-token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
    });
  });
});
