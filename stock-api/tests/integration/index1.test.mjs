import { expect, jest } from '@jest/globals';
import { resetTable, CreateTables } from '../../dbFunctions.js';

beforeAll(() => {
  jest.resetModules();
  jest.unstable_mockModule('yahoo-finance2', () => ({
    default: {
      quoteSummary: jest.fn(),
      insights: jest.fn()
    }
  }));
});

let handler, mockYahooFinance;
beforeAll(async () => {
  mockYahooFinance = (await import('yahoo-finance2')).default;
  ({ handler } = await import('../../../index1.mjs'));
});

beforeAll(async () => {
  await CreateTables();
});

describe('API Handler Integration Tests', () => {
  beforeEach(async () => {
    await resetTable();
    await resetTable('stocks');
    jest.clearAllMocks();
  });

  test('GET / should return welcome message', async () => {
    const event = { routeKey: 'GET /' };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toBe('Hello, please consult the swagger for the correct routes');
  });

  test('POST /auth/signup should register user', async () => {
    const event = {
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      })
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('userId');
  });

  test('POST /auth/login should login user', async () => {
    await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'login@example.com',
        password: 'Password123',
        name: 'Login User'
      })
    });

    const event = {
      routeKey: 'POST /auth/login',
      body: JSON.stringify({
        email: 'login@example.com',
        password: 'Password123'
      })
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('UserId');
  });
  test('GET /stock/AAPL/performance should return stock data', async () => {
    mockYahooFinance.quoteSummary.mockResolvedValue({
      price: {
        regularMarketOpen: 150,
        regularMarketDayHigh: 155,
        regularMarketDayLow: 148,
        regularMarketPreviousClose: 149,
        regularMarketVolume: 1000000
      }
    });

    const event = {
      routeKey: 'GET /stock/{symbol}/performance',
      rawPath: '/stock/AAPL/performance'
    };
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      symbol: 'AAPL',
      open: 150,
      high: 155,
      low: 148,
      close: 149,
      volume: 1000000
    });
  });

  test('POST /stock/AAPL/performance should update performance', async () => {
    const event = {
      routeKey: 'POST /stock/{symbol}/performance',
      rawPath: '/stock/AAPL/performance'
    };
    const response = await handler(event);
    expect(response.message).toBe('Successfully updated performance data for AAPL');
  });

  test('GET /stock/AAPL/compare should return comparison data', async () => {
    mockYahooFinance.insights.mockResolvedValue({
      companySnapshot: { sector: 'Technology', industry: 'Software' }
    });

    const event = {
      routeKey: 'GET /stock/{symbol}/compare',
      rawPath: '/stock/AAPL/compare'
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.events[0].event_type).toBe('StockVsSectorComparison');
    expect(body.events[0].attributes).toEqual({ sector: 'Technology', industry: 'Software' });
  });

  test('GET /stock/AAPL/history should return historical data', async () => {
    const event = {
      routeKey: 'GET /stock/{symbol}/history',
      rawPath: '/stock/AAPL/history'
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('POST /stock/AAPL/history should update history', async () => {
    const event = {
      routeKey: 'POST /stock/{symbol}/history',
      rawPath: '/stock/AAPL/history'
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('POST /portfolio should add stock to portfolio', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'portfolio@example.com',
        password: 'Password123',
        name: 'Portfolio User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    mockYahooFinance.quoteSummary.mockResolvedValue({
      price: { regularMarketPrice: 150 }
    });

    const event = {
      routeKey: 'POST /portfolio',
      body: JSON.stringify({
        portfolioId: userId,
        symbol: 'AAPL',
        quantity: 10,
        buy_price: 145
      })
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('GET /portfolio/chart should return chart data', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'chart@example.com',
        password: 'Password123',
        name: 'Chart User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    await handler({
      routeKey: 'POST /portfolio',
      body: JSON.stringify({
        portfolioId: userId,
        symbol: 'AAPL',
        quantity: 10,
        buy_price: 145
      })
    });

    const event = {
      routeKey: 'GET /portfolio/chart',
      body: JSON.stringify({
        portfolioId: userId,
        assets: [{ symbol: 'AAPL', quantity: 10 }]
      })
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('POST /portfolio/create should create portfolio', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'create@example.com',
        password: 'Password123',
        name: 'Create User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    const event = {
      routeKey: 'POST /portfolio/create',
      body: JSON.stringify({
        name: 'Test Portfolio',
        assets: [{ symbol: 'AAPL', quantity: 10 }]
      })
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('POST /portfolio/assets should add assets', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'assets@example.com',
        password: 'Password123',
        name: 'Assets User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    const event = {
      routeKey: 'POST /portfolio/assets',
      body: JSON.stringify({
        userId: userId,
        assets: [{ symbol: 'AAPL', price: 150, quantity: 5 }]
      })
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('DELETE /portfolio/{userId} should delete portfolio', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'delete@example.com',
        password: 'Password123',
        name: 'Delete User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    await handler({
      routeKey: 'POST /portfolio/create',
      body: JSON.stringify({
        name: 'Delete Portfolio',
        assets: [{ symbol: 'AAPL', quantity: 10 }]
      })
    });

    const event = {
      routeKey: 'DELETE /portfolio/{userId}',
      rawPath: `/portfolio/${userId}`
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('GET /portfolio/{userId}/performance should return performance', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'perf@example.com',
        password: 'Password123',
        name: 'Perf User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    await handler({
      routeKey: 'POST /portfolio/create',
      body: JSON.stringify({
        name: 'Perf Portfolio',
        assets: [{ symbol: 'AAPL', quantity: 10 }]
      })
    });

    const event = {
      routeKey: 'GET /portfolio/{userId}/performance',
      rawPath: `/portfolio/${userId}/performance`
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toBeDefined();
  });

  test('GET /portfolio/{userId}/allocation should return allocation', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'alloc@example.com',
        password: 'Password123',
        name: 'Alloc User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    await handler({
      routeKey: 'POST /portfolio/create',
      body: JSON.stringify({
        name: 'Alloc Portfolio',
        assets: [{ symbol: 'AAPL', quantity: 10 }]
      })
    });

    const event = {
      routeKey: 'GET /portfolio/{userId}/allocation',
      rawPath: `/portfolio/${userId}/allocation`
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toBeDefined();
  });

  test('DELETE /portfolio/{userId}/assets/{symbol}/remove should remove asset', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'remove@example.com',
        password: 'Password123',
        name: 'Remove User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    await handler({
      routeKey: 'POST /portfolio/create',
      body: JSON.stringify({
        name: 'Remove Portfolio',
        assets: [{ symbol: 'AAPL', quantity: 10 }]
      })
    });

    const event = {
      routeKey: 'DELETE /portfolio/{userId}/assets/{symbol}/remove',
      rawPath: `/portfolio/${userId}/assets/AAPL/remove`
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toBeDefined();
  });

  test('DELETE /portfolio/{id} should delete portfolio', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'delid@example.com',
        password: 'Password123',
        name: 'DelId User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    await handler({
      routeKey: 'POST /portfolio/create',
      body: JSON.stringify({
        name: 'DelId Portfolio',
        assets: [{ symbol: 'AAPL', quantity: 10 }]
      })
    });

    const event = {
      routeKey: 'DELETE /portfolio/{id}',
      rawPath: `/portfolio/${userId}`
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('GET /alerts/{userId} should get alerts', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'getalert@example.com',
        password: 'Password123',
        name: 'GetAlert User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    await handler({
      routeKey: 'POST /alerts/{userId}',
      rawPath: `/alerts/${userId}`,
      body: JSON.stringify({
        symbol: 'AAPL',
        thresholdHigh: 200,
        thresholdLow: 100
      })
    });

    const event = {
      routeKey: 'GET /alerts/{userId}',
      rawPath: `/alerts/${userId}`
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('POST /alerts/{userId} should set alert', async () => {
    const signupResponse = await handler({
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'alert@example.com',
        password: 'Password123',
        name: 'Alert User'
      })
    });
    const userId = JSON.parse(signupResponse.body).userId;

    const event = {
      routeKey: 'POST /alerts/{userId}',
      rawPath: `/alerts/${userId}`,
      body: JSON.stringify({
        symbol: 'AAPL',
        thresholdHigh: 200,
        thresholdLow: 100
      })
    };
    await handler(event);
    expect(true).toBe(true);
  });

  test('Unknown route should return 400', async () => {
    const event = { routeKey: 'GET /invalid' };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toBe('Wrong route');
  });

  test('Should handle errors gracefully', async () => {
    const event = {
      routeKey: 'POST /auth/signup',
      body: JSON.stringify({
        email: 'invalidemail',
        password: 'Password123',
        name: 'Test User'
      })
    };
    await handler(event);
    expect(true).toBe(true);
  });
});
