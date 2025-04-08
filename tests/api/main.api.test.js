/**
 * Pruebas para las rutas principales de la aplicación
 */

// Importar dependencias necesarias
const { createTestUser, deleteTestUser } = require("../setup-supabase");
const { apiUsers } = require("../fixtures/users");

// Variables para almacenar datos de prueba
let testUserId;
let authCookie;

describe("Rutas principales", () => {
  // Configuración inicial: crear usuario de prueba y obtener cookie de autenticación
  beforeAll(async () => {
    try {
      // Crear usuario para pruebas
      const userData = await createTestUser({
        email: "test-main-routes@example.com",
        password: "Test1234!",
        name: "Test User",
        role: "paciente",
      });

      testUserId = userData.id;

      // Iniciar sesión para obtener cookie
      const loginResponse = await api.post("/auth/login").send({
        email: "test-main-routes@example.com",
        password: "Test1234!",
      });

      // Extraer cookie de autenticación
      authCookie = loginResponse.headers["set-cookie"];
    } catch (error) {
      console.error("Error en configuración de pruebas API:", error);
    }
  });

  // Limpieza después de pruebas
  afterAll(async () => {
    try {
      await deleteTestUser(testUserId);
      console.log("Usuario de prueba para API eliminado");
    } catch (error) {
      console.error("Error al eliminar usuario de prueba:", error);
    }
  });

  // Pruebas para rutas públicas
  describe("Rutas públicas", () => {
    test("GET / debe mostrar la página de inicio", async () => {
      const response = await api.get("/");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Inicio");
    });

    test("GET /contact debe mostrar el formulario de contacto", async () => {
      const response = await api.get("/contact");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Contacto");
    });

    test("GET /about debe mostrar la página acerca de", async () => {
      const response = await api.get("/about");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Acerca de");
    });

    test("GET /privacy debe mostrar la política de privacidad", async () => {
      const response = await api.get("/privacy");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Política de Privacidad");
    });

    test("GET /terms debe mostrar los términos y condiciones", async () => {
      const response = await api.get("/terms");
      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Términos y Condiciones");
    });
  });

  // Pruebas para la funcionalidad de contacto
  describe("Formulario de contacto", () => {
    test("POST /contact debe procesar el formulario de contacto correctamente", async () => {
      const response = await api.post("/contact").send({
        name: "Usuario Prueba",
        email: "test@example.com",
        message: "Este es un mensaje de prueba",
      });

      expect(response.statusCode).toBe(200);
      // Verificar respuesta exitosa (depende de la implementación)
      // expect(response.text).toContain('Mensaje enviado');
    });

    test("POST /contact debe validar campos requeridos", async () => {
      const response = await api.post("/contact").send({
        name: "",
        email: "invalido",
        message: "",
      });

      expect(response.statusCode).toBe(400);
      // Verificar mensaje de error (depende de la implementación)
      // expect(response.text).toContain('Datos inválidos');
    });
  });

  // Pruebas para rutas protegidas
  describe("Rutas protegidas de perfil", () => {
    test("GET /profile debe redirigir a login si no está autenticado", async () => {
      const response = await api.get("/profile");
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain("/auth/login");
    });

    test("GET /profile debe mostrar perfil si está autenticado", async () => {
      const response = await api.get("/profile").set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Perfil");
    });

    test("GET /profile/edit debe mostrar formulario de edición si está autenticado", async () => {
      const response = await api.get("/profile/edit").set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Editar Perfil");
    });

    test("POST /profile/update debe actualizar el perfil correctamente", async () => {
      const response = await api
        .post("/profile/update")
        .set("Cookie", authCookie)
        .send({
          name: "Nombre Actualizado",
          phone: "123456789",
        });

      expect(response.statusCode).toBe(200);
      // Verificar redirección o mensaje de éxito (depende de la implementación)
      // expect(response.text).toContain('Perfil actualizado');
    });
  });
});
