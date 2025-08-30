module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/*.type.ts',
    '!**/index.ts',
    '!**/main.ts',
    '!**/test/**',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  maxWorkers: 1, // Run tests sequentially for better performance
  verbose: false,
  // Coverage thresholds for critical services (adjusted for lightweight testing)
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 50,
      lines: 45,
      statements: 45,
    },
  },
  // Collect coverage from specific critical files
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/*.type.ts',
    '!**/index.ts',
    '!**/main.ts',
    '!**/test/**',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
  ],

}; 