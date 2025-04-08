/**
 * Pruebas para las rutas de autenticación
 */

// Importar dependencias necesarias
const { createTestUser, deleteTestUser } = require("../setup-supabase");

// Variables para almacenar datos de prueba
let testUserId;
let authCookie;

describe("Rutas de autenticación", () => {
  // Configuración inicial: crear usuario de prueba
  beforeAll(async () => {
    try {
      // Crear usuario para pruebas
      const userData = await createTestUser({
        email: "test-auth-routes@example.com",
        password: "Test1234!",
        name: "Test Auth User",
        role: "paciente",
      });

      testUserId = userData.id;
    } catch (error) {
      console.error(
        "Error en configuración de pruebas de rutas de autenticación:",
        error
      );
    }
  });

  // Limpieza después de pruebas
  afterAll(async () => {
    try {
      await deleteTestUser(testUserId);
      console.log("Usuario de prueba para rutas de autenticación eliminado");
    } catch (error) {
      console.error("Error al eliminar usuario de prueba:", error);
    }
  });

  // Pruebas para rutas de login y registro
  describe("Login y registro", () => {
    test("GET /auth/login debe mostrar formulario de inicio de sesión", async () => {
      const response = await api.get("/auth/login");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Iniciar sesión");
    });

    test("GET /auth/register debe mostrar formulario de registro", async () => {
      const response = await api.get("/auth/register");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Registro");
    });

    test("POST /auth/login debe autenticar al usuario correctamente", async () => {
      const response = await api.post("/auth/login").send({
        email: "test-auth-routes@example.com",
        password: "Test1234!",
      });

      // Debería redirigir al dashboard tras login exitoso
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain("/patient/dashboard");

      // Guardar cookie para pruebas que requieren autenticación
      authCookie = response.headers["set-cookie"];
    });

    test("POST /auth/login debe rechazar credenciales incorrectas", async () => {
      const response = await api.post("/auth/login").send({
        email: "test-auth-routes@example.com",
        password: "IncorrectPassword123",
      });

      // Debería mostrar error o redireccionar al login
      expect([200, 302]).toContain(response.statusCode);
      if (response.statusCode === 200) {
        expect(response.text).toContain("credenciales");
      }
    });

    test("POST /auth/register debe registrar un nuevo usuario", async () => {
      const email = `test-register-${Date.now()}@example.com`;
      const response = await api.post("/auth/register").send({
        name: "Test Register User",
        email: email,
        password: "Test1234!",
        role: "paciente",
      });

      // Debería redirigir a la confirmación tras registro exitoso
      expect(response.statusCode).toBe(302);

      // Limpiar el usuario creado (buscar por email)
      try {
        // Nota: Esta parte es específica de la implementación -
        // Puede ser necesario ajustar según cómo se manejan los usuarios
        const users = await api
          .get("/api/auth/search-users")
          .query({ email: email })
          .set("Cookie", authCookie);

        if (users.body && users.body.length > 0) {
          await deleteTestUser(users.body[0].id);
        }
      } catch (error) {
        console.error("Error al limpiar usuario de prueba de registro:", error);
      }
    });

    test("POST /auth/register debe validar datos de entrada", async () => {
      const response = await api.post("/auth/register").send({
        name: "",
        email: "invalid-email",
        password: "123",
        role: "invalid-role",
      });

      // Debería mostrar errores de validación
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("error");
    });
  });

  // Pruebas para recuperación de contraseña
  describe("Recuperación de contraseña", () => {
    test("GET /auth/forgot-password debe mostrar formulario de recuperación", async () => {
      const response = await api.get("/auth/forgot-password");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("recuperar");
    });

    test("POST /auth/forgot-password debe procesar solicitud de recuperación", async () => {
      const response = await api.post("/auth/forgot-password").send({
        email: "test-auth-routes@example.com",
      });

      // Debería mostrar confirmación
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("enviado");
    });

    test("GET /auth/reset-password/:token debe mostrar formulario de restablecimiento", async () => {
      // Usar un token falso para la prueba
      const response = await api.get("/auth/reset-password/fake-token-12345");

      // Debería mostrar formulario o error de token inválido
      expect([200, 302]).toContain(response.statusCode);
      if (response.statusCode === 200) {
        expect(response.text).toContain("nueva contraseña");
      }
    });
  });

  // Pruebas para cierre de sesión y confirmación de email
  describe("Logout y confirmación de email", () => {
    test("GET /auth/logout debe cerrar sesión correctamente", async () => {
      // Primero asegurarse de estar autenticado
      const loginResponse = await api.post("/auth/login").send({
        email: "test-auth-routes@example.com",
        password: "Test1234!",
      });

      const cookie = loginResponse.headers["set-cookie"];

      const response = await api.get("/auth/logout").set("Cookie", cookie);

      // Debería redirigir a la página principal
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toEqual("/");
    });

    test("GET /auth/email-confirmed debe mostrar página de confirmación", async () => {
      const response = await api.get("/auth/email-confirmed");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("confirmado");
    });

    test("POST /auth/resend-confirmation debe reenviar email de confirmación", async () => {
      // Primero iniciar sesión
      const loginResponse = await api.post("/auth/login").send({
        email: "test-auth-routes@example.com",
        password: "Test1234!",
      });

      const cookie = loginResponse.headers["set-cookie"];

      const response = await api
        .post("/auth/resend-confirmation")
        .set("Cookie", cookie);

      // Debería mostrar confirmación o redirigir
      expect([200, 302]).toContain(response.statusCode);
    });
  });

  // Pruebas de seguridad para rutas protegidas
  describe("Seguridad de rutas protegidas", () => {
    test("Rutas protegidas deben redirigir a login para usuarios no autenticados", async () => {
      const protectedRoutes = [
        "/auth/logout",
        "/profile",
        "/profile/edit",
        "/patient/dashboard",
        "/doctor/dashboard",
      ];

      for (const route of protectedRoutes) {
        const response = await api.get(route);
        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toContain("/auth/login");
      }
    });

    test("Rutas públicas deben redirigir al dashboard si ya está autenticado", async () => {
      const publicRoutes = [
        "/auth/login",
        "/auth/register",
        "/auth/forgot-password",
      ];

      // Primero iniciar sesión
      const loginResponse = await api.post("/auth/login").send({
        email: "test-auth-routes@example.com",
        password: "Test1234!",
      });

      const cookie = loginResponse.headers["set-cookie"];

      for (const route of publicRoutes) {
        const response = await api.get(route).set("Cookie", cookie);

        expect(response.statusCode).toBe(302);
        // Debería redirigir al dashboard según el rol
        expect(response.headers.location).toContain("/dashboard");
      }
    });
  });
});
