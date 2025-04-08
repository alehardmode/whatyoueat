module.exports = {
  rootDir: "../../",
  testEnvironment: "node",
  testMatch: [
    "**/tests/integration/**/*.integration.test.js",
    "**/tests/integration/**/*.test.js",
  ],
  collectCoverage: true,
  coverageDirectory: "coverage/integration",
  coverageReporters: ["text", "lcov"],
  verbose: true,
  setupFilesAfterEnv: ["./tests/setup.js"],
  testTimeout: 15000,
};
