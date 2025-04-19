describe('Example test suite', () => {
    test('should do something', () => {
    });
  });

// import { jest } from '@jest/globals';
// // import { setAlerts, getAlerts } from '../alerts.js';

// // Mock AWS SDK dependencies
// beforeAll(() => {
//   jest.unstable_mockModule('@aws-sdk/client-dynamodb', () => ({
//     QueryCommand: jest.fn(),
//     UpdateItemCommand: jest.fn(),
//     GetItemCommand: jest.fn(),
//     PutItemCommand: jest.fn(),
//     DynamoDBClient: class {
//       send = jest.fn();
//     },
//   }));

//   jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
//     PutObjectCommand: jest.fn(),
//     GetObjectCommand: jest.fn(),
//     S3Client: class {
//       send = jest.fn();
//     },
//   }));

//   jest.unstable_mockModule('@aws-sdk/s3-request-presigner', () => ({
//     getSignedUrl: jest.fn(() => Promise.resolve('https://mock-s3-url.com')),
//   }));

//   jest.unstable_mockModule('../awsConfig.js', () => ({
//     s3Client: { send: jest.fn() },
//     docClient: { send: jest.fn() },
//   }));

//   jest.unstable_mockModule('../stock/dataCollection.js', () => ({
//     stockPerformance: jest.fn(),
//   }));
// });

// let mockS3Send, mockDocSend, stockPerformance, setAlerts, getAlerts;

// beforeAll(async () => {
//   const s3Module = await import('@aws-sdk/client-s3');
//   const dynamoModule = await import('@aws-sdk/client-dynamodb');
//   const stockModule = await import('../stock/dataCollection.js');
//   const alertsModule = await import('../alerts.js');
//   mockS3Send = (await import('../awsConfig.js')).s3Client.send;
//   mockDocSend = (await import('../awsConfig.js')).docClient.send;
//   stockPerformance = stockModule.stockPerformance;
//   setAlerts = alertsModule.setAlerts;
//   getAlerts = alertsModule.getAlerts;
// });

// describe('Alerts Management Unit Tests', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockS3Send.mockReset();
//     mockDocSend.mockReset();
//     stockPerformance.mockReset();
//   });

//   describe('setAlerts', () => {
//     it('should set a new alert successfully', async () => {
//       mockDocSend.mockResolvedValueOnce({ Item: null });
//       mockDocSend.mockResolvedValueOnce({}); 
//       mockS3Send.mockResolvedValueOnce({}); 

//       const result = await setAlerts('user123', {
//         symbol: 'AAPL',
//         thresholdHigh: 150,
//         thresholdLow: 100,
//       });

//       expect(result).toHaveProperty('userId', 'user123');
//       expect(result).toHaveProperty('symbol', 'AAPL');
//       expect(result).toHaveProperty('thresholdHigh', 150);
//       expect(result).toHaveProperty('thresholdLow', 100);
//       expect(result).toHaveProperty('s3Location', 'https://mock-s3-url.com');
//     });

//     it('should update an existing alert successfully', async () => {
//       mockDocSend.mockResolvedValueOnce({
//         Item: { userId: { S: 'user123' }, symbol: { S: 'AAPL' } },
//       });
//       mockDocSend.mockResolvedValueOnce({});
//       mockS3Send.mockResolvedValueOnce({}); 

//       const result = await setAlerts('user123', {
//         symbol: 'AAPL',
//         thresholdHigh: 160,
//       });

//       expect(result).toHaveProperty('thresholdHigh', 160);
//       expect(result).toHaveProperty('s3Location');
//     });

//     it('should return error if symbol is missing', async () => {
//       const result = await setAlerts('user123', {
//         thresholdHigh: 150,
//       });
//       expect(result).toEqual({ error: 'Symbol and at least one threshold required' });
//     });

//     it('should return error if no thresholds are provided', async () => {
//       const result = await setAlerts('user123', { symbol: 'AAPL' });
//       expect(result).toEqual({ error: 'Symbol and at least one threshold required' });
//     });

//     it('should handle DynamoDB get error', async () => {
//       mockDocSend.mockRejectedValueOnce(new Error('DynamoDB error'));
//       const result = await setAlerts('user123', {
//         symbol: 'AAPL',
//         thresholdHigh: 150,
//       });
//       expect(result).toEqual('Error fetching item for AAPL: Error: DynamoDB error');
//     });

