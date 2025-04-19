import { jest } from '@jest/globals';

beforeAll(() => {
  jest.unstable_mockModule('@aws-sdk/client-dynamodb', () => ({
    GetItemCommand: jest.fn(),
    DynamoDBClient: class {
      send = jest.fn();
    },
  }));

  jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
    const mockSend = jest.fn();
    return {
      PutCommand: jest.fn(),
      GetCommand: jest.fn(),
      QueryCommand: jest.fn(),
      BatchWriteCommand: jest.fn(),
      DeleteCommand: jest.fn(),
      UpdateCommand: jest.fn(),
      DynamoDBDocumentClient: {
        from: jest.fn(() => ({
          send: mockSend,
        })),
      },
      __mockSend: mockSend,
    };
  });

  jest.unstable_mockModule('../stock/dataCollection.js', () => ({
    validStockCheck: jest.fn(),
    getSector: jest.fn(() => 'Technology'),
    quoteStockInfo: jest.fn(() => ({ price: 160 })),
  }));
});

let createPortfolio, deletePortfolio, getAllocation, assetRemove, portfolioPerformance, mockSend, validStockCheck, getSector, quoteStockInfo;

beforeAll(async () => {
  const libDynamodb = await import('@aws-sdk/lib-dynamodb');
  mockSend = libDynamodb.__mockSend;
  const stockModule = await import('../stock/dataCollection.js');
  validStockCheck = stockModule.validStockCheck;
  getSector = stockModule.getSector;
  quoteStockInfo = stockModule.quoteStockInfo;
  const portfolioModule = await import('../portfolio.js');
  createPortfolio = portfolioModule.createPortfolio;
  deletePortfolio = portfolioModule.deletePortfolio;
  getAllocation = portfolioModule.getAllocation;
  assetRemove = portfolioModule.assetRemove;
  portfolioPerformance = portfolioModule.portfolioPerformance;
});

