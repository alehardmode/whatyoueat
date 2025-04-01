// Configuración global para pruebas de API
process.env.NODE_ENV = 'test';
jest.setTimeout(15000);

// Importaciones necesarias para pruebas de API
const supertest = require('supertest');
const { app } = require('../server');

// Hacer disponible el cliente de prueba de API globalmente
global.api = supertest(app); 