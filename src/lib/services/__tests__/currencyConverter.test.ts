import { CurrencyConverterService } from '../currencyConverter';
import { logger } from '../../utils/logger';

// Mock the logger to avoid console spam in tests
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logCurrencyConversion: jest.fn(),
  },
}));

describe('CurrencyConverterService', () => {
  let currencyConverter: CurrencyConverterService;

  beforeEach(() => {
    currencyConverter = new CurrencyConverterService();
    jest.clearAllMocks();
  });

  describe('convert', () => {
    it('should return same amount for same currency conversion', () => {
      const result = currencyConverter.convert(100, 'USD', 'USD');
      
      expect(result).toEqual({
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: 'USD',
        rate: 1,
        convertedAmount: 100
      });
    });

    it('should convert USD to AUD correctly', () => {
      const result = currencyConverter.convert(100, 'USD', 'AUD');
      
      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('AUD');
      expect(result.amount).toBe(100);
      expect(result.rate).toBe(1.47); // 1 USD = 1.47 AUD
      expect(result.convertedAmount).toBe(147);
      expect(logger.logCurrencyConversion).toHaveBeenCalledWith('USD', 'AUD', 100, 1.47, 147);
    });

    it('should convert AUD to USD correctly', () => {
      const result = currencyConverter.convert(147, 'AUD', 'USD');
      
      expect(result.fromCurrency).toBe('AUD');
      expect(result.toCurrency).toBe('USD');
      expect(result.amount).toBe(147);
      expect(result.rate).toBeCloseTo(0.6803, 4); // 1 AUD = ~0.6803 USD
      expect(result.convertedAmount).toBeCloseTo(100, 2);
    });

    it('should handle cross-currency conversion (EUR to GBP)', () => {
      const result = currencyConverter.convert(100, 'EUR', 'GBP');
      
      expect(result.fromCurrency).toBe('EUR');
      expect(result.toCurrency).toBe('GBP');
      expect(result.amount).toBe(100);
      // EUR to GBP should be (0.75 / 0.85) = 0.8824
      expect(result.rate).toBeCloseTo(0.8824, 4);
      expect(result.convertedAmount).toBeCloseTo(88.24, 2);
    });

    it('should handle unsupported currency gracefully', () => {
      const result = currencyConverter.convert(100, 'XYZ', 'USD');
      
      expect(result).toEqual({
        amount: 100,
        fromCurrency: 'XYZ',
        toCurrency: 'USD',
        rate: 1,
        convertedAmount: 100
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'CurrencyConverter',
        'Exchange rate not found: XYZ to USD',
        expect.any(Object)
      );
    });

    it('should handle zero amount correctly', () => {
      const result = currencyConverter.convert(0, 'USD', 'EUR');
      
      expect(result.amount).toBe(0);
      expect(result.convertedAmount).toBe(0);
      expect(result.rate).toBe(0.85);
    });

    it('should handle negative amounts correctly', () => {
      const result = currencyConverter.convert(-100, 'USD', 'EUR');
      
      expect(result.amount).toBe(-100);
      expect(result.convertedAmount).toBe(-85);
      expect(result.rate).toBe(0.85);
    });
  });

  describe('getRate', () => {
    it('should return 1 for same currency', () => {
      expect(currencyConverter.getRate('USD', 'USD')).toBe(1);
    });

    it('should return correct rate for USD to AUD', () => {
      expect(currencyConverter.getRate('USD', 'AUD')).toBe(1.47);
    });

    it('should return correct rate for AUD to USD', () => {
      expect(currencyConverter.getRate('AUD', 'USD')).toBeCloseTo(0.6803, 4);
    });

    it('should return 1 for unsupported currency pairs', () => {
      expect(currencyConverter.getRate('XYZ', 'ABC')).toBe(1);
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return all supported currencies', () => {
      const currencies = currencyConverter.getSupportedCurrencies();
      
      expect(currencies).toHaveLength(9);
      expect(currencies).toContain('USD');
      expect(currencies).toContain('AUD');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('GBP');
      expect(currencies).toContain('JPY');
      expect(currencies).toContain('CAD');
      expect(currencies).toContain('CHF');
      expect(currencies).toContain('INR');
      expect(currencies).toContain('CNY');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const formatted = currencyConverter.formatCurrency(1234.56, 'USD');
      expect(formatted).toBe('$1,234.56');
    });

    it('should format EUR correctly', () => {
      const formatted = currencyConverter.formatCurrency(1234.56, 'EUR');
      expect(formatted).toMatch(/1[,.]?234[,.]?56.*€/); // More flexible matching for locale differences
    });

    it('should format JPY without decimals', () => {
      const formatted = currencyConverter.formatCurrency(1234.56, 'JPY');
      expect(formatted).toBe('￥1,235'); // Note: JPY rounds to whole numbers
    });

    it('should fallback to USD format for unsupported currency', () => {
      const formatted = currencyConverter.formatCurrency(1234.56, 'XYZ');
      expect(formatted).toBe('$1,234.56');
    });
  });

  describe('edge cases and validation', () => {
    it('should handle very large numbers', () => {
      const result = currencyConverter.convert(Number.MAX_SAFE_INTEGER, 'USD', 'AUD');
      expect(result.convertedAmount).toBe(Number.MAX_SAFE_INTEGER * 1.47);
    });

    it('should handle very small numbers', () => {
      const result = currencyConverter.convert(0.01, 'USD', 'EUR');
      expect(result.convertedAmount).toBeCloseTo(0.0085, 4);
    });

    it('should maintain precision for financial calculations', () => {
      const result = currencyConverter.convert(123.456789, 'USD', 'EUR');
      expect(result.convertedAmount).toBeCloseTo(104.9387, 3);
    });
  });

  describe('logging integration', () => {
    it('should log currency conversions', () => {
      currencyConverter.convert(100, 'USD', 'EUR');
      
      expect(logger.logCurrencyConversion).toHaveBeenCalledWith(
        'USD',
        'EUR', 
        100,
        0.85,
        85
      );
    });

    it('should debug log same currency conversions', () => {
      currencyConverter.convert(100, 'USD', 'USD');
      
      expect(logger.debug).toHaveBeenCalledWith(
        'CurrencyConverter',
        'Same currency conversion',
        expect.objectContaining({
          amount: 100,
          fromCurrency: 'USD',
          toCurrency: 'USD',
          rate: 1,
          convertedAmount: 100
        })
      );
    });
  });
});