describe('Portfolio Management Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
    validStockCheck.mockReset();
    getSector.mockReset();
    quoteStockInfo.mockReset();
  });

  describe('createPortfolio', () => {
    it('should create a portfolio successfully with valid assets', async () => {
      mockSend.mockResolvedValueOnce({ Item: { userId: 'user123' } })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});
      validStockCheck.mockResolvedValue({});
      const result = await createPortfolio('user123', [{ symbol: 'AAPL', price: 150, quantity: 10, date: '2024-01-01' }]);
      expect(result).toHaveProperty('successful', ['AAPL']);
    });

    it('should return error if user does not exist', async () => {
      mockSend.mockResolvedValueOnce({});
      const result = await createPortfolio('invalidUser', [{ symbol: 'AAPL', price: 150, quantity: 10, date: '2024-01-01' }]);
      expect(result).toEqual({ error: 'User invalidUser does not exist' });
    });

    it('should handle invalid date in assets', async () => {
      mockSend.mockResolvedValueOnce({ Item: { userId: 'user123' } });
      const result = await createPortfolio('user123', [{ symbol: 'AAPL', price: 150, quantity: 10, date: 'invalid-date' }]);
      expect(result).toHaveProperty('error');
      expect(result.details[0]).toStrictEqual({"reason": "error: invalid date", "symbol": "AAPL"});
    });

    it('should handle invalid stock', async () => {
      mockSend.mockResolvedValueOnce({ Item: { userId: 'user123' } })
              .mockResolvedValueOnce({});
      validStockCheck.mockResolvedValue({ error: 'Invalid stock symbol' });
      const result = await createPortfolio('user123', [{ symbol: 'INVALID', price: 150, quantity: 10, date: '2024-01-01' }]);
      expect(result).toHaveProperty('error');
      expect(result.details[0]).toStrictEqual({"reason": "Invalid stock symbol", "symbol": "INVALID"});
    });

    it('should handle DynamoDB error', async () => {
      mockSend.mockResolvedValueOnce({ Item: { userId: 'user123' } })
              .mockRejectedValueOnce(new Error('DynamoDB error'));
      const result = await createPortfolio('user123', [{ symbol: 'AAPL', price: 150, quantity: 10, date: '2024-01-01' }]);
      expect(result).toHaveProperty('error');
      expect(result.details[0]).toStrictEqual({"reason": "DynamoDB error", "symbol": "AAPL"});
    });

    it('should handle partial success and failure', async () => {
      mockSend.mockResolvedValueOnce({ Item: { userId: 'user123' } })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});
      validStockCheck.mockResolvedValueOnce({})
                          .mockResolvedValueOnce({ error: 'Invalid stock symbol' });
      const result = await createPortfolio('user123', [
        { symbol: 'AAPL', price: 150, quantity: 10, date: '2024-01-01' },
        { symbol: 'INVALID', price: 150, quantity: 10, date: '2024-01-01' },
      ]);
      expect(result).toHaveProperty('successful', ['AAPL']);
      expect(result).toHaveProperty('failed');
      expect(result.failed[0]).toMatch(/INVALID: Invalid stock symbol/);
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio successfully', async () => {
      mockSend.mockResolvedValueOnce({ Items: [{ userId: 'user123', symbol: 'AAPL' }] })
              .mockResolvedValueOnce({});
      const result = await deletePortfolio('user123');
      expect(result).toEqual({ message: 'Portfolio deleted successfully for Id: user123' });
    });

    it('should return error if portfolio has no assets', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const result = await deletePortfolio('user123');
      expect(result).toEqual({ error: "Portfolio with Id 'user123' has no assets." });
    });

    it('should handle DynamoDB error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));
      const result = await deletePortfolio('user123');
      expect(result).toEqual({ error: 'Error deleting portfolio: DynamoDB error' });
    });
  });

  describe('getAllocation', () => {
    it('should return correct portfolio allocation', async () => {
      mockSend.mockResolvedValueOnce({ Items: [{ userId: 'user123', symbol: 'AAPL', Transactions: [{ price: 150, quantity: 10, date: '2024-01-01' }] }] });
      getSector.mockResolvedValue('Technology');
      const result = await getAllocation('user123');
      expect(result).toHaveProperty('sectorAllocations');
      expect(result.sectorAllocations[0].sector).toBe('Technology');
    });

    it('should return error if no assets exist', async () => {
      mockSend.mockResolvedValueOnce({ Items: null });
      const result = await getAllocation('user123');
      expect(result).toEqual({ error: "Portfolio with Id 'user123' has no assets." });
    });

    it('should return error if userId is missing', async () => {
      const result = await getAllocation(null);
      expect(result).toEqual({ error: 'Enter Portfolio ID' });
    });

    it('should handle DynamoDB error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));
      const result = await getAllocation('user123');
      expect(result).toEqual({ error: 'Error retrieving allocation: DynamoDB error' });
    });
  });

  describe('assetRemove', () => {
    it('should remove an asset successfully', async () => {
      mockSend.mockResolvedValueOnce({ Item: { userId: 'user123', symbol: 'AAPL' } })
              .mockResolvedValueOnce({});
      const result = await assetRemove('user123', 'AAPL');
      expect(result).toEqual({ message: 'Asset successfully removed', userId: 'user123', symbol: 'AAPL' });
    });

    it('should return error if userId is missing', async () => {
      const result = await assetRemove(null, 'AAPL');
      expect(result).toEqual({ error: 'Enter Portfolio ID' });
    });

    it('should return error if symbol is missing', async () => {
      const result = await assetRemove('user123', null);
      expect(result).toEqual({ error: 'Enter stock symbol' });
    });

    it('should return error if asset does not exist', async () => {
      mockSend.mockResolvedValueOnce({});
      const result = await assetRemove('user123', 'AAPL');
      expect(result).toEqual({ error: "Portfolio 'user123' does not contain symbol'AAPL'" });
    });

    it('should handle DynamoDB error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));
      const result = await assetRemove('user123', 'AAPL');
      expect(result).toEqual({ error: 'Error while updating assets: DynamoDB error' });
    });
  });

  describe('portfolioPerformance', () => {
    it('should return portfolio performance data with gain', async () => {
      mockSend.mockResolvedValueOnce({ Items: [{ userId: 'user123', symbol: 'AAPL', Transactions: [{ price: 150, quantity: 10, date: '2024-01-01' }] }] });
      quoteStockInfo.mockResolvedValue({ price: 160 });
      const result = await portfolioPerformance('user123');
      expect(result).toHaveProperty('stocks');
      expect(result).toHaveProperty('totals');
      expect(result.totals.gainLoss).toBeGreaterThan(0);
      expect(result.totals.overall).toBe('up');
    });

    it('should return portfolio performance data with loss', async () => {
      mockSend.mockResolvedValueOnce({ Items: [{ userId: 'user123', symbol: 'AAPL', Transactions: [{ price: 150, quantity: 10, date: '2024-01-01' }] }] });
      quoteStockInfo.mockResolvedValue({ price: 140 });
      const result = await portfolioPerformance('user123');
      expect(result.totals.gainLoss).toBeLessThan(0);
      expect(result.totals.overall).toBe('down');
    });

    it('should return portfolio performance data with neutral', async () => {
      mockSend.mockResolvedValueOnce({ Items: [{ userId: 'user123', symbol: 'AAPL', Transactions: [{ price: 150, quantity: 10, date: '2024-01-01' }] }] });
      quoteStockInfo.mockResolvedValue({ price: 150 });
      const result = await portfolioPerformance('user123');
      expect(result.totals.gainLoss).toBe(0);
      expect(result.totals.overall).toBe('neutral');
    });

    it('should return error if no assets exist', async () => {
      mockSend.mockResolvedValueOnce({ Items: null });
      const result = await portfolioPerformance('user123');
      expect(result).toEqual({ error: "Portfolio with Id 'user123' has no assets." });
    });

    it('should handle DynamoDB error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));
      const result = await portfolioPerformance('user123');
      expect(result).toEqual({ error: 'Error getting portfolio performance: DynamoDB error' });
    });
  });
});