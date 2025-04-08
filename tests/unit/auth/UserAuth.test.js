/**
 * Pruebas unitarias para UserAuth
 */

// Mock del módulo de Supabase antes de importar las dependencias
jest.mock("../../../config/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      resend: jest.fn(),
    },
  },
}));

// Importar después del mock para que use la versión simulada
const { supabase } = require("../../../config/supabase");
const UserAuth = require("../../../models/UserAuth");
const { testPatients, testDoctors } = require("../../fixtures/users");
const { v4: uuidv4 } = require("uuid");

// Variable para decidir si usar mocks o base de datos real
const USE_MOCKS = true;

// Crear un mock más completo de la base de datos y cliente de Supabase
const createMockSupabaseClient = () => {
  // Simulamos una base de datos en memoria
  const mockDB = {
    users: [],
    profiles: [],
  };

  // Añadir algunos usuarios de prueba
  const addTestUser = (email, password, role) => {
    const id = uuidv4();
    mockDB.users.push({
      id,
      email,
      password,
      user_metadata: {
        name: email.split("@")[0],
        role,
      },
      email_confirmed_at: new Date().toISOString(),
    });

    mockDB.profiles.push({
      id,
      email,
      name: email.split("@")[0],
      role,
    });

    return id;
  };

  // Añadir algunos perfiles de prueba
  testPatients.forEach((patient) => {
    addTestUser(patient.email, patient.password, "paciente");
  });

  testDoctors.forEach((doctor) => {
    addTestUser(doctor.email, doctor.password, "medico");
  });

  const client = {
    mockDB, // Exponer mockDB para que sea accesible desde fuera
    from: jest.fn().mockImplementation((table) => {
      if (table === "profiles") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockImplementation(() => {
            // Simular búsqueda de perfil
            return { data: mockDB.profiles[0], error: null };
          }),
          insert: jest.fn().mockImplementation((data) => {
            // Simular inserción de perfil
            const newProfile = { ...data, id: uuidv4() };
            mockDB.profiles.push(newProfile);
            return {
              data: [newProfile],
              error: null,
              returning: jest
                .fn()
                .mockReturnValue({ data: [newProfile], error: null }),
            };
          }),
          update: jest.fn().mockImplementation((data) => {
            // Simular actualización de perfil
            return {
              data: [{ ...mockDB.profiles[0], ...data }],
              error: null,
              returning: jest.fn().mockReturnValue({
                data: [{ ...mockDB.profiles[0], ...data }],
                error: null,
              }),
            };
          }),
        };
      }

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockImplementation((data) => {
          return {
            data: [{ ...data, id: uuidv4() }],
            error: null,
            returning: jest.fn().mockReturnValue({
              data: [{ ...data, id: uuidv4() }],
              error: null,
            }),
          };
        }),
        update: jest.fn().mockImplementation((data) => {
          return {
            data: [data],
            error: null,
            returning: jest.fn().mockReturnValue({ data: [data], error: null }),
          };
        }),
      };
    }),
    auth: {
      signUp: jest.fn().mockImplementation(({ email, password, options }) => {
        // Verificar si el correo ya está en uso
        const exists = mockDB.users.some((u) => u.email === email);
        if (exists) {
          return {
            data: {
              user: {
                id: uuidv4(),
                email,
                identities: [], // Identities vacío para simular correo ya registrado
              },
            },
            error: null,
          };
        }

        // Crear nuevo usuario
        const userId = uuidv4();
        const newUser = {
          id: userId,
          email,
          password,
          user_metadata: options?.data || {
            name: email.split("@")[0],
            role: "paciente", // Default role
          },
          identities: [{ id: uuidv4(), provider: "email" }], // Identities con datos para indicar que es un nuevo usuario
          email_confirmed_at: null,
        };
        mockDB.users.push(newUser);

        return {
          data: {
            user: newUser,
            session: null,
          },
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
            // Para el caso específico de checkEmailExists
            if (email === "no.existe@example.com") {
              return {
                data: null,
                error: { message: "User not found", code: "user_not_found" },
              };
            }
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
        // Devolver siempre éxito por razones de seguridad
        return { data: {}, error: null };
      }),
      updateUser: jest.fn().mockImplementation(({ data }) => {
        // Simular actualización de datos de usuario
        if (mockDB.users.length > 0) {
          mockDB.users[0].user_metadata = {
            ...mockDB.users[0].user_metadata,
            ...data,
          };
          return { data: { user: mockDB.users[0] }, error: null };
        }
        return { data: null, error: { message: "Usuario no encontrado" } };
      }),
      resend: jest.fn().mockImplementation(({ type, email }) => {
        // Verificar si el correo existe
        const exists = mockDB.users.some((u) => u.email === email);
        if (!exists && type === "signup") {
          return {
            data: null,
            error: { message: "User not found", code: "user_not_found" },
          };
        }
        return { data: {}, error: null };
      }),
    },
    // Añadir función para resetear la base de datos mock
    resetDatabase: jest.fn().mockImplementation(() => {
      mockDB.users = [];
      mockDB.profiles = [];
    }),
  };

  return client;
};

// Inicializar el mock de Supabase
const mockSupabaseClient = createMockSupabaseClient();

// Reemplazar las implementaciones de Supabase con nuestro mock
Object.keys(supabase.auth).forEach((key) => {
  if (mockSupabaseClient.auth[key]) {
    supabase.auth[key] = mockSupabaseClient.auth[key];
  }
});

// También reemplazar la función from
supabase.from = mockSupabaseClient.from;

// Antes de cada prueba, limpiar los mocks
beforeEach(() => {
  jest.clearAllMocks();
});

