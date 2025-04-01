const { describe, it, expect } = require('@jest/globals');

describe('Ejemplo de prueba unitaria', () => {
  it('debería sumar dos números correctamente', () => {
    expect(1 + 2).toBe(3);
  });
  
  it('debería convertir la cadena a mayúsculas', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
}); 