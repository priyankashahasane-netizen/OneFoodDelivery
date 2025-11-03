module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
      },
    }],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/migrations/**',
    '!**/seeds/**',
    '!**/main.ts',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/config/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs|@typeorm|typeorm|rxjs)/)',
  ],
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
};

