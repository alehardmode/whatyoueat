/**
 * Pruebas para las rutas de doctores
 */

// Importar dependencias necesarias
const { createTestUser, deleteTestUser } = require("../setup-supabase");

// Variables para almacenar datos de prueba
let testDoctorId;
let testPatientId;
let authCookie;
let relationId;

describe("Rutas de doctores", () => {
  // Configuración inicial: crear usuario de prueba y obtener cookie de autenticación
  beforeAll(async () => {
    try {
      // Crear usuario médico para pruebas
      const doctorData = await createTestUser({
        email: "test-doctor-routes@example.com",
        password: "Test1234!",
        name: "Test Doctor",
        role: "medico",
      });

      testDoctorId = doctorData.id;

      // Crear usuario paciente para pruebas
      const patientData = await createTestUser({
        email: "test-doctor-patient@example.com",
        password: "Test1234!",
        name: "Test Doctor Patient",
        role: "paciente",
      });

      testPatientId = patientData.id;

      // Iniciar sesión como médico para obtener cookie
      const loginResponse = await api.post("/auth/login").send({
        email: "test-doctor-routes@example.com",
        password: "Test1234!",
      });

      // Extraer cookie de autenticación
      authCookie = loginResponse.headers["set-cookie"];

      // Asignar el paciente al médico para pruebas
      const assignResponse = await api
        .post(`/doctor/assign-patient/${testPatientId}`)
        .set("Cookie", authCookie);

      // Guardar el ID de la relación si está disponible
      relationId = assignResponse.body?.relationId || "1";
    } catch (error) {
      console.error("Error en configuración de pruebas API de médicos:", error);
    }
  });

  // Limpieza después de pruebas
  afterAll(async () => {
    try {
      // Eliminar usuario médico
      await deleteTestUser(testDoctorId);
      console.log("Usuario médico de prueba eliminado");

      // Eliminar usuario paciente
      await deleteTestUser(testPatientId);
      console.log("Usuario paciente de prueba eliminado");
    } catch (error) {
      console.error("Error al eliminar usuarios de prueba:", error);
    }
  });

  // Verificar redirección a login para usuarios no autenticados
  describe("Protección de autenticación", () => {
    test("GET /doctor/dashboard debe redirigir a login si no está autenticado", async () => {
      const response = await api.get("/doctor/dashboard");
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain("/auth/login");
    });

    test("GET /doctor/dashboard debe redirigir a login si el usuario no es médico", async () => {
      // Iniciar sesión como paciente
      const loginResponse = await api.post("/auth/login").send({
        email: "test-doctor-patient@example.com",
        password: "Test1234!",
      });

      // Obtener cookie de autenticación
      const patientCookie = loginResponse.headers["set-cookie"];

      // Intentar acceder al dashboard de médico
      const response = await api
        .get("/doctor/dashboard")
        .set("Cookie", patientCookie);

      // Verificar que redirecciona al dashboard de paciente
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toContain("/patient/dashboard");
    });
  });

  // Pruebas para funcionalidades del dashboard de médico
  describe("Dashboard y búsqueda", () => {
    test("GET /doctor/dashboard debe mostrar dashboard si es médico autenticado", async () => {
      const response = await api
        .get("/doctor/dashboard")
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Dashboard");
    });

    test("GET /doctor/search-patients debe mostrar formulario de búsqueda", async () => {
      const response = await api
        .get("/doctor/search-patients")
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Buscar");
    });

    test("GET /doctor/search-patients?q=test debe mostrar resultados de búsqueda", async () => {
      const response = await api
        .get("/doctor/search-patients?q=test")
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Resultados");
    });
  });

  // Pruebas para asignación de pacientes
  describe("Asignación de pacientes", () => {
    test("GET /doctor/assign-patient/:patientId debe mostrar página de confirmación", async () => {
      const response = await api
        .get(`/doctor/assign-patient/${testPatientId}`)
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Asignar");
    });

    test("POST /doctor/assign-patient/:patientId debe asignar paciente al médico", async () => {
      // Crear un nuevo paciente para esta prueba específica
      const newPatientData = await createTestUser({
        email: "new-test-patient@example.com",
        password: "Test1234!",
        name: "New Test Patient",
        role: "paciente",
      });

      const response = await api
        .post(`/doctor/assign-patient/${newPatientData.id}`)
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(302); // Asumiendo redirección tras éxito

      // Limpiar usuario
      await deleteTestUser(newPatientData.id);
    });
  });

  // Pruebas para gestionar pacientes asignados
  describe("Gestión de pacientes asignados", () => {
    test("GET /doctor/patient/:patientId debe mostrar historial del paciente", async () => {
      const response = await api
        .get(`/doctor/patient/${testPatientId}`)
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Historial");
    });

    test("GET /doctor/patient/:patientId/history debe mostrar historial de comidas", async () => {
      const response = await api
        .get(`/doctor/patient/${testPatientId}/history`)
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("Historial");
    });

    test("POST /doctor/patient/:relationId/remove debe eliminar la relación médico-paciente", async () => {
      const response = await api
        .post(`/doctor/patient/${relationId}/remove`)
        .set("Cookie", authCookie);

      expect(response.statusCode).toBe(302); // Asumiendo redirección tras éxito
    });
  });

  // Pruebas de seguridad para acceso a pacientes
  describe("Seguridad de acceso a pacientes", () => {
    test("GET /doctor/patient/:patientId debe denegar acceso a pacientes no asignados", async () => {
      // Crear un nuevo paciente que no está asignado
      const unassignedPatient = await createTestUser({
        email: "unassigned-patient@example.com",
        password: "Test1234!",
        name: "Unassigned Patient",
        role: "paciente",
      });

      const response = await api
        .get(`/doctor/patient/${unassignedPatient.id}`)
        .set("Cookie", authCookie);

      // Debería denegar acceso o redirigir
      expect([403, 404, 302]).toContain(response.statusCode);

      // Limpiar usuario
      await deleteTestUser(unassignedPatient.id);
    });

    test("GET /doctor/patient/:patientId/entry/:entryId debe denegar acceso a entradas de pacientes no asignados", async () => {
      // Crear un nuevo paciente no asignado
      const unassignedPatient = await createTestUser({
        email: "unassigned-patient2@example.com",
        password: "Test1234!",
        name: "Unassigned Patient 2",
        role: "paciente",
      });

      // Iniciar sesión como el paciente no asignado
      const loginResponse = await api.post("/auth/login").send({
        email: "unassigned-patient2@example.com",
        password: "Test1234!",
      });

      const patientCookie = loginResponse.headers["set-cookie"];

      // Crear una entrada para este paciente
      const uploadResponse = await api
        .post("/patient/upload")
        .set("Cookie", patientCookie)
        .field("description", "Comida de prueba no asignada")
        .field("meal_type", "cena")
        .field("date", new Date().toISOString().split("T")[0])
        .attach("food_image", Buffer.from("fake image data"), "test-image.jpg");

      const entryId = uploadResponse.body?.entry_id || "1";

      // Intentar acceder como médico a esta entrada
      const response = await api
        .get(`/doctor/patient/${unassignedPatient.id}/entry/${entryId}`)
        .set("Cookie", authCookie);

      // Debería denegar acceso
      expect([403, 404, 302]).toContain(response.statusCode);

      // Limpiar usuario
      await deleteTestUser(unassignedPatient.id);
    });
  });
});