//     it('should handle S3 put error', async () => {
//       mockDocSend.mockResolvedValueOnce({ Item: null });
//       mockS3Send.mockRejectedValueOnce(new Error('S3 error'));
//       const result = await setAlerts('user123', {
//         symbol: 'AAPL',
//         thresholdHigh: 150,
//       });
//       expect(result).toEqual({ error: 'Failed to set alert: S3 error' });
//     });
//   });

//   describe('getAlerts', () => {
//     it('should return triggered alerts successfully', async () => {
//       mockDocSend.mockResolvedValueOnce({
//         Items: [
//           {
//             userId: { S: 'user123' },
//             symbol: { S: 'AAPL' },
//             ThresholdHigh: { N: '150' },
//             ThresholdLow: { N: '100' },
//           },
//         ],
//       });
//       stockPerformance.mockResolvedValueOnce({
//         historicalDataResponse: {
//           events: [{ attributes: [{ price: 160 }] }],
//         },
//       });
//       mockS3Send.mockResolvedValueOnce({}); 

//       const result = await getAlerts('user123');
//       expect(result.alerts).toHaveLength(1);
//       expect(result.alerts[0]).toEqual({
//         symbol: 'AAPL',
//         currentPrice: 160,
//         thresholdHigh: 150,
//         type: 'above',
//       });
//       expect(result).toHaveProperty('s3Location', 'https://mock-s3-url.com');
//     });

//     it('should return no alerts if none are triggered', async () => {
//       mockDocSend.mockResolvedValueOnce({
//         Items: [
//           {
//             userId: { S: 'user123' },
//             symbol: { S: 'AAPL' },
//             ThresholdHigh: { N: '150' },
//             ThresholdLow: { N: '100' },
//           },
//         ],
//       });
//       stockPerformance.mockResolvedValueOnce({
//         historicalDataResponse: {
//           events: [{ attributes: [{ price: 120 }] }],
//         },
//       });

//       const result = await getAlerts('user123');
//       expect(result.alerts).toHaveLength(0);
//       expect(result.s3Location).toBeNull();
//     });

//     it('should return error if user has no stocks', async () => {
//       mockDocSend.mockResolvedValueOnce({ Items: [] });
//       const result = await getAlerts('user123');
//       expect(result).toEqual({ error: 'userId user123 has no stocks in portfolio' });
//     });

//     it('should handle DynamoDB query error', async () => {
//       mockDocSend.mockRejectedValueOnce(new Error('DynamoDB error'));
//       const result = await getAlerts('user123');
//       expect(result).toEqual({ error: 'Failed to query stocks: DynamoDB error' });

//     });

//     it('should skip stocks with performance errors', async () => {
//       mockDocSend.mockResolvedValueOnce({
//         Items: [
//           {
//             userId: { S: 'user123' },
//             symbol: { S: 'AAPL' },
//             ThresholdHigh: { N: '150' },
//           },
//           {
//             userId: { S: 'user123' },
//             symbol: { S: 'GOOG' },
//             ThresholdHigh: { N: '2000' },
//           },
//         ],
//       });
//       stockPerformance
//         .mockResolvedValueOnce({
//           historicalDataResponse: { error: 'API error' },
//         })
//         .mockResolvedValueOnce({
//           historicalDataResponse: {
//             events: [{ attributes: [{ price: 2100 }] }],
//           },
//         });
//       mockS3Send.mockResolvedValueOnce({});

//       const result = await getAlerts('user123');
//       expect(result.alerts).toHaveLength(1);
//       expect(result.alerts[0].symbol).toBe('GOOG');
//     });

//     it('should handle S3 put error gracefully', async () => {
//       mockDocSend.mockResolvedValueOnce({
//         Items: [
//           {
//             userId: { S: 'user123' },
//             symbol: { S: 'AAPL' },
//             ThresholdHigh: { N: '150' },
//           },
//         ],
//       });
//       stockPerformance.mockResolvedValueOnce({
//         historicalDataResponse: {
//           events: [{ attributes: [{ price: 160 }] }],
//         },
//       });
//       mockS3Send.mockRejectedValueOnce(new Error('S3 error'));

//       const result = await getAlerts('user123');
//       expect(result.alerts).toHaveLength(1);
//       expect(result.s3Location).toBeNull();
//     });
//   });
// });