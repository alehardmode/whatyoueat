const { describe, it, expect } = require('@jest/globals');

describe('Ejemplo de prueba de API', () => {
  it('debería responder con código 200 en la ruta principal', async () => {
    const response = await global.api.get('/');
    expect(response.status).toBe(200);
  });
  
  it('debería responder con código 404 en una ruta que no existe', async () => {
    const response = await global.api.get('/ruta-que-no-existe');
    expect(response.status).toBe(404);
  });
}); 