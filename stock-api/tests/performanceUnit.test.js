import { expect, jest } from '@jest/globals';
import { calMeanReversion, calMomentumIndicators, calVolumeTrends, calculateTrends, macdTrend } from '../stock/performance';

jest.unstable_mockModule('calc-rsi', () => {
  return {
    default: class RSI {
      constructor(data, period) {
        this.data = data;
        this.period = period;
      }
      calculate(callback) {
        callback(null, Array(15).fill({ rsi: 70 }));
      }
    },
  };
});

jest.unstable_mockModule('macd', () => ({
  default: jest.fn(() => ({
    MACD: Array(200).fill(1.5),
    signal: Array(200).fill(1.0),
    histogram: Array(200).fill(0.5),
  })),
}));

describe('Stock Trends Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calVolumeTrends', () => {
    const historicalData = Array(50).fill().map((_, i) => ({ volume: 100 + i }));

    it('should detect a volume spike when current volume is 1.5x average', () => {
      const currentVolume = 225;
      const result = calVolumeTrends(historicalData, currentVolume);
      expect(result.volume_spike).toBe(true);
    });

    it('should detect unusual movement when volume is in 95th percentile', () => {
      const currentVolume = 149;
      const result = calVolumeTrends(historicalData, currentVolume);
      expect(result.unusual_movement).toBe(true);
    });

    it('should detect unusual movement when volume is in5th percentile', () => {
      const currentVolume = 100;
      const result = calVolumeTrends(historicalData, currentVolume);
      expect(result.unusual_movement).toBe(true);
    });

    it('should not detect unusual movement when volume is within normal range', () => {
      const currentVolume = 125;
      const result = calVolumeTrends(historicalData, currentVolume);
      expect(result.unusual_movement).toBe(false);
    });
  });

  describe('macdTrend', () => {
    it('should return bullish when MACD > signal', () => {
      const result = macdTrend(1.5, 1.0);
      expect(result).toBe('bullish');
    });

    it('should return bearish when MACD < signal', () => {
      const result = macdTrend(1.0, 1.5);
      expect(result).toBe('bearish');
    });

    it('should return neutral when MACD equals signal', () => {
      const result = macdTrend(1.0, 1.0);
      expect(result).toBe('neutral');
    });
  });

  describe('calMomentumIndicators', () => {
    const closingPriceData50 = Array(50).fill(100);
    const closingPriceData200 = Array(200).fill(100);

    it('should calculate momentum indicators correctly', async () => {
      const result = await calMomentumIndicators(closingPriceData50, closingPriceData200);
      expect(result).toHaveProperty('moving_average_50', 100.000);
      expect(result).toHaveProperty('moving_average_200', 100.000);
      expect(result).toHaveProperty('rsi', 100);
      expect(result).toHaveProperty('MACD');
      expect(result.MACD).toHaveProperty('macdLine', 0);
      expect(result.MACD).toHaveProperty('signalLine', 0);
      expect(result.MACD).toHaveProperty('macdTrend', 'neutral');
    });

    it('should handle varying price data', async () => {
      const varied50 = Array(50).fill().map((_, i) => 100 + i);
      const varied200 = Array(200).fill().map((_, i) => 100 + i);
      const result = await calMomentumIndicators(varied50, varied200);
      expect(result.moving_average_50).toBeCloseTo(124.5, 1);
      expect(result.moving_average_200).toBeCloseTo(199.5, 1);
    });
  });

  describe('calMeanReversion', () => {
    const data_200 = Array(200).fill(100);

    it('should calculate mean reversion with no deviation', () => {
      const result = calMeanReversion(data_200);
      expect(result.historical200Avg).toBe(100.000);
      expect(result.priceDeviation).toBe(0.000);
      expect(result.relativePriceDeviation).toBe(0.000);
    });

    it('should calculate mean reversion with positive deviation', () => {
      const deviatedData = [...data_200.slice(0, -1), 110];
      const result = calMeanReversion(deviatedData);
      expect(result.historical200Avg).toBeCloseTo(100.05, 2);
      expect(result.priceDeviation).toBeCloseTo(9.95, 2);
      expect(result.relativePriceDeviation).toBeCloseTo(9.95, 2);
    });

    it('should calculate mean reversion with negative deviation', () => {
      const deviatedData = [...data_200.slice(0, -1), 90];
      const result = calMeanReversion(deviatedData);
      expect(result.historical200Avg).toBeCloseTo(99.95, 1);
      expect(result.priceDeviation).toBeCloseTo(-9.95, 1);
      expect(result.relativePriceDeviation).toBeCloseTo(-9.95, 1);
    });
  });

  describe('calculateTrends', () => {
    const historicalData = Array(200).fill().map((_, i) => ({
      close: 100 + i / 10,
      volume: 100 + i,
    }));
    const currentVolume = 300;

    it('should calculate all trends correctly', async () => {
      const result = await calculateTrends(historicalData, currentVolume);
      expect(result).toHaveProperty('trends');
      expect(result.trends).toHaveProperty('volume_spike');
      expect(result.trends).toHaveProperty('unusual_movement');
      expect(result).toHaveProperty('momentum_indicators');
      expect(result).toHaveProperty('mean_reversion');
    });
  });
});