export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  transformIgnorePatterns: [
    '^(?!.*node_modules/(?:arctic|jose|@oslojs)/)(?:.*node_modules/.*)$',
  ],
  moduleNameMapper: {
    'database/prisma\\.js$': '<rootDir>/tests/mocks/prisma.ts',
    'google\\.provider\\.js$': '<rootDir>/tests/mocks/google.provider.ts',
    'github\\.provider\\.js$': '<rootDir>/tests/mocks/github.provider.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  clearMocks: true,
};
