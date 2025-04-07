/**
 * Pruebas de integración para la funcionalidad de relación médico-paciente
 */

const { createTestUser, deleteTestUser } = require("../../setup-supabase");
const { testPatients, testDoctors } = require("../../fixtures/users");
const { createMockSupabase } = require("../../mocks/supabase-mock");

// Determinar si usar mocks o BD real
const USE_MOCKS = true;

// Si se usan mocks, configurarlos
let mockSupabase;
if (USE_MOCKS) {
  mockSupabase = createMockSupabase();

  // Mock del módulo de Supabase
  jest.mock("../../../config/supabase", () => ({
    supabase: {
      from: jest
        .fn()
        .mockImplementation((table) => mockSupabase.client.from(table)),
      auth: {
        signUp: jest
          .fn()
          .mockImplementation((data) => mockSupabase.client.auth.signUp(data)),
        signIn: jest
          .fn()
          .mockImplementation((data) => mockSupabase.client.auth.signIn(data)),
        signOut: jest
          .fn()
          .mockImplementation(() => mockSupabase.client.auth.signOut()),
        getUser: jest
          .fn()
          .mockImplementation(() => mockSupabase.client.auth.getUser()),
      },
    },
  }));
} else {
  // Si no estamos usando mocks, usamos un mock simple para las pruebas
  jest.mock("../../../config/supabase", () => ({
    supabase: {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
      auth: {
        signUp: jest
          .fn()
          .mockResolvedValue({
            data: { user: { id: "test-id" } },
            error: null,
          }),
        signIn: jest
          .fn()
          .mockResolvedValue({
            data: { user: { id: "test-id" } },
            error: null,
          }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
  }));
}

// Importar los módulos después del mock
const UserAuth = require("../../../models/UserAuth");
const DoctorPatient = require("../../../models/DoctorPatient");

describe("Integración Doctor-Paciente", () => {
  // IDs de los usuarios de prueba
  let doctorId;
  let patientIds = [];

  // Configuración inicial
  beforeAll(() => {
    if (USE_MOCKS) {
      // Crear médico de prueba
      const doctorUser = mockSupabase.addTestUser({
        ...testDoctors[0],
        role: "medico",
      });
      doctorId = doctorUser.id;
      console.log("Médico de prueba creado con ID:", doctorId);

      // Crear 2 pacientes de prueba
      for (let i = 0; i < 2; i++) {
        const patientUser = mockSupabase.addTestUser({
          ...testPatients[i],
          email: `paciente.test.${Date.now()}.${i}@example.com`,
          role: "paciente",
        });
        patientIds.push(patientUser.id);
      }
      console.log("Pacientes de prueba creados con IDs:", patientIds);

      // Agregar algunas relaciones
      mockSupabase.mockDatabase.doctor_patient = [
        {
          id: "rel-1",
          doctor_id: doctorId,
          patient_id: patientIds[0],
          status: "active",
          created_at: new Date().toISOString(),
        },
        {
          id: "rel-2",
          doctor_id: doctorId,
          patient_id: patientIds[1],
          status: "active",
          created_at: new Date().toISOString(),
        },
      ];
    }
  });

  // Limpieza después de las pruebas
  afterAll(() => {
    if (USE_MOCKS) {
      // Resetear la base de datos mock
      mockSupabase.resetDatabase();
    }
  });

  // Prueba de vinculación de paciente a médico
  describe("asignarPacienteAMedico", () => {
    test("debería vincular un paciente a un médico correctamente", async () => {
      // Crear un paciente adicional para esta prueba
      const newPatientUser = mockSupabase.addTestUser({
        ...testPatients[0],
        email: `nuevo.paciente.${Date.now()}@example.com`,
        role: "paciente",
      });

      const result = await DoctorPatient.asignarPacienteAMedico(
        doctorId,
        newPatientUser.id
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.doctor_id).toBe(doctorId);
      expect(result.data.patient_id).toBe(newPatientUser.id);
    });

    test("debería rechazar vinculación con IDs inválidos", async () => {
      const result = await DoctorPatient.asignarPacienteAMedico(
        "id-invalido",
        patientIds[0]
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("debería rechazar vinculación duplicada", async () => {
      // Reusamos la relación ya creada en el setup
      const result = await DoctorPatient.asignarPacienteAMedico(
        doctorId,
        patientIds[0]
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // Prueba de obtención de pacientes de un médico
  describe("obtenerPacientesDeMedico", () => {
    test("debería obtener la lista de pacientes de un médico", async () => {
      const result = await DoctorPatient.obtenerPacientesDeMedico(doctorId);

      expect(result.success).toBe(true);
      expect(result.pacientes).toBeDefined();
      expect(Array.isArray(result.pacientes)).toBe(true);
      expect(result.pacientes.length).toBeGreaterThanOrEqual(2);

      // Verificar que los pacientes vinculados estén en la lista
      const pacientesIds = result.pacientes.map((p) => p.id);
      expect(pacientesIds).toContain(patientIds[0]);
      expect(pacientesIds).toContain(patientIds[1]);
    });

    test("debería devolver lista vacía para médico sin pacientes", async () => {
      // Crear médico temporal sin pacientes
      const tempDoctorData = await createTestUser({
        ...testDoctors[1],
        email: `medico.temp.${Date.now()}@example.com`,
      });

      const result = await DoctorPatient.obtenerPacientesDeMedico(
        tempDoctorData.id
      );

      expect(result.success).toBe(true);
      expect(result.pacientes).toBeDefined();
      expect(result.pacientes.length).toBe(0);

      // Eliminar médico temporal
      await deleteTestUser(tempDoctorData.id);
    });
  });

  // Prueba de obtención de médicos de un paciente
  describe("obtenerMedicosDePaciente", () => {
    test("debería obtener la lista de médicos de un paciente", async () => {
      const result = await DoctorPatient.obtenerMedicosDePaciente(
        patientIds[0]
      );

      expect(result.success).toBe(true);
      expect(result.medicos).toBeDefined();
      expect(Array.isArray(result.medicos)).toBe(true);
      expect(result.medicos.length).toBeGreaterThanOrEqual(1);

      // Verificar que el médico vinculado esté en la lista
      const medicosIds = result.medicos.map((m) => m.id);
      expect(medicosIds).toContain(doctorId);
    });
  });

  // Prueba de eliminación de relación médico-paciente
  describe("eliminarAsignacion", () => {
    test("debería eliminar la relación médico-paciente correctamente", async () => {
      const result = await DoctorPatient.eliminarAsignacion(
        doctorId,
        patientIds[0]
      );

      expect(result.success).toBe(true);

      // Verificar que la relación se eliminó consultando los pacientes
      const checkResult = await DoctorPatient.obtenerPacientesDeMedico(
        doctorId
      );
      const pacienteIds = checkResult.pacientes.map((p) => p.id);
      expect(pacienteIds).not.toContain(patientIds[0]);
    });

    test("debería manejar la eliminación de una relación inexistente", async () => {
      // Crear un paciente temporal que no está asignado
      const tempPatientData = await createTestUser({
        ...testPatients[0],
        email: `paciente.temp.${Date.now()}@example.com`,
      });

      const result = await DoctorPatient.eliminarAsignacion(
        doctorId,
        tempPatientData.id
      );

      // No debería dar error, pero indicar que no se eliminó nada
      expect(result.success).toBe(true);
      expect(result.count).toBe(0);

      // Eliminar paciente temporal
      await deleteTestUser(tempPatientData.id);
    });
  });
});
