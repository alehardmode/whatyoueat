/**
 * Pruebas unitarias para el módulo UserAuth
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

// Importar el módulo después del mock
const UserAuth = require('../../../models/UserAuth');

describe('UserAuth', () => {
  let testPatientId;
  let testDoctorId;
  
  // Antes de todas las pruebas, crear usuarios de prueba
  beforeAll(async () => {
    try {
      // Crear un paciente y un médico de prueba
      const patientData = await createTestUser(testPatients[0]);
      testPatientId = patientData.id;
      
      const doctorData = await createTestUser(testDoctors[0]);
      testDoctorId = doctorData.id;
      
      console.log('Usuarios de prueba creados:', { testPatientId, testDoctorId });
    } catch (error) {
      console.error('Error en la configuración de pruebas:', error);
    }
  });
  
  // Después de todas las pruebas, eliminar usuarios de prueba
  afterAll(async () => {
    try {
      await deleteTestUser(testPatientId);
      await deleteTestUser(testDoctorId);
      
      // Tiempo para que Supabase procese las eliminaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error al limpiar datos de prueba:', error);
    }
  });
  
  // Prueba de registro
  describe('register', () => {
    let newUserId;
    
    // Después de cada prueba, eliminar usuario creado
    afterEach(async () => {
      if (newUserId) {
        await deleteTestUser(newUserId);
        newUserId = null;
      }
    });
    
    test('debería registrar un nuevo paciente exitosamente', async () => {
      // Generar email único para evitar conflictos
      const uniqueEmail = `test.${Date.now()}@example.com`;
      
      const result = await UserAuth.register(
        'Nuevo Paciente',
        uniqueEmail,
        'password123',
        'paciente'
      );
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBe(uniqueEmail);
      expect(result.user.role).toBe('paciente');
      
      // Guardar ID para limpieza
      newUserId = result.user.id;
    });
    
    test('debería registrar un nuevo médico exitosamente', async () => {
      // Generar email único para evitar conflictos
      const uniqueEmail = `medico.${Date.now()}@example.com`;
      
      const result = await UserAuth.register(
        'Nuevo Médico',
        uniqueEmail,
        'password123',
        'medico'
      );
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBe(uniqueEmail);
      expect(result.user.role).toBe('medico');
      
      // Guardar ID para limpieza
      newUserId = result.user.id;
    });
    
    test('debería rechazar registro con un correo ya existente', async () => {
      // Usar email de usuario de prueba ya creado
      const existingEmail = testPatients[0].email;
      
      const result = await UserAuth.register(
        'Usuario Duplicado',
        existingEmail,
        'password123',
        'paciente'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('debería rechazar registro con rol inválido', async () => {
      const result = await UserAuth.register(
        'Usuario Rol Inválido',
        'rol.invalido@example.com',
        'password123',
        'rol_invalido' // Rol que no es ni paciente ni médico
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('rol debe ser');
    });
  });
  
  // Prueba de inicio de sesión
  describe('login', () => {
    test('debería iniciar sesión con credenciales correctas', async () => {
      const result = await UserAuth.login(
        testPatients[0].email,
        testPatients[0].password
      );
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testPatients[0].email);
      expect(result.user.role).toBe('paciente');
    });
    
    test('debería rechazar inicio de sesión con contraseña incorrecta', async () => {
      const result = await UserAuth.login(
        testPatients[0].email,
        'contraseña_incorrecta'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('debería rechazar inicio de sesión con correo no existente', async () => {
      const result = await UserAuth.login(
        'no.existe@example.com',
        'password123'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  // Prueba de cierre de sesión
  describe('logout', () => {
    test('debería cerrar sesión correctamente', async () => {
      const result = await UserAuth.logout();
      
      expect(result.success).toBe(true);
    });
  });
  
  // Prueba de verificación de correo existente
  describe('checkEmailExists', () => {
    test('debería confirmar que un correo existe', async () => {
      const result = await UserAuth.checkEmailExists(testPatients[0].email);
      
      expect(result.exists).toBe(true);
    });
    
    test('debería confirmar que un correo no existe', async () => {
      const result = await UserAuth.checkEmailExists('no.existe@example.com');
      
      expect(result.exists).toBe(false);
    });
  });
  
  // Prueba de restablecimiento de contraseña
  describe('resetPassword', () => {
    test('debería enviar correo de restablecimiento para usuario existente', async () => {
      const result = await UserAuth.resetPassword(testPatients[0].email);
      
      expect(result.success).toBe(true);
    });
    
    test('debería manejar solicitud para correo no existente', async () => {
      const result = await UserAuth.resetPassword('no.existe@example.com');
      
      // Aunque el correo no existe, por seguridad no debería revelar esta información
      expect(result.success).toBe(true);
    });
  });
}); 