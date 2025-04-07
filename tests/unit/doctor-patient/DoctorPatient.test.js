/**
 * Pruebas unitarias para DoctorPatient
 */

// Mock del módulo de Supabase antes de importar las dependencias
jest.mock("../../../config/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { createTestUser, deleteTestUser } = require("../../setup-supabase");
const { testPatients, testDoctors } = require("../../fixtures/users");

// Importar el módulo después del mock
const DoctorPatient = require("../../../models/DoctorPatient");
const { supabase } = require("../../../config/supabase");
const { v4: uuidv4 } = require("uuid");

describe("DoctorPatient", () => {
  let doctorId;
  let patientId;
  let relationId;

  beforeAll(() => {
    // Crear IDs simulados para las pruebas
    doctorId = "doctor-test-id";
    patientId = "patient-test-id";
    relationId = uuidv4();

    console.log("Tests configurados correctamente");
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe("assign", () => {
    test("debería permitir asignar un paciente a un médico", async () => {
      // Configurar mocks para verificación de roles
      const mockDoctorCheck = jest.fn().mockReturnValue({
        data: { role: "medico" },
        error: null,
      });

      const mockPatientCheck = jest.fn().mockReturnValue({
        data: { role: "paciente" },
        error: null,
      });

      // Configurar mock para verificar si la relación ya existe
      const mockRelationCheck = jest.fn().mockReturnValue({
        data: null,
        error: { code: "PGRST116" }, // Error de no encontrado
      });

      // Configurar mock para la creación de la relación
      const mockInsert = jest.fn().mockReturnValue({
        data: [
          {
            id: relationId,
            doctor_id: doctorId,
            patient_id: patientId,
            status: "active",
          },
        ],
        error: null,
      });

      // Implementación mejorada del mock de Supabase para soportar encadenamiento
      supabase.from.mockImplementation((table) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, id) => {
              if (id === doctorId) {
                return {
                  single: mockDoctorCheck,
                };
              } else {
                return {
                  single: mockPatientCheck,
                };
              }
            }),
          };
        } else if (table === "doctor_patient_relationships") {
          return {
            select: jest.fn().mockImplementation(() => {
              return {
                eq: jest.fn().mockImplementation(() => {
                  return {
                    eq: jest.fn().mockImplementation(() => {
                      return {
                        single: mockRelationCheck,
                      };
                    }),
                    single: mockRelationCheck,
                    order: jest.fn().mockReturnValue({ data: [], error: null }),
                  };
                }),
              };
            }),
            insert: jest.fn().mockImplementation(() => {
              return {
                select: jest.fn().mockReturnValue(mockInsert()),
              };
            }),
            update: jest.fn().mockImplementation(() => {
              return {
                eq: jest.fn().mockImplementation(() => {
                  return {
                    select: jest.fn().mockReturnValue({
                      data: [{ id: relationId, status: "active" }],
                      error: null,
                    }),
                  };
                }),
              };
            }),
          };
        }

        // Mock predeterminado para otras tablas
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockImplementation(() => {
            return {
              select: jest.fn().mockReturnValue({ data: [], error: null }),
            };
          }),
        };
      });

      // Ejecutar la función a probar
      const result = await DoctorPatient.assign(doctorId, patientId);

      // Verificar resultados
      expect(result.success).toBe(true);
      expect(result.relation).toBeDefined();
      expect(result.relation.id).toBe(relationId);
      expect(mockDoctorCheck).toHaveBeenCalled();
      expect(mockPatientCheck).toHaveBeenCalled();
      expect(mockRelationCheck).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    test("debería rechazar asignar un médico a un médico", async () => {
      // Configurar mocks para simular dos médicos
      const mockDoctorCheck = jest.fn().mockReturnValue({
        data: { role: "medico" },
        error: null,
      });

      const mockToCheck = jest.fn().mockReturnValue({
        data: { role: "medico" }, // El "paciente" es en realidad otro médico
        error: null,
      });

      supabase.from.mockImplementation((table) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, id) => {
              // Ambos IDs corresponden a médicos
              return {
                single: id === doctorId ? mockDoctorCheck : mockToCheck,
              };
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
        };
      });

      const result = await DoctorPatient.assign(doctorId, patientId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los pacientes pueden ser asignados a médicos"
      );
      expect(mockDoctorCheck).toHaveBeenCalled();
      expect(mockToCheck).toHaveBeenCalled();
    });

    test("debería rechazar asignar un paciente a un paciente", async () => {
      // Configurar mocks para simular un paciente tratando de asignar otro paciente
      const mockFromCheck = jest.fn().mockReturnValue({
        data: { role: "paciente" }, // El "médico" es en realidad un paciente
        error: null,
      });

      const mockToCheck = jest.fn().mockReturnValue({
        data: { role: "paciente" },
        error: null,
      });

      supabase.from.mockImplementation((table) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, id) => {
              if (id === patientId) {
                return {
                  single: mockFromCheck,
                };
              } else {
                return {
                  single: mockToCheck,
                };
              }
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
        };
      });

      const result = await DoctorPatient.assign(patientId, patientId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los médicos pueden tener pacientes asignados"
      );
      expect(mockFromCheck).toHaveBeenCalled();
    });

    test("debería actualizar el estado si la relación ya existe pero está inactiva", async () => {
      // Configurar mocks para verificación de roles
      const mockDoctorCheck = jest.fn().mockReturnValue({
        data: { role: "medico" },
        error: null,
      });

      const mockPatientCheck = jest.fn().mockReturnValue({
        data: { role: "paciente" },
        error: null,
      });

      // Relación existente pero inactiva
      const existingRelation = {
        id: relationId,
        doctor_id: doctorId,
        patient_id: patientId,
        status: "terminated",
      };

      const mockRelationCheck = jest.fn().mockReturnValue({
        data: existingRelation,
        error: null,
      });

      // Mock para la actualización
      const mockUpdate = jest.fn().mockReturnValue({
        data: [
          {
            id: relationId,
            doctor_id: doctorId,
            patient_id: patientId,
            status: "active",
          },
        ],
        error: null,
      });

      // Configurar la implementación del mock de Supabase
      supabase.from.mockImplementation((table) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, id) => {
              if (id === doctorId) {
                return { single: mockDoctorCheck };
              } else {
                return { single: mockPatientCheck };
              }
            }),
          };
        } else if (table === "doctor_patient_relationships") {
          return {
            select: jest.fn().mockImplementation(() => {
              return {
                eq: jest.fn().mockImplementation(() => {
                  return {
                    eq: jest.fn().mockImplementation(() => {
                      return {
                        single: mockRelationCheck,
                      };
                    }),
                    single: mockRelationCheck,
                  };
                }),
              };
            }),
            update: jest.fn().mockImplementation(() => {
              return {
                eq: jest.fn().mockImplementation(() => {
                  return {
                    select: mockUpdate,
                  };
                }),
              };
            }),
          };
        }
      });

      // Ejecutar la función
      const result = await DoctorPatient.assign(doctorId, patientId);

      // Verificar resultados
      expect(result.success).toBe(true);
      expect(result.relation).toBeDefined();
      expect(mockDoctorCheck).toHaveBeenCalled();
      expect(mockPatientCheck).toHaveBeenCalled();
      expect(mockRelationCheck).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    test("debería devolver la relación existente si ya está activa", async () => {
      // Configurar mocks para verificación de roles
      const mockDoctorCheck = jest.fn().mockReturnValue({
        data: { role: "medico" },
        error: null,
      });

      const mockPatientCheck = jest.fn().mockReturnValue({
        data: { role: "paciente" },
        error: null,
      });

      // Relación ya existente y activa
      const existingRelation = {
        id: relationId,
        doctor_id: doctorId,
        patient_id: patientId,
        status: "active",
      };

      const mockRelationCheck = jest.fn().mockReturnValue({
        data: existingRelation,
        error: null,
      });

      // Configurar la implementación del mock de Supabase
      supabase.from.mockImplementation((table) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, id) => {
              if (id === doctorId) {
                return { single: mockDoctorCheck };
              } else {
                return { single: mockPatientCheck };
              }
            }),
          };
        } else if (table === "doctor_patient_relationships") {
          return {
            select: jest.fn().mockImplementation(() => {
              return {
                eq: jest.fn().mockImplementation(() => {
                  return {
                    eq: jest.fn().mockImplementation(() => {
                      return {
                        single: mockRelationCheck,
                      };
                    }),
                    single: mockRelationCheck,
                  };
                }),
              };
            }),
          };
        }
      });

      // Ejecutar la función
      const result = await DoctorPatient.assign(doctorId, patientId);

      // Verificar resultados
      expect(result.success).toBe(true);
      expect(result.relation).toBe(existingRelation);
      expect(mockDoctorCheck).toHaveBeenCalled();
      expect(mockPatientCheck).toHaveBeenCalled();
      expect(mockRelationCheck).toHaveBeenCalled();
    });
  });

  describe("getPatientsByDoctor", () => {
    test("debería obtener la lista de pacientes de un médico", async () => {
      // Mock de pacientes para la respuesta
      const mockPatients = [
        {
          id: relationId,
          status: "active",
          patient: {
            id: patientId,
            name: "Paciente Test",
            created_at: "2023-01-01T12:00:00",
          },
        },
      ];

      // Configurar el mock de Supabase
      const mockSelect = jest.fn().mockReturnValue({
        data: mockPatients,
        error: null,
      });

      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  eq: jest.fn().mockImplementation(() => {
                    return {
                      order: mockSelect,
                    };
                  }),
                  order: mockSelect,
                };
              }),
            };
          }),
        };
      });

      // Ejecutar la función
      const result = await DoctorPatient.getPatientsByDoctor(doctorId);

      // Verificar resultados
      expect(result.success).toBe(true);
      expect(result.patients).toBeDefined();
      expect(result.patients.length).toBe(1);
      expect(result.patients[0].id).toBe(patientId);
      expect(mockSelect).toHaveBeenCalled();
    });

    test("debería manejar errores al obtener pacientes", async () => {
      // Configurar el mock para simular un error
      const mockError = {
        message: "Error de base de datos",
      };

      const mockSelect = jest.fn().mockReturnValue({
        data: null,
        error: mockError,
      });

      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  eq: jest.fn().mockImplementation(() => {
                    return {
                      order: mockSelect,
                    };
                  }),
                  order: mockSelect,
                };
              }),
            };
          }),
        };
      });

      // Ejecutar la función
      const result = await DoctorPatient.getPatientsByDoctor(doctorId);

      // Verificar manejo de error
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError.message);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe("getDoctorsByPatient", () => {
    test("debería obtener la lista de médicos de un paciente", async () => {
      // Mock de médicos para la respuesta
      const mockDoctors = [
        {
          id: relationId,
          status: "active",
          doctor: {
            id: doctorId,
            name: "Doctor Test",
            created_at: "2023-01-01T12:00:00",
          },
        },
      ];

      // Configurar el mock de Supabase
      const mockSelect = jest.fn().mockReturnValue({
        data: mockDoctors,
        error: null,
      });

      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  eq: jest.fn().mockImplementation(() => {
                    return {
                      order: mockSelect,
                    };
                  }),
                  order: mockSelect,
                };
              }),
            };
          }),
        };
      });

      // Ejecutar la función
      const result = await DoctorPatient.getDoctorsByPatient(patientId);

      // Verificar resultados
      expect(result.success).toBe(true);
      expect(result.doctors).toBeDefined();
      expect(result.doctors.length).toBe(1);
      expect(result.doctors[0].id).toBe(doctorId);
      expect(mockSelect).toHaveBeenCalled();
    });

    test("debería manejar errores al obtener médicos", async () => {
      // Configurar el mock para simular un error
      const mockError = {
        message: "Error de base de datos",
      };

      const mockSelect = jest.fn().mockReturnValue({
        data: null,
        error: mockError,
      });

      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  eq: jest.fn().mockImplementation(() => {
                    return {
                      order: mockSelect,
                    };
                  }),
                  order: mockSelect,
                };
              }),
            };
          }),
        };
      });

      // Ejecutar la función
      const result = await DoctorPatient.getDoctorsByPatient(patientId);

      // Verificar manejo de error
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError.message);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    test("debería eliminar la relación médico-paciente", async () => {
      // Mock de la relación existente
      const mockRelation = {
        id: relationId,
        doctor_id: doctorId,
        patient_id: patientId,
        status: "active",
      };

      // Mock para verificar la relación
      const mockCheck = jest.fn().mockReturnValue({
        data: mockRelation,
        error: null,
      });

      // Mock para la actualización
      const mockUpdate = jest.fn().mockReturnValue({
        data: [{ ...mockRelation, status: "terminated" }],
        error: null,
      });

      // Configurar el mock de Supabase
      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  single: mockCheck,
                };
              }),
            };
          }),
          update: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  select: mockUpdate,
                };
              }),
            };
          }),
        };
      });

      // Ejecutar la función
      const result = await DoctorPatient.remove(relationId, doctorId);

      // Verificar resultados
      expect(result.success).toBe(true);
      expect(result.relation).toBeDefined();
      expect(result.relation.status).toBe("terminated");
      expect(mockCheck).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    test("debería rechazar la eliminación si el usuario no es el médico", async () => {
      // Mock de la relación existente donde el doctor_id es diferente
      const mockRelation = {
        id: relationId,
        doctor_id: uuidv4(), // Diferente al userId que se pasará
        patient_id: patientId,
        status: "active",
      };

      // Mock para verificar la relación
      const mockCheck = jest.fn().mockReturnValue({
        data: mockRelation,
        error: null,
      });

      // Configurar el mock de Supabase
      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  single: mockCheck,
                };
              }),
            };
          }),
        };
      });

      // Ejecutar la función con un userId que no coincide con doctor_id
      const result = await DoctorPatient.remove(relationId, doctorId);

      // Verificar rechazo
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "No tienes permiso para eliminar esta relación"
      );
      expect(mockCheck).toHaveBeenCalled();
    });

    test("debería manejar errores al intentar eliminar una relación", async () => {
      // Configurar el mock para simular un error
      const mockError = {
        message: "Relación no encontrada",
      };

      const mockCheck = jest.fn().mockReturnValue({
        data: null,
        error: mockError,
      });

      // Configurar el mock de Supabase
      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              eq: jest.fn().mockImplementation(() => {
                return {
                  single: mockCheck,
                };
              }),
            };
          }),
        };
      });

      // Ejecutar la función
      const result = await DoctorPatient.remove(relationId, doctorId);

      // Verificar manejo de error
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError.message);
      expect(mockCheck).toHaveBeenCalled();
    });
  });
});
