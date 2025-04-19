export default {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverage: true,
    collectCoverageFrom: [
      'stock-api/user.js',
      'stock-api/portfolio.js',
      'stock-api/stock/performance.js'
    ],
    coverageDirectory: 'coverage',
    transform: {
        '^.+\\.js$': 'babel-jest',
      },
  };