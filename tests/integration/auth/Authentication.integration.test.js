/**
 * Pruebas de integración para flujos de autenticación
 */

const { createMockSupabase } = require("../../mocks/supabase-mock");
const { testPatients, testDoctors } = require("../../fixtures/users");
const { supabase } = require("../../../config/supabase");
const Profile = require("../../../models/Profile");

// Determinar si usar mocks o BD real
const USE_MOCKS = true;

// Si se usan mocks, configurarlos
let mockSupabase;
if (USE_MOCKS) {
  mockSupabase = createMockSupabase();

  // Mock del módulo de Supabase
  jest.mock("../../../config/supabase", () => ({
    supabase: mockSupabase.client,
  }));
} else {
  // Usar doMock en lugar de mock para poder acceder a variables de ámbito
  jest.doMock("../../../config/supabase", () => ({
    supabase: {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
    },
  }));
}

// Importar los módulos después del mock
const UserAuth = require("../../../models/UserAuth");
const ProfileManager = require("../../../models/ProfileManager");

describe("Integración de Autenticación", () => {
  // Resetear mocks antes de cada prueba
  beforeEach(() => {
    if (USE_MOCKS) {
      mockSupabase.resetDatabase();
    } else {
      jest.clearAllMocks();
    }
  });

  // INT-AUTH-01: Prueba el flujo completo de registro de paciente
  describe("Registro de paciente", () => {
    test("debería registrar un paciente y crear su perfil", async () => {
      // Datos de prueba para un nuevo paciente
      const newPatient = {
        name: "Paciente Test",
        email: `paciente.test.${Date.now()}@example.com`,
        password: "Password123!",
        role: "paciente",
      };

      // 1. Registrar el usuario
      const authResult = await UserAuth.register(
        newPatient.email,
        newPatient.password,
        newPatient.name,
        newPatient.role
      );

      // Verificar resultado de autenticación
      expect(authResult.success).toBe(true);
      expect(authResult.user).toBeDefined();
      expect(authResult.user.id).toBeDefined();
      expect(authResult.user.email).toBe(newPatient.email);

      // 2. Verificar que el perfil se creó correctamente
      if (USE_MOCKS) {
        // Buscar en la base de datos mock
        const profile = mockSupabase.mockDatabase.profiles.find(
          (p) => p.email === newPatient.email
        );

        expect(profile).toBeDefined();
        expect(profile.name).toBe(newPatient.name);
        expect(profile.role).toBe(newPatient.role);
      } else {
        // Aquí podríamos hacer una verificación directa contra Supabase
        // pero para evitar acoplar la prueba demasiado, confiaremos en que
        // nuestro modelo hace la operación correctamente
      }
    });

    test("debería rechazar registro con email existente", async () => {
      // Usar un correo ya registrado
      const existingEmail = testPatients[0].email;

      // Intentar registro con correo duplicado
      const authResult = await UserAuth.register(
        existingEmail,
        "NuevaContraseña123!",
        "Nombre Nuevo",
        "paciente"
      );

      // Verificar rechazo
      expect(authResult.success).toBe(false);
      expect(authResult.error).toBeDefined();
      expect(authResult.error).toContain("correo");
    });
  });

  // INT-AUTH-02: Prueba el flujo completo de registro de médico
  describe("Registro de médico", () => {
    test("debería registrar un médico y crear su perfil", async () => {
      // Datos de prueba para un nuevo médico
      const newDoctor = {
        name: "Doctor Test",
        email: `doctor.test.${Date.now()}@example.com`,
        password: "Password123!",
        role: "medico",
      };

      // 1. Registrar el médico
      const authResult = await UserAuth.register(
        newDoctor.email,
        newDoctor.password,
        newDoctor.name,
        newDoctor.role
      );

      // Verificar resultado de autenticación
      expect(authResult.success).toBe(true);
      expect(authResult.user).toBeDefined();
      expect(authResult.user.id).toBeDefined();
      expect(authResult.user.email).toBe(newDoctor.email);

      // 2. Verificar que el perfil se creó con el rol correcto
      if (USE_MOCKS) {
        // Buscar en la base de datos mock
        const profile = mockSupabase.mockDatabase.profiles.find(
          (p) => p.email === newDoctor.email
        );

        expect(profile).toBeDefined();
        expect(profile.name).toBe(newDoctor.name);
        expect(profile.role).toBe("medico");
      }
    });
  });

  // INT-AUTH-03: Prueba el flujo completo de inicio de sesión
  describe("Inicio de sesión", () => {
    // Agregar un usuario de prueba antes de las pruebas
    let testUser;

    beforeEach(() => {
      if (USE_MOCKS) {
        // Crear usuario de prueba en mocks
        testUser = mockSupabase.addTestUser(testPatients[0]);
      }
    });

    test("debería permitir login con credenciales correctas", async () => {
      // Intentar login con credenciales correctas
      const loginResult = await UserAuth.login(
        testPatients[0].email,
        testPatients[0].password
      );

      // Verificar éxito
      expect(loginResult.success).toBe(true);
      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.email).toBe(testPatients[0].email);
    });

    test("debería rechazar login con contraseña incorrecta", async () => {
      // Intentar login con contraseña incorrecta
      const loginResult = await UserAuth.login(
        testPatients[0].email,
        "ContraseñaIncorrecta123!"
      );

      // Verificar rechazo
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeDefined();
    });

    test("debería rechazar login con correo inexistente", async () => {
      // Intentar login con correo que no existe
      const loginResult = await UserAuth.login(
        "no.existe@example.com",
        "ContraseñaCualquiera"
      );

      // Verificar rechazo
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeDefined();
    });
  });

  // INT-AUTH-04: Prueba el flujo de recuperación de contraseña
  describe("Recuperación de contraseña", () => {
    test("debería solicitar recuperación para usuario existente", async () => {
      // Solicitar recuperación para un correo existente
      const resetResult = await UserAuth.resetPassword(testPatients[0].email);

      // Verificar éxito
      expect(resetResult.success).toBe(true);
    });

    test("debería manejar solicitud para correo inexistente", async () => {
      // Solicitar recuperación para un correo que no existe
      const resetResult = await UserAuth.resetPassword("no.existe@example.com");

      // Por seguridad, debería reportar éxito aunque el usuario no exista
      expect(resetResult.success).toBe(true);
    });
  });
});