describe("UserAuth", () => {
  let testPatientId;
  let testDoctorId;

  // Configurar datos iniciales antes de las pruebas
  beforeAll(() => {
    // Establecer IDs de prueba directamente, sin depender de inserciones
    testPatientId = "test-patient-id-123";
    testDoctorId = "test-doctor-id-456";

    console.log("Usuarios de prueba creados en mock:", {
      testPatientId,
      testDoctorId,
    });
  });

  // Prueba de registro
  describe("register", () => {
    test("debería registrar un nuevo paciente exitosamente", async () => {
      const result = await UserAuth.register(
        "Paciente Nuevo",
        "nuevo.paciente@example.com",
        "Password123!",
        "paciente"
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.role).toBe("paciente");
    });

    test("debería registrar un nuevo médico exitosamente", async () => {
      const result = await UserAuth.register(
        "Médico Nuevo",
        "nuevo.medico@example.com",
        "Password123!",
        "medico"
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.role).toBe("medico");
    });

    test("debería rechazar registro con un correo ya existente", async () => {
      const result = await UserAuth.register(
        "Usuario Duplicado",
        testPatients[0].email, // Email que ya existe
        "Password123!",
        "paciente"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("debería rechazar registro con rol inválido", async () => {
      const result = await UserAuth.register(
        "Usuario Rol Inválido",
        "rol.invalido@example.com",
        "Password123!",
        "administrador" // Rol no permitido
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('El rol debe ser "paciente" o "medico"');
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
      // Modificamos el mock de forma temporal para este test específico
      mockSupabaseClient.auth.signInWithPassword.mockImplementationOnce(() => {
        return {
          data: null,
          error: { message: "User not found", code: "user_not_found" },
        };
      });

      const result = await UserAuth.checkEmailExists("no.existe@example.com");

      expect(result.exists).toBe(false);
    });
  });

  // Prueba de solicitud de restablecimiento de contraseña
  describe("resetPassword", () => {
    test("debería enviar correo de restablecimiento para usuario existente", async () => {
      const result = await UserAuth.resetPassword(testPatients[0].email);

      expect(result.success).toBe(true);
    });

    test("debería manejar correctamente una solicitud para email inexistente", async () => {
      const result = await UserAuth.resetPassword("no.existe@example.com");

      // Por razones de seguridad, siempre debe devolver éxito aunque el email no exista
      expect(result.success).toBe(true);
    });
  });

  // Prueba de actualización de datos del usuario
  describe("updateUserData", () => {
    test("debería actualizar datos del usuario correctamente", async () => {
      const userData = {
        name: "Nombre Actualizado",
        preferences: { theme: "dark" },
      };

      const result = await UserAuth.updateUserData(testPatientId, userData);

      expect(result.success).toBe(true);
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ data: userData });
    });

    test("debería manejar errores al actualizar datos", async () => {
      // Modificar el mock para simular un error
      supabase.auth.updateUser.mockImplementationOnce(() => {
        return {
          data: null,
          error: { message: "Error al actualizar usuario" },
        };
      });

      const result = await UserAuth.updateUserData(testPatientId, {
        name: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("debería manejar errores inesperados", async () => {
      // Modificar el mock para lanzar una excepción
      supabase.auth.updateUser.mockImplementationOnce(() => {
        throw new Error("Error inesperado");
      });

      const result = await UserAuth.updateUserData(testPatientId, {
        name: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error inesperado");
    });
  });

  // Prueba de reenvío de correo de confirmación
  describe("resendConfirmationEmail", () => {
    test("debería reenviar correo de confirmación correctamente", async () => {
      // Asegurar que checkEmailExists retorne que el email existe
      mockSupabaseClient.auth.signInWithPassword.mockImplementationOnce(() => {
        return {
          data: null,
          error: { message: "Credenciales inválidas" }, // Error de credenciales indica que el usuario existe
        };
      });

      const result = await UserAuth.resendConfirmationEmail(
        testPatients[0].email
      );

      expect(result.success).toBe(true);
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: "signup",
        email: testPatients[0].email,
        options: expect.any(Object),
      });
    });

    test("debería rechazar reenvío para email inexistente", async () => {
      // Modificar el mock para simular que el email no existe
      mockSupabaseClient.auth.signInWithPassword.mockImplementationOnce(() => {
        return {
          data: null,
          error: { message: "User not found", code: "user_not_found" },
        };
      });

      const result = await UserAuth.resendConfirmationEmail(
        "no.existe@example.com"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("No existe ninguna cuenta");
    });

    test("debería manejar errores al reenviar correo", async () => {
      // Asegurar que checkEmailExists retorne que el email existe
      mockSupabaseClient.auth.signInWithPassword.mockImplementationOnce(() => {
        return {
          data: null,
          error: { message: "Credenciales inválidas" },
        };
      });

      // Pero el reenvío falla
      supabase.auth.resend.mockImplementationOnce(() => {
        return {
          data: null,
          error: { message: "Error al reenviar correo", code: "send_error" },
        };
      });

      const result = await UserAuth.resendConfirmationEmail(
        testPatients[0].email
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe("send_error");
    });

    test("debería manejar errores inesperados", async () => {
      // Asegurar que checkEmailExists retorne que el email existe
      mockSupabaseClient.auth.signInWithPassword.mockImplementationOnce(() => {
        return {
          data: null,
          error: { message: "Credenciales inválidas" },
        };
      });

      // Pero el reenvío lanza una excepción
      supabase.auth.resend.mockImplementationOnce(() => {
        throw new Error("Error inesperado en el servidor");
      });

      const result = await UserAuth.resendConfirmationEmail(
        testPatients[0].email
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error inesperado en el servidor");
    });
  });
});
