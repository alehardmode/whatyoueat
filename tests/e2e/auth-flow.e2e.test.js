/**
 * Pruebas E2E para el flujo de autenticación
 */

const puppeteer = require('puppeteer');
const { createTestUser, deleteTestUser } = require('../setup-supabase');
const { testPatients } = require('../fixtures/users');

// URL base para pruebas E2E
const BASE_URL = process.env.TEST_APP_URL || 'http://localhost:3001';

describe('Flujo de Autenticación (E2E)', () => {
  let browser;
  let page;
  let testUserId;
  
  // Configuración: lanzar navegador y crear página
  beforeAll(async () => {
    try {
      // Crear usuario de prueba para login
      const userData = await createTestUser({
        ...testPatients[0],
        email: `e2e.test.${Date.now()}@example.com`,
        password: 'Password123!'
      });
      testUserId = userData.id;
      console.log('Usuario de prueba E2E creado:', testUserId);
      
      // Lanzar navegador
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Crear página
      page = await browser.newPage();
      
      // Establecer tamaño de viewport
      await page.setViewport({ width: 1280, height: 800 });
      
      // Habilitar peticiones de red (opcional para debug)
      page.on('console', msg => console.log('NAVEGADOR:', msg.text()));
    } catch (error) {
      console.error('Error en configuración E2E:', error);
    }
  });
  
  // Limpieza: cerrar navegador y eliminar usuario de prueba
  afterAll(async () => {
    try {
      // Cerrar navegador
      if (browser) {
        await browser.close();
      }
      
      // Eliminar usuario de prueba
      if (testUserId) {
        await deleteTestUser(testUserId);
        console.log('Usuario de prueba E2E eliminado');
      }
    } catch (error) {
      console.error('Error en limpieza E2E:', error);
    }
  });
  
  // Prueba de carga de página de inicio
  test('debería cargar la página de inicio', async () => {
    // Navegar a la URL base
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    
    // Verificar título de la página
    const title = await page.title();
    expect(title).toContain('WhatYouEat');
    
    // Verificar que existe un botón de login
    const loginButton = await page.$('a[href="/auth/login"], button:contains("Iniciar sesión")');
    expect(loginButton).not.toBeNull();
  }, 30000);
  
  // Prueba de registro de usuario
  test('debería permitir registro de un nuevo usuario', async () => {
    // Navegar a la página de registro
    await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'networkidle2' });
    
    // Generar email único para evitar conflictos
    const uniqueEmail = `nuevo.usuario.${Date.now()}@example.com`;
    
    // Rellenar formulario
    await page.type('input[name="name"]', 'Usuario E2E');
    await page.type('input[name="email"]', uniqueEmail);
    await page.type('input[name="password"]', 'Password123!');
    
    // Seleccionar rol (paciente)
    await page.click('input[value="paciente"]');
    
    // Enviar formulario
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    
    // Verificar redirección a página de confirmación o dashboard
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/auth\/confirm|\/dashboard/);
    
    // Verificar mensaje de éxito
    const pageContent = await page.content();
    expect(pageContent).toMatch(/confirm|dashboard|éxito|success/i);
  }, 30000);
  
  // Prueba de inicio de sesión
  test('debería permitir inicio de sesión con credenciales correctas', async () => {
    // Navegar a la página de login
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    
    // Rellenar formulario con credenciales del usuario de prueba
    await page.type('input[name="email"]', testPatients[0].email);
    await page.type('input[name="password"]', testPatients[0].password);
    
    // Enviar formulario
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    
    // Verificar redirección a dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('/dashboard');
    
    // Verificar que se muestra el nombre del usuario
    const pageContent = await page.content();
    expect(pageContent).toContain(testPatients[0].nombre);
  }, 30000);
  
  // Prueba de error de inicio de sesión
  test('debería mostrar error con credenciales incorrectas', async () => {
    // Navegar a la página de login
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    
    // Rellenar formulario con credenciales incorrectas
    await page.type('input[name="email"]', 'usuario@example.com');
    await page.type('input[name="password"]', 'contraseña_incorrecta');
    
    // Enviar formulario
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForResponse(response => response.url().includes('/api/auth/login'))
    ]);
    
    // Verificar mensaje de error
    await page.waitForSelector('.alert-error, .error-message, .text-red-500');
    const errorMessage = await page.$eval(
      '.alert-error, .error-message, .text-red-500', 
      el => el.textContent
    );
    
    expect(errorMessage).toMatch(/incorrecta|inválida|error/i);
  }, 30000);
  
  // Prueba de cierre de sesión
  test('debería permitir cerrar sesión', async () => {
    // Primero iniciar sesión
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    await page.type('input[name="email"]', testPatients[0].email);
    await page.type('input[name="password"]', testPatients[0].password);
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    
    // Hacer click en el botón de cerrar sesión
    await Promise.all([
      page.click('a[href="/auth/logout"], button:contains("Cerrar sesión")'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    
    // Verificar redirección a página de inicio o login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/auth\/login|\/$/);
  }, 30000);
}); 