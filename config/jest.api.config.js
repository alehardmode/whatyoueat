module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  testMatch: ["**/tests/api/**/*.test.js", "**/tests/api/**/*.api.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage/api",
  coverageReporters: ["text", "lcov"],
  verbose: true,
  setupFilesAfterEnv: ["./tests/setup.js"],
  testTimeout: 15000,
};
