module.exports = {
  rootDir: "../../",
  testEnvironment: "node",
  testMatch: ["**/tests/unit/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  verbose: true,
  setupFilesAfterEnv: ["./tests/setup.js"],
};
