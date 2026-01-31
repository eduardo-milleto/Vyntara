module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'services/**/*.js',
        'routes/**/*.js',
        'integrations/**/*.js',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/*.test.js',
    ],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js',
    ],
    verbose: true,
    testTimeout: 30000,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
