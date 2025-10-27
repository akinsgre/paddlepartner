module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup-cjs.js'],
  testMatch: [
    '<rootDir>/tests/simple-smoke.test.js',
    '<rootDir>/tests/working-integration.test.js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/integration.test.js',
    '<rootDir>/tests/e2e-smoke.test.js'
  ],
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true
}