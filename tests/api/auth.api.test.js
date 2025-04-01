/**
 * Pruebas para las API REST de autenticación
 */

const request = require('supertest');
const { 
  createTestUser, 
  deleteTestUser 
} = require('../setup-supabase');
const { apiUsers, testPatients } = require('../fixtures/users');

// Obtener la URL del servidor de pruebas
const API_URL = process.env.TEST_API_URL || 'http://localhost:3001';

describe('API de Autenticación', () => {
  // Usuario de prueba
  let testUserId;
  
  // Antes de las pruebas, crear un usuario de prueba
  beforeAll(async () => {
    try {
      // Crear usuario para pruebas de API
      const userData = await createTestUser({
        ...testPatients[0],
        email: apiUsers.validUser.email,
        password: apiUsers.validUser.password
      });
      testUserId = userData.id;
      console.log('Usuario de prueba para API creado:', testUserId);
    } catch (error) {
      console.error('Error en configuración de pruebas API:', error);
    }
  });
  
  // Después de las pruebas, eliminar el usuario de prueba
  afterAll(async () => {
    try {
      await deleteTestUser(testUserId);
      console.log('Usuario de prueba para API eliminado');
    } catch (error) {
      console.error('Error al limpiar usuario de prueba API:', error);
    }
  });
  
  // Prueba de registro de usuario
  describe('POST /api/auth/register', () => {
    // ID temporal para usuario creado en la prueba
    let tempUserId;
    
    // Después de cada prueba, limpiar usuario creado
    afterEach(async () => {
      if (tempUserId) {
        await deleteTestUser(tempUserId);
        tempUserId = null;
      }
    });
    
    test('debería registrar un nuevo usuario correctamente', async () => {
      const uniqueEmail = `api.test.${Date.now()}@example.com`;
      
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send({
          name: 'Usuario API Test',
          email: uniqueEmail,
          password: 'Password123!',
          role: 'paciente'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      
      // Guardar ID para limpieza
      tempUserId = response.body.user.id;
    });
    
    test('debería rechazar registro con datos incompletos', async () => {
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send({
          email: 'incompleto@example.com',
          // Sin nombre ni contraseña
          role: 'paciente'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    test('debería rechazar registro con correo ya existente', async () => {
      const response = await request(API_URL)
        .post('/api/auth/register')
        .send({
          name: 'Usuario Duplicado',
          email: apiUsers.validUser.email, // Email que ya existe
          password: 'Password123!',
          role: 'paciente'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
  
  // Prueba de inicio de sesión
  describe('POST /api/auth/login', () => {
    test('debería iniciar sesión con credenciales correctas', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: apiUsers.validUser.email,
          password: apiUsers.validUser.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });
    
    test('debería rechazar inicio de sesión con credenciales incorrectas', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: apiUsers.validUser.email,
          password: 'contraseña_incorrecta'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    test('debería rechazar inicio de sesión con datos incompletos', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: apiUsers.validUser.email
          // Sin contraseña
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
  
  // Prueba de restablecimiento de contraseña
  describe('POST /api/auth/forgot-password', () => {
    test('debería enviar correo de restablecimiento para usuario existente', async () => {
      const response = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({
          email: apiUsers.validUser.email
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('debería aceptar solicitud para correo no existente (por seguridad)', async () => {
      const response = await request(API_URL)
        .post('/api/auth/forgot-password')
        .send({
          email: 'no.existe@example.com'
        });
      
      // Por seguridad, debería devolver 200 incluso para correos no existentes
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  // Prueba de verificación de token (requiere autenticación)
  describe('GET /api/auth/verify-token', () => {
    let authToken;
    
    // Antes de las pruebas, obtener token de autenticación
    beforeAll(async () => {
      const loginResponse = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: apiUsers.validUser.email,
          password: apiUsers.validUser.password
        });
      
      authToken = loginResponse.body.token;
    });
    
    test('debería verificar token válido', async () => {
      const response = await request(API_URL)
        .get('/api/auth/verify-token')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
    });
    
    test('debería rechazar token inválido', async () => {
      const response = await request(API_URL)
        .get('/api/auth/verify-token')
        .set('Authorization', 'Bearer token_invalido');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
    });
    
    test('debería rechazar solicitud sin token', async () => {
      const response = await request(API_URL)
        .get('/api/auth/verify-token');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
}); 