/**
 * Pruebas unitarias para el módulo UserAuth
 */

const { createTestUser, deleteTestUser } = require("../../setup-supabase");
const { testPatients, testDoctors } = require("../../fixtures/users");

// Determinar si usar mocks o BD real
const USE_MOCKS = true;

// Crear un mock de cliente Supabase para tests
const createMockSupabaseClient = () => {
  // Base de datos mock para almacenar usuarios
  const mockDB = {
    users: [],
    profiles: [],
  };

  // Añadir algunos usuarios de prueba
  mockDB.users.push({
    id: "test-patient-id-123",
    email: testPatients[0].email,
    password: testPatients[0].password,
    role: "paciente",
  });

  mockDB.users.push({
    id: "test-doctor-id-456",
    email: testDoctors[0].email,
    password: testDoctors[0].password,
    role: "medico",
  });

  // También añadir a profiles
  mockDB.profiles.push({
    id: "test-patient-id-123",
    name: testPatients[0].name,
    email: testPatients[0].email,
    role: "paciente",
  });

  mockDB.profiles.push({
    id: "test-doctor-id-456",
    name: testDoctors[0].name,
    email: testDoctors[0].email,
    role: "medico",
  });

  // Simulación de cliente Supabase
  return {
    from: jest.fn().mockImplementation((table) => {
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockImplementation((data) => {
          if (table === "profiles") {
            mockDB.profiles.push(data);
            return { data, error: null };
          }
          return { data, error: null };
        }),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          if (table === "profiles") {
            return { data: mockDB.profiles[0], error: null };
          }
          return { data: {}, error: null };
        }),
        // Función para obtener por email
        match: jest.fn().mockImplementation((field, value) => {
          if (table === "profiles" && field === "email") {
            const found = mockDB.profiles.find((p) => p.email === value);
            return {
              data: found ? [found] : [],
              error: null,
              single: () => ({
                data: found || null,
                error: null,
              }),
            };
          }
          return {
            data: [],
            error: null,
            single: () => ({ data: null, error: null }),
          };
        }),
      };
    }),
    auth: {
      signUp: jest.fn().mockImplementation(({ email, password }) => {
        // Verificar si el correo ya está en uso
        const exists = mockDB.users.some((u) => u.email === email);
        if (exists) {
          return {
            data: null,
            error: { message: "El correo ya está registrado" },
          };
        }

        // Crear nuevo usuario
        const newUser = {
          id: `user-${Date.now()}`,
          email,
          password,
        };
        mockDB.users.push(newUser);

        return {
          data: { user: newUser },
          error: null,
        };
      }),
      signInWithPassword: jest
        .fn()
        .mockImplementation(({ email, password }) => {
          // Buscar usuario por email y password
          const user = mockDB.users.find(
            (u) => u.email === email && u.password === password
          );

          if (user) {
            return {
              data: { user },
              error: null,
            };
          } else {
            return {
              data: null,
              error: { message: "Credenciales inválidas" },
            };
          }
        }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockImplementation(() => {
        return {
          data: { user: mockDB.users[0] || null },
          error: null,
        };
      }),
      resetPasswordForEmail: jest.fn().mockImplementation((email) => {
        const exists = mockDB.users.some((u) => u.email === email);
        return {
          data: {},
          error: exists ? null : { message: "Usuario no encontrado" },
        };
      }),
    },
  };
};

// Configurar el mock de Supabase
let mockSupabaseClient;
if (USE_MOCKS) {
  mockSupabaseClient = createMockSupabaseClient();

  // Mock del módulo de Supabase
  jest.mock("../../../config/supabase", () => ({
    supabase: mockSupabaseClient,
  }));
}

// Importar el módulo después del mock
const UserAuth = require("../../../models/UserAuth");

