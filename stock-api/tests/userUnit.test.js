import { jest } from '@jest/globals';
import { getHashOf } from '../helper.js';


beforeAll(() => {
  jest.unstable_mockModule('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: class {
      send = jest.fn();
    },
  }));

  jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
    const mockSend = jest.fn();
    return {
      PutCommand: jest.fn(),
      GetCommand: jest.fn(),
      ScanCommand: jest.fn(),
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
});

let userRegister, userLogin, mockSend;
beforeAll(async () => {
  const libDynamodb = await import('@aws-sdk/lib-dynamodb');
  mockSend = libDynamodb.__mockSend;
  const userModule = await import('../user.js');
  userRegister = userModule.userRegister;
  userLogin = userModule.userLogin;
});

describe('User Authentication Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
  });

  describe('userRegister', () => {
    it('should register a new user successfully', async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({});
      const result = await userRegister('dev@gmail.com', 'devMango1', 'devMango');
      expect(result).toHaveProperty('userId');
    });

    it('should return error for invalid email', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const result = await userRegister('invalidemail', 'devMango1', 'devMango');
      expect(result).toEqual({ error: 'invalid email' });
    });

    it('should return error for existing email', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ Email: 'dev@gmail.com' }],
      });
      const result = await userRegister('dev@gmail.com', 'devMango1', 'devMango');
      expect(result).toEqual({ error: 'email already in use' });
    });

    it('should return error for password too short', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const result = await userRegister('dev1@gmail.com', 'short', 'devMango');
      expect(result).toEqual({ error: 'password too short' });
    });

    it('should return error for invalid characters in name', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const result = await userRegister('dev1@gmail.com', 'devMango1', 'devMango@');
      expect(result).toEqual({ error: 'invalid characters in name' });
    });

    it('should return error for password without numbers and cases', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const result = await userRegister('dev2@gmail.com', 'nouppercaseornumbers', 'devMango');
      expect(result).toEqual({ error: 'password is must contain upper and lowwerCase' });
    });
  });

  describe('userLogin', () => {
    it('should login successfully with correct credentials', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ Email: 'dev@gmail.com', Password: getHashOf('devMango1'), userId: '123' }],
      });
      const result = await userLogin('dev@gmail.com', 'devMango1');
      expect(result).toEqual({ UserId: expect.any(String) });
    });

    it('should return error for non-existent email', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const result = await userLogin('notregistered@gmail.com', 'devMango1');
      expect(result).toEqual({ error: 'Email address does not exist' });
    });

    it('should return error for incorrect password', async () => {
      mockSend
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          Items: [{ Email: 'dev3@gmail.com', Password: 'devMango1', userId: '456' }],
        });
      const registerResult = await userRegister('dev3@gmail.com', 'devMango1', 'devMango');
      expect(registerResult).toHaveProperty('userId');

      const loginResult = await userLogin('dev3@gmail.com', 'devMango2');
      expect(loginResult).toEqual({ error: 'Password is not correct for the given email' });
    });
  });
});