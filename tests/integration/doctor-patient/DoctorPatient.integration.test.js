/**
 * Pruebas de integración para la funcionalidad de relación médico-paciente
 */

const { 
  supabaseTestClient,
  supabaseAdminClient,
  createTestUser,
  deleteTestUser
} = require('../../setup-supabase');
const { testPatients, testDoctors } = require('../../fixtures/users');

// Mock del módulo de Supabase
jest.mock('../../../config/supabase', () => ({
  supabase: supabaseTestClient
}));

// Importar los módulos después del mock
const UserAuth = require('../../../models/UserAuth');
const DoctorPatient = require('../../../models/DoctorPatient');

describe('Integración Doctor-Paciente', () => {
  // IDs de los usuarios de prueba
  let doctorId;
  let patientIds = [];
  
  // Antes de todas las pruebas, crear usuarios de prueba
  beforeAll(async () => {
    try {
      // Crear médico de prueba
      const doctorData = await createTestUser(testDoctors[0]);
      doctorId = doctorData.id;
      console.log('Médico de prueba creado con ID:', doctorId);
      
      // Crear 2 pacientes de prueba
      for (let i = 0; i < 2; i++) {
        const patientData = await createTestUser({
          ...testPatients[i],
          email: `paciente.test.${Date.now()}.${i}@example.com`
        });
        patientIds.push(patientData.id);
      }
      console.log('Pacientes de prueba creados con IDs:', patientIds);
    } catch (error) {
      console.error('Error en configuración de pruebas:', error);
    }
  });
  
  // Después de todas las pruebas, eliminar usuarios de prueba
  afterAll(async () => {
    try {
      // Eliminar relaciones médico-paciente
      for (const patientId of patientIds) {
        await supabaseAdminClient
          .from('doctor_patient')
          .delete()
          .match({ doctor_id: doctorId, patient_id: patientId });
      }
      
      // Eliminar usuarios
      await deleteTestUser(doctorId);
      for (const patientId of patientIds) {
        await deleteTestUser(patientId);
      }
      
      console.log('Datos de prueba eliminados correctamente');
    } catch (error) {
      console.error('Error al limpiar datos de prueba:', error);
    }
  });
  
  // Prueba de vinculación de paciente a médico
  describe('asignarPacienteAMedico', () => {
    test('debería vincular un paciente a un médico correctamente', async () => {
      const result = await DoctorPatient.asignarPacienteAMedico(
        doctorId,
        patientIds[0]
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.doctor_id).toBe(doctorId);
      expect(result.data.patient_id).toBe(patientIds[0]);
    });
    
    test('debería rechazar vinculación con IDs inválidos', async () => {
      const result = await DoctorPatient.asignarPacienteAMedico(
        'id-invalido',
        patientIds[0]
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('debería rechazar vinculación duplicada', async () => {
      // Intentar vincular el mismo paciente dos veces
      await DoctorPatient.asignarPacienteAMedico(doctorId, patientIds[1]);
      const result = await DoctorPatient.asignarPacienteAMedico(
        doctorId,
        patientIds[1]
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('duplicada');
    });
  });
  
  // Prueba de obtención de pacientes de un médico
  describe('obtenerPacientesDeMedico', () => {
    test('debería obtener la lista de pacientes de un médico', async () => {
      const result = await DoctorPatient.obtenerPacientesDeMedico(doctorId);
      
      expect(result.success).toBe(true);
      expect(result.pacientes).toBeDefined();
      expect(Array.isArray(result.pacientes)).toBe(true);
      expect(result.pacientes.length).toBeGreaterThanOrEqual(2);
      
      // Verificar que los pacientes vinculados estén en la lista
      const pacientesIds = result.pacientes.map(p => p.id);
      expect(pacientesIds).toContain(patientIds[0]);
      expect(pacientesIds).toContain(patientIds[1]);
    });
    
    test('debería devolver lista vacía para médico sin pacientes', async () => {
      // Crear médico temporal sin pacientes
      const tempDoctorData = await createTestUser({
        ...testDoctors[1],
        email: `medico.temp.${Date.now()}@example.com`
      });
      
      const result = await DoctorPatient.obtenerPacientesDeMedico(tempDoctorData.id);
      
      expect(result.success).toBe(true);
      expect(result.pacientes).toBeDefined();
      expect(result.pacientes.length).toBe(0);
      
      // Eliminar médico temporal
      await deleteTestUser(tempDoctorData.id);
    });
  });
  
  // Prueba de obtención de médicos de un paciente
  describe('obtenerMedicosDePaciente', () => {
    test('debería obtener la lista de médicos de un paciente', async () => {
      const result = await DoctorPatient.obtenerMedicosDePaciente(patientIds[0]);
      
      expect(result.success).toBe(true);
      expect(result.medicos).toBeDefined();
      expect(Array.isArray(result.medicos)).toBe(true);
      expect(result.medicos.length).toBeGreaterThanOrEqual(1);
      
      // Verificar que el médico vinculado esté en la lista
      const medicosIds = result.medicos.map(m => m.id);
      expect(medicosIds).toContain(doctorId);
    });
  });
  
  // Prueba de eliminación de relación médico-paciente
  describe('eliminarAsignacion', () => {
    test('debería eliminar la relación médico-paciente correctamente', async () => {
      const result = await DoctorPatient.eliminarAsignacion(
        doctorId,
        patientIds[0]
      );
      
      expect(result.success).toBe(true);
      
      // Verificar que la relación se eliminó consultando los pacientes
      const checkResult = await DoctorPatient.obtenerPacientesDeMedico(doctorId);
      const pacienteIds = checkResult.pacientes.map(p => p.id);
      expect(pacienteIds).not.toContain(patientIds[0]);
    });
    
    test('debería manejar la eliminación de una relación inexistente', async () => {
      // Crear un paciente temporal que no está asignado
      const tempPatientData = await createTestUser({
        ...testPatients[0],
        email: `paciente.temp.${Date.now()}@example.com`
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