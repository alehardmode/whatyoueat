// Configuración global para pruebas de API
process.env.NODE_ENV = 'test';
jest.setTimeout(15000);

// Importaciones necesarias para pruebas de API
const supertest = require('supertest');
// Importar directamente de config/app para evitar que server.js intente iniciar el servidor
const { app } = require('../config/app');
const setupMiddleware = require('../config/middleware');
const setupViews = require('../config/views');
const setupStaticFiles = require('../config/static');
const setupRoutes = require('../config/routes');

// Configurar la aplicación manualmente para pruebas
// Aplicar configuraciones en orden
setupMiddleware(app);
setupViews(app);
setupStaticFiles(app);
setupRoutes(app);

// Asegurarse de que app está definido correctamente
if (!app) {
  console.error('Error: La aplicación no está correctamente importada en pruebas API');
  process.exit(1);
}

// Hacer disponible el cliente de prueba de API globalmente
global.api = supertest(app); 