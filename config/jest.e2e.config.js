module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  testMatch: ["**/tests/e2e/**/*.test.js", "**/tests/e2e/**/*.e2e.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage/e2e",
  coverageReporters: ["text", "lcov"],
  verbose: true,
  setupFilesAfterEnv: ["./tests/setup.e2e.js"],
  testTimeout: 30000,
};