describe("UserAuth", () => {
  let testPatientId;
  let testDoctorId;

  // Configurar datos iniciales antes de las pruebas
  beforeAll(() => {
    if (USE_MOCKS) {
      // Crear usuarios de prueba en el mock
      const patientUser = mockSupabaseClient
        .from("profiles")
        .insert({
          id: "test-patient-id-123",
          name: testPatients[0].name,
          email: testPatients[0].email,
          role: "paciente",
        })
        .returning("*");
      testPatientId = patientUser.data.id;

      const doctorUser = mockSupabaseClient
        .from("profiles")
        .insert({
          id: "test-doctor-id-456",
          name: testDoctors[0].name,
          email: testDoctors[0].email,
          role: "medico",
        })
        .returning("*");
      testDoctorId = doctorUser.data.id;

      console.log("Usuarios de prueba creados en mock:", {
        testPatientId,
        testDoctorId,
      });
    }
  });

  // Limpiar después de las pruebas
  afterAll(() => {
    if (USE_MOCKS) {
      // Resetear la base de datos mock
      mockSupabaseClient.resetDatabase();
    }
  });

  // Prueba de registro
  describe("register", () => {
    let newUserId;

    test("debería registrar un nuevo paciente exitosamente", async () => {
      // Generar email único para evitar conflictos
      const uniqueEmail = `test.${Date.now()}@example.com`;

      const result = await UserAuth.register(
        "Nuevo Paciente",
        uniqueEmail,
        "password123",
        "paciente"
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(uniqueEmail);
      expect(result.user.role).toBe("paciente");
    });

    test("debería registrar un nuevo médico exitosamente", async () => {
      // Generar email único para evitar conflictos
      const uniqueEmail = `medico.${Date.now()}@example.com`;

      const result = await UserAuth.register(
        "Nuevo Médico",
        uniqueEmail,
        "password123",
        "medico"
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(uniqueEmail);
      expect(result.user.role).toBe("medico");
    });

    test("debería rechazar registro con un correo ya existente", async () => {
      // Usar email de usuario de prueba ya creado
      const existingEmail = testPatients[0].email;

      const result = await UserAuth.register(
        "Usuario Duplicado",
        existingEmail,
        "password123",
        "paciente"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("debería rechazar registro con rol inválido", async () => {
      const result = await UserAuth.register(
        "Usuario Rol Inválido",
        "rol.invalido@example.com",
        "password123",
        "rol_invalido" // Rol que no es ni paciente ni médico
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // Prueba de inicio de sesión
  describe("login", () => {
    test("debería iniciar sesión con credenciales correctas", async () => {
      const result = await UserAuth.login(
        testPatients[0].email,
        testPatients[0].password
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testPatients[0].email);
      expect(result.user.role).toBe("paciente");
    });

    test("debería rechazar inicio de sesión con contraseña incorrecta", async () => {
      const result = await UserAuth.login(
        testPatients[0].email,
        "contraseña_incorrecta"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("debería rechazar inicio de sesión para usuario inexistente", async () => {
      const result = await UserAuth.login(
        "no.existe@example.com",
        "password123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // Prueba de cierre de sesión
  describe("logout", () => {
    test("debería cerrar sesión correctamente", async () => {
      const result = await UserAuth.logout();

      expect(result.success).toBe(true);
    });
  });

  // Prueba de verificación de correo existente
  describe("checkEmailExists", () => {
    test("debería confirmar que un correo existe", async () => {
      const result = await UserAuth.checkEmailExists(testPatients[0].email);

      expect(result.exists).toBe(true);
    });

    test("debería confirmar que un correo no existe", async () => {
      const result = await UserAuth.checkEmailExists("no.existe@example.com");

      expect(result.exists).toBe(false);
    });
  });

  // Prueba de restablecimiento de contraseña
  describe("resetPassword", () => {
    test("debería enviar correo de restablecimiento para usuario existente", async () => {
      const result = await UserAuth.resetPassword(testPatients[0].email);

      expect(result.success).toBe(true);
    });

    test("debería manejar correctamente una solicitud para email inexistente", async () => {
      const result = await UserAuth.resetPassword("no.existe@example.com");

      // Por seguridad, debería decir que fue exitoso incluso si el email no existe
      expect(result.success).toBe(true);
    });
  });
});
