// Configuración global para pruebas e2e con Puppeteer
process.env.NODE_ENV = 'test';
jest.setTimeout(30000);

const puppeteer = require('puppeteer');

// Variables globales para Puppeteer
global.puppeteer = puppeteer;

// Configuración global para antes de todas las pruebas
beforeAll(async () => {
  // Iniciar el navegador
  global.browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
});

// Configuración global para después de todas las pruebas
afterAll(async () => {
  // Cerrar el navegador
  if (global.browser) {
    await global.browser.close();
  }
}); 