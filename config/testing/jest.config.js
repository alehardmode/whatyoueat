module.exports = {
  rootDir: '../../',
  testEnvironment: 'node', // Ambiente de ejecución para las pruebas (Node.js)
  verbose: true, // Mostrar detalles de cada prueba ejecutada
  // Opcional: Especificar el patrón para encontrar archivos de prueba
  testMatch: ['**/tests/**/*.test.js'],
  // Opcional: Directorios a ignorar
  // testPathIgnorePatterns: ['/node_modules/'],
  // Opcional: Configuración de cobertura de código
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
  // coverageReporters: ['text', 'lcov'],
}; 