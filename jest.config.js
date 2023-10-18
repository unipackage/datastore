module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    setupFiles: [
        'dotenv/config',
        "./jest.setup.js"
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@lib/(.*)$': '<rootDir>/lib/$1',
        '^@app/(.*)$': '<rootDir>/lib/app/$1',
        '^@config/(.*)$': '<rootDir>/lib/config/$1',
        '^@domain/(.*)$': '<rootDir>/lib/domain/$1',
        '^@infrastructure/(.*)$': '<rootDir>/lib/infrastructure/$1',
        '^@shared/(.*)$': '<rootDir>/lib/shared/$1',
    },
};
