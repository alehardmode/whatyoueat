module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/api/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage/api',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  setupFilesAfterEnv: ['../tests/setup.api.js'],
  testTimeout: 15000,
}; 