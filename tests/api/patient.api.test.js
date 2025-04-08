/**
 * Pruebas para las rutas de pacientes
 */

// Importar dependencias necesarias
const {
  createTestUser,
  deleteTestUser,
  createTestMeal,
} = require("../setup-supabase");

// Variables para almacenar datos de prueba
let testPatientId;
let authCookie;
let testEntryId;

describe("Rutas de pacientes", () => {
  // Configuración inicial: crear usuario de prueba y obtener cookie de autenticación
  beforeAll(async () => {
    try {
      // Crear usuario paciente para pruebas
      const userData = await createTestUser({
        email: "test-patient-routes@example.com",
        password: "Test1234!",
        name: "Test Patient",
        role: "paciente",
      });

      testPatientId = userData.id;

      // Iniciar sesión para obtener cookie
      const loginResponse = await api.post("/auth/login").send({
        email: "test-patient-routes@example.com",
        password: "Test1234!",
      });

      // Extraer cookie de autenticación
      authCookie = loginResponse.headers["set-cookie"];

      // Crear una entrada de comida para probar las rutas de entradas
      const uploadResponse = await api
        .post("/patient/upload")
        .set("Cookie", authCookie)
        .field("description", "Comida de prueba")
        .field("meal_type", "almuerzo")
        .field("date", new Date().toISOString().split("T")[0])
        .attach("food_image", Buffer.from("fake image data"), "test-image.jpg");

      // Obtener ID de la entrada creada
      testEntryId = uploadResponse.body.entry_id || "1"; // Fallback a '1' si no se puede obtener
    } catch (error) {
      console.error(
        "Error en configuración de pruebas API de pacientes:",
        error
      );
    }
  });

  // Limpieza después de pruebas
  afterAll(async () => {
    try {
      await deleteTestUser(testPatientId);
      console.log("Usuario paciente de prueba eliminado");
    } catch (error) {
      console.error("Error al eliminar usuario de prueba:", error);
    }
  });

  // Verificar redirección a login para usuarios no autenticados
  describe("Protección de autenticación", () => {
    test("GET /patient/dashboard debe redirigir a login si no está autenticado", async () => {
      const response = await api.get("/patient/dashboard");
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain("/auth/login");
    });

    test("GET /patient/dashboard debe redirigir a login si el usuario no es paciente", async () => {
      // Primero crear un usuario médico
      const doctorData = await createTestUser({
        email: "test-doctor@example.com",
        password: "Test1234!",
        name: "Test Doctor",
        role: "medico",
      });

      // Iniciar sesión como médico
      const loginResponse = await api.post("/auth/login").send({
        email: "test-doctor@example.com",
        password: "Test1234!",
      });

      const doctorCookie = loginResponse.headers["set-cookie"];

      // Intentar acceder a ruta de pacientes como médico
      const response = await api
        .get("/patient/dashboard")
        .set("Cookie", doctorCookie);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain("/auth/login");

      // Limpiar usuario médico
      await deleteTestUser(doctorData.id);
    });
  });

  // Pruebas para rutas autenticadas de pacientes
  describe("Dashboard y perfil", () => {
    test("GET /patient/dashboard debe mostrar dashboard si es paciente autenticado", async () => {
      const response = await api
        .get("/patient/dashboard")
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Dashboard");
    });
  });

  // Pruebas para subir imágenes de comidas
  describe("Subida de imágenes", () => {
    test("GET /patient/upload debe mostrar formulario de subida", async () => {
      const response = await api
        .get("/patient/upload")
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Subir");
    });

    test("POST /patient/upload debe procesar la subida correctamente", async () => {
      const response = await api
        .post("/patient/upload")
        .set("Cookie", authCookie)
        .field("description", "Comida de prueba API")
        .field("meal_type", "cena")
        .field("date", new Date().toISOString().split("T")[0])
        .attach("food_image", Buffer.from("fake image data"), "test-image.jpg");

      expect(response.statusCode).toBe(302); // Asumiendo redirección tras éxito
      // O expect(response.statusCode).toBe(200) si la respuesta es directa
    });

    test("POST /patient/upload debe validar los campos requeridos", async () => {
      const response = await api
        .post("/patient/upload")
        .set("Cookie", authCookie)
        .field("description", "")
        .field("meal_type", "")
        .field("date", "");

      expect(response.statusCode).toBe(400);
      // Verificar mensaje de error (depende de la implementación)
    });
  });

  // Pruebas para historial de comidas
  describe("Historial de comidas", () => {
    test("GET /patient/history debe mostrar el historial de comidas", async () => {
      const response = await api
        .get("/patient/history")
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Historial");
    });
  });

  // Pruebas para entrada específica
  describe("Detalle de entrada", () => {
    test("GET /patient/entry/:id debe mostrar los detalles de una entrada", async () => {
      const response = await api
        .get(`/patient/entry/${testEntryId}`)
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
    });

    test("GET /patient/entry/:id/edit debe mostrar formulario de edición", async () => {
      const response = await api
        .get(`/patient/entry/${testEntryId}/edit`)
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Editar");
    });

    test("POST /patient/entry/:id/update debe actualizar la entrada", async () => {
      const response = await api
        .post(`/patient/entry/${testEntryId}/update`)
        .set("Cookie", authCookie)
        .send({
          description: "Entrada actualizada",
          meal_type: "cena",
        });

      expect(response.statusCode).toBe(302); // Asumiendo redirección tras éxito
    });

    test("DELETE /patient/entry/:id debe eliminar la entrada", async () => {
      const response = await api
        .delete(`/patient/entry/${testEntryId}`)
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(302); // Asumiendo redirección tras éxito
    });
  });

  // Validar acceso a entradas ajenas
  describe("Seguridad de propiedad de entradas", () => {
    test("GET /patient/entry/:id debe denegar acceso a entradas de otros pacientes", async () => {
      // Primero crear otro paciente y una entrada para él
      const otherPatientData = await createTestUser({
        email: "other-patient@example.com",
        password: "Test1234!",
        name: "Other Patient",
        role: "paciente",
      });

      // Iniciar sesión como el otro paciente
      const otherLoginResponse = await api.post("/auth/login").send({
        email: "other-patient@example.com",
        password: "Test1234!",
      });

      const otherCookie = otherLoginResponse.headers["set-cookie"];

      // Crear una entrada para el otro paciente
      const uploadResponse = await api
        .post("/patient/upload")
        .set("Cookie", otherCookie)
        .field("description", "Comida de otro paciente")
        .field("meal_type", "desayuno")
        .field("date", new Date().toISOString().split("T")[0])
        .attach(
          "food_image",
          Buffer.from("other image data"),
          "other-image.jpg"
        );

      const otherEntryId = uploadResponse.body.entry_id || "2";

      // Intentar acceder a la entrada del otro paciente
      const response = await api
        .get(`/patient/entry/${otherEntryId}`)
        .set("Cookie", authCookie);

      // Debería denegar el acceso
      expect(response.statusCode).toBe(403);

      // Limpiar usuario y datos
      await deleteTestUser(otherPatientData.id);
    });
  });
});
