/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  collectCoverageFrom: [
    'apps/api/src/modules/identity/**/*.ts',
    'apps/api/src/modules/attestations/**/*.ts',
    'apps/provenance-worker/src/ssrf-guard.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  }
};
