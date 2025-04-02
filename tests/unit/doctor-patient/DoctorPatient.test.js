/**
 * Pruebas unitarias para DoctorPatient
 */

// Mock del módulo de Supabase antes de importar las dependencias
jest.mock('../../../config/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

const { createTestUser, deleteTestUser } = require('../../setup-supabase');
const { testPatients, testDoctors } = require('../../fixtures/users');

// Importar el módulo después del mock
const DoctorPatient = require('../../../models/DoctorPatient');
const { supabase } = require('../../../config/supabase');

describe('DoctorPatient', () => {
  let doctorId;
  let patientId;
  
  beforeAll(() => {
    // Crear IDs simulados para las pruebas
    doctorId = 'doctor-test-id';
    patientId = 'patient-test-id';
    
    console.log('Tests configurados correctamente');
  });
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('assign', () => {
    test('debería permitir asignar un paciente a un médico', async () => {
      // Configurar mocks para el caso exitoso
      // Mock para verificar que el ID es de un médico
      const mockDoctorCheck = jest.fn().mockReturnValue({
        data: { role: 'medico' },
        error: null
      });
      
      // Mock para verificar que el ID es de un paciente
      const mockPatientCheck = jest.fn().mockReturnValue({
        data: { role: 'paciente' },
        error: null
      });
      
      // Mock para verificar si ya existe la relación
      const mockRelationCheck = jest.fn().mockReturnValue({
        data: null,
        error: { code: 'PGRST116' }
      });
      
      // Mock para insertar nueva relación
      const mockInsert = jest.fn().mockReturnValue({
        data: [{ 
          id: 'rel-id', 
          doctor_id: doctorId, 
          patient_id: patientId,
          status: 'active',
          created_at: new Date()
        }],
        error: null
      });
      
      // Configurar el comportamiento general del mock de supabase
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, id) => {
              if (id === doctorId) {
                return {
                  single: mockDoctorCheck
                };
              } else {
                return {
                  single: mockPatientCheck
                };
              }
            })
          };
        }
        
        if (table === 'doctor_patient_relationships') {
          return {
            select: jest.fn().mockImplementation(() => {
              return {
                eq: jest.fn().mockReturnThis(),
                single: mockRelationCheck
              };
            }),
            insert: jest.fn().mockImplementation(() => {
              return {
                select: jest.fn().mockReturnValue(mockInsert())
              };
            })
          };
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis()
        };
      });
      
      const result = await DoctorPatient.assign(doctorId, patientId);
      
      expect(result.success).toBe(true);
      expect(result.relation).toBeDefined();
      expect(mockDoctorCheck).toHaveBeenCalled();
      expect(mockPatientCheck).toHaveBeenCalled();
      expect(mockRelationCheck).toHaveBeenCalled();
    });
    
    test('debería rechazar asignar un médico a un médico', async () => {
      // Configurar mocks para simular un médico tratando de asignar otro médico
      const mockDoctorCheck = jest.fn().mockReturnValue({
        data: { role: 'medico' },
        error: null
      });
      
      // Este mock debe ser llamado cuando se verifica el segundo ID
      const mockSecondDoctorCheck = jest.fn().mockReturnValue({
        data: { role: 'medico' }, // Aquí el "paciente" es en realidad otro médico
        error: null
      });
      
      // Configurar el comportamiento del mock
      let firstCheckDone = false;
      
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, id) => {
              // La primera vez que se llama es para verificar el primer ID (médico)
              if (!firstCheckDone) {
                firstCheckDone = true;
                return {
                  single: mockDoctorCheck
                };
              } else {
                // La segunda vez es para verificar el segundo ID (también médico)
                return {
                  single: mockSecondDoctorCheck
                };
              }
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis()
        };
      });
      
      const result = await DoctorPatient.assign(doctorId, doctorId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Solo los pacientes pueden ser asignados a médicos');
      expect(mockDoctorCheck).toHaveBeenCalled();
      expect(mockSecondDoctorCheck).toHaveBeenCalled();
    });
    
    test('debería rechazar asignar un paciente a un paciente', async () => {
      // Configurar mocks para simular un paciente tratando de asignar otro paciente
      const mockFromCheck = jest.fn().mockReturnValue({
        data: { role: 'paciente' }, // El "médico" es en realidad un paciente
        error: null
      });
      
      const mockToCheck = jest.fn().mockReturnValue({
        data: { role: 'paciente' },
        error: null
      });
      
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, id) => {
              if (id === patientId) {
                return {
                  single: mockFromCheck
                };
              } else {
                return {
                  single: mockToCheck
                };
              }
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis()
        };
      });
      
      const result = await DoctorPatient.assign(patientId, patientId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Solo los médicos pueden tener pacientes asignados');
      expect(mockFromCheck).toHaveBeenCalled();
    });
  });
}); 