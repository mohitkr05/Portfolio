/**
 * Integration tests for the complete portfolio management flow
 * Tests the end-to-end functionality from CSV upload to portfolio analysis
 */

import { parseCSV, validateCSVRow, convertCSVRowToInvestment, CSVRow } from '@/lib/utils/csv';
import { PortfolioCalculationService } from '@/lib/services/portfolioCalculations';
import { CurrencyConverterService } from '@/lib/services/currencyConverter';
import { Investment } from '@/lib/db/investments';

// Mock external dependencies
jest.mock('@/lib/services/realMarketData');
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logPortfolioCalculation: jest.fn(),
    logInvestmentMetrics: jest.fn(),
    logCurrencyConversion: jest.fn(),
    startTimer: jest.fn(() => jest.fn()), // Return a mock function
  },
  startTimer: jest.fn(() => jest.fn()), // Mock the exported startTimer function
}));

describe('Portfolio Management Integration Tests', () => {
  let portfolioService: PortfolioCalculationService;
  let currencyService: CurrencyConverterService;

  beforeEach(() => {
    portfolioService = new PortfolioCalculationService();
    currencyService = new CurrencyConverterService();
    jest.clearAllMocks();
  });

  describe('CSV Processing to Portfolio Analysis Flow', () => {
    const sampleCSV = `country,security_type,security_name,investment_date,purchase_price,quantity,currency
USA,Stock,AAPL,2023-01-15,150.25,10,USD
Australia,Stock,CBA,2023-02-01,95.50,20,AUD
Germany,ETF,VEUR,2023-03-10,45.80,15,EUR
USA,Bond,TLT,2023-04-05,120.00,5,USD`;

    it('should process CSV through complete pipeline successfully', async () => {
      // Step 1: Parse CSV
      const csvRows = parseCSV(sampleCSV);
      expect(csvRows).toHaveLength(4);

      // Step 2: Validate each row
      const validationResults = csvRows.map(row => validateCSVRow(row));
      validationResults.forEach(errors => {
        expect(errors).toHaveLength(0); // All rows should be valid
      });

      // Step 3: Convert to Investment objects
      const investments = csvRows.map(row => convertCSVRowToInvestment(row));
      expect(investments).toHaveLength(4);
      
      // Verify investment structure
      investments.forEach(investment => {
        expect(investment).toMatchObject({
          country: expect.any(String),
          securityType: expect.any(String),
          securityName: expect.any(String),
          investmentDate: expect.any(String),
          purchasePrice: expect.any(Number),
          quantity: expect.any(Number),
          currency: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });

      // Step 4: Calculate portfolio metrics
      const portfolioMetrics = await portfolioService.calculatePortfolioMetrics(investments, 'USD');
      
      // Verify portfolio metrics structure
      expect(portfolioMetrics).toMatchObject({
        totalInvestment: expect.any(Number),
        currentValue: expect.any(Number),
        totalProfitLoss: expect.any(Number),
        totalProfitLossPercentage: expect.any(Number),
        topPerformers: expect.any(Array),
        underPerformers: expect.any(Array),
        diversificationScore: expect.any(Number),
        riskLevel: expect.stringMatching(/^(Low|Medium|High)$/),
      });

      // Step 5: Verify calculations are mathematically sound
      const calculatedTotal = portfolioMetrics.totalInvestment + portfolioMetrics.totalProfitLoss;
      expect(Math.abs(calculatedTotal - portfolioMetrics.currentValue)).toBeLessThan(0.01);
      
      expect(portfolioMetrics.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(portfolioMetrics.diversificationScore).toBeLessThanOrEqual(100);
    });

    it('should handle multi-currency portfolio correctly', async () => {
      const csvRows = parseCSV(sampleCSV);
      const investments = csvRows.map(row => convertCSVRowToInvestment(row));

      // Test calculations in different base currencies
      const usdMetrics = await portfolioService.calculatePortfolioMetrics(investments, 'USD');
      const eurMetrics = await portfolioService.calculatePortfolioMetrics(investments, 'EUR');
      const audMetrics = await portfolioService.calculatePortfolioMetrics(investments, 'AUD');

      // All should have the same profit/loss percentage (currency independent)
      expect(Math.abs(usdMetrics.totalProfitLossPercentage - eurMetrics.totalProfitLossPercentage)).toBeLessThan(0.01);
      expect(Math.abs(usdMetrics.totalProfitLossPercentage - audMetrics.totalProfitLossPercentage)).toBeLessThan(0.01);

      // Values should be different due to currency conversion
      expect(usdMetrics.totalInvestment).not.toEqual(eurMetrics.totalInvestment);
      expect(usdMetrics.currentValue).not.toEqual(audMetrics.currentValue);

      // But the mathematical relationship should hold for all currencies
      [usdMetrics, eurMetrics, audMetrics].forEach(metrics => {
        const calculatedTotal = metrics.totalInvestment + metrics.totalProfitLoss;
        expect(Math.abs(calculatedTotal - metrics.currentValue)).toBeLessThan(0.01);
      });
    });

    it('should handle invalid CSV data gracefully', async () => {
      const invalidCSV = `country,security_type,security_name,investment_date,purchase_price,quantity,currency
USA,Stock,AAPL,2023-01-15,invalid_price,10,USD
,Stock,MSFT,2023-02-01,200.00,5,USD
Germany,ETF,,2023-03-10,45.80,15,EUR`;

      // Parse CSV manually without filtering to test validation
      const lines = invalidCSV.trim().split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const rawRows = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rawRows.push(row as CSVRow);
      }

      const validationResults = rawRows.map(row => ({
        row,
        errors: validateCSVRow(row)
      }));

      // Should identify validation errors
      expect(validationResults[0].errors.length).toBeGreaterThan(0); // Invalid price
      expect(validationResults[1].errors.length).toBeGreaterThan(0); // Missing country
      expect(validationResults[2].errors.length).toBeGreaterThan(0); // Missing security name

      // Filter out invalid rows
      const validRows = validationResults
        .filter(result => result.errors.length === 0)
        .map(result => result.row);

      expect(validRows).toHaveLength(0); // All rows are invalid in this example
    });
  });

  describe('Currency Conversion Integration', () => {
    it('should maintain consistency across currency conversions', () => {
      const amount = 1000;
      
      // Test round-trip conversion
      const usdToEur = currencyService.convert(amount, 'USD', 'EUR');
      const eurToUsd = currencyService.convert(usdToEur.convertedAmount, 'EUR', 'USD');
      
      // Should be close to original amount (within rounding errors)
      expect(Math.abs(eurToUsd.convertedAmount - amount)).toBeLessThan(0.01);
    });

    it('should handle all supported currency pairs', () => {
      const supportedCurrencies = currencyService.getSupportedCurrencies();
      const testAmount = 100;

      supportedCurrencies.forEach(fromCurrency => {
        supportedCurrencies.forEach(toCurrency => {
          const result = currencyService.convert(testAmount, fromCurrency, toCurrency);
          
          expect(result.amount).toBe(testAmount);
          expect(result.fromCurrency).toBe(fromCurrency);
          expect(result.toCurrency).toBe(toCurrency);
          expect(result.rate).toBeGreaterThan(0);
          expect(result.convertedAmount).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large portfolios efficiently', async () => {
      // Create a large portfolio (100 investments)
      const largePortfolio: Investment[] = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        country: i % 2 === 0 ? 'USA' : 'Australia',
        securityType: 'Stock' as const,
        securityName: `STOCK${i}`,
        investmentDate: '2023-01-01',
        purchasePrice: 100 + (i % 50),
        quantity: 10 + (i % 20),
        currency: i % 2 === 0 ? 'USD' : 'AUD',
        currentPrice: 105 + (i % 30),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const startTime = performance.now();
      const result = await portfolioService.calculatePortfolioMetrics(largePortfolio, 'USD');
      const endTime = performance.now();

      // Should complete within reasonable time (< 1 second for 100 investments)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Results should be valid
      expect(result.totalInvestment).toBeGreaterThan(0);
      expect(result.currentValue).toBeGreaterThan(0);
      expect(typeof result.diversificationScore).toBe('number');
      expect(['Low', 'Medium', 'High']).toContain(result.riskLevel);
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data integrity throughout the pipeline', async () => {
      const testInvestment: Investment = {
        id: 1,
        country: 'USA',
        securityType: 'Stock',
        securityName: 'TEST',
        investmentDate: '2023-01-01',
        purchasePrice: 100,
        quantity: 10,
        currency: 'USD',
        currentPrice: 110,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const metrics = await portfolioService.calculateInvestmentMetrics([testInvestment], 'USD');
      
      // Verify original data is preserved
      expect(metrics[0].id).toBe(testInvestment.id);
      expect(metrics[0].securityName).toBe(testInvestment.securityName);
      expect(metrics[0].purchasePrice).toBe(testInvestment.purchasePrice);
      expect(metrics[0].quantity).toBe(testInvestment.quantity);
      
      // Verify calculated fields are added
      expect(metrics[0]).toHaveProperty('currentValue');
      expect(metrics[0]).toHaveProperty('profitLoss');
      expect(metrics[0]).toHaveProperty('profitLossPercentage');
      expect(metrics[0]).toHaveProperty('daysSinceInvestment');
      
      // Verify calculations
      const expectedCurrentValue = (testInvestment.currentPrice || testInvestment.purchasePrice) * testInvestment.quantity;
      const expectedInvestedValue = testInvestment.purchasePrice * testInvestment.quantity;
      const expectedProfitLoss = expectedCurrentValue - expectedInvestedValue;
      
      expect(metrics[0].currentValue).toBeCloseTo(expectedCurrentValue, 2);
      expect(metrics[0].profitLoss).toBeCloseTo(expectedProfitLoss, 2);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle empty portfolios gracefully', async () => {
      const result = await portfolioService.calculatePortfolioMetrics([], 'USD');
      
      expect(result).toMatchObject({
        totalInvestment: 0,
        currentValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPercentage: 0,
        topPerformers: [],
        underPerformers: [],
        diversificationScore: 0,
        riskLevel: expect.any(String),
      });
    });

    it('should handle extreme values without crashing', async () => {
      const extremeInvestments: Investment[] = [
        {
          id: 1,
          country: 'USA',
          securityType: 'Stock',
          securityName: 'EXTREME1',
          investmentDate: '2023-01-01',
          purchasePrice: Number.MAX_SAFE_INTEGER / 1000,
          quantity: 1,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          country: 'USA',
          securityType: 'Stock',
          securityName: 'EXTREME2',
          investmentDate: '2023-01-01',
          purchasePrice: 0.01,
          quantity: Number.MAX_SAFE_INTEGER / 1000,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      // Should not throw errors
      await expect(
        portfolioService.calculatePortfolioMetrics(extremeInvestments, 'USD')
      ).resolves.toBeDefined();
    });
  });
});