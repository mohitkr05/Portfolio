import { Investment } from '@/lib/db/investments';

/**
 * Test utilities and helpers for portfolio testing
 */

export const createMockInvestment = (overrides: Partial<Investment> = {}): Investment => ({
  id: 1,
  country: 'USA',
  securityType: 'Stock',
  securityName: 'MOCK',
  investmentDate: '2023-01-01',
  purchasePrice: 100,
  quantity: 10,
  currency: 'USD',
  currentPrice: 105,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPortfolio = (size: number = 3): Investment[] => {
  const currencies = ['USD', 'AUD', 'EUR', 'GBP'];
  const countries = ['USA', 'Australia', 'Germany', 'UK'];
  const securityTypes = ['Stock', 'ETF', 'Mutual Fund', 'Bond'] as const;
  
  return Array.from({ length: size }, (_, i) => createMockInvestment({
    id: i + 1,
    securityName: `MOCK${i + 1}`,
    currency: currencies[i % currencies.length],
    country: countries[i % countries.length],
    securityType: securityTypes[i % securityTypes.length],
    purchasePrice: 100 + (i * 10),
    currentPrice: 105 + (i * 8),
    quantity: 5 + i,
  }));
};

export const createDiversifiedPortfolio = (): Investment[] => [
  createMockInvestment({
    id: 1,
    securityName: 'US_STOCK',
    securityType: 'Stock',
    country: 'USA',
    currency: 'USD',
    purchasePrice: 100,
    currentPrice: 110,
    quantity: 10,
  }),
  createMockInvestment({
    id: 2,
    securityName: 'AU_ETF',
    securityType: 'ETF',
    country: 'Australia',
    currency: 'AUD',
    purchasePrice: 50,
    currentPrice: 55,
    quantity: 20,
  }),
  createMockInvestment({
    id: 3,
    securityName: 'EU_BOND',
    securityType: 'Bond',
    country: 'Germany',
    currency: 'EUR',
    purchasePrice: 200,
    currentPrice: 195,
    quantity: 5,
  }),
  createMockInvestment({
    id: 4,
    securityName: 'UK_MUTUAL',
    securityType: 'Mutual Fund',
    country: 'UK',
    currency: 'GBP',
    purchasePrice: 150,
    currentPrice: 160,
    quantity: 8,
  }),
];

export const createConcentratedPortfolio = (): Investment[] => [
  createMockInvestment({
    id: 1,
    securityName: 'BIG_POSITION',
    quantity: 1000, // Very large position
    purchasePrice: 100,
    currentPrice: 105,
  }),
  createMockInvestment({
    id: 2,
    securityName: 'SMALL_POSITION1',
    quantity: 1,
    purchasePrice: 100,
    currentPrice: 102,
  }),
  createMockInvestment({
    id: 3,
    securityName: 'SMALL_POSITION2',
    quantity: 1,
    purchasePrice: 100,
    currentPrice: 98,
  }),
];

export const expectPortfolioMetricsStructure = (metrics: any) => {
  expect(metrics).toMatchObject({
    totalInvestment: expect.any(Number),
    currentValue: expect.any(Number),
    totalProfitLoss: expect.any(Number),
    totalProfitLossPercentage: expect.any(Number),
    topPerformers: expect.any(Array),
    underPerformers: expect.any(Array),
    diversificationScore: expect.any(Number),
    riskLevel: expect.stringMatching(/^(Low|Medium|High)$/),
  });
};

export const expectInvestmentMetricsStructure = (metrics: any) => {
  expect(metrics).toMatchObject({
    id: expect.any(Number),
    securityName: expect.any(String),
    currentValue: expect.any(Number),
    profitLoss: expect.any(Number),
    profitLossPercentage: expect.any(Number),
    daysSinceInvestment: expect.any(Number),
  });
};

export const expectMathematicalConsistency = (metrics: any, tolerance: number = 0.01) => {
  const calculatedCurrentValue = metrics.totalInvestment + metrics.totalProfitLoss;
  expect(Math.abs(calculatedCurrentValue - metrics.currentValue)).toBeLessThan(tolerance);
  
  if (metrics.totalInvestment > 0) {
    const expectedPercentage = (metrics.totalProfitLoss / metrics.totalInvestment) * 100;
    expect(Math.abs(expectedPercentage - metrics.totalProfitLossPercentage)).toBeLessThan(tolerance);
  }
};

export const expectValidDiversificationScore = (score: number) => {
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(100);
  expect(Number.isFinite(score)).toBe(true);
};

export const expectValidRiskLevel = (riskLevel: string) => {
  expect(['Low', 'Medium', 'High']).toContain(riskLevel);
};

export const createCSVString = (investments: Partial<Investment>[]): string => {
  const header = 'country,security_type,security_name,investment_date,purchase_price,quantity,currency';
  const rows = investments.map(inv => 
    `${inv.country || 'USA'},${inv.securityType || 'Stock'},${inv.securityName || 'TEST'},${inv.investmentDate || '2023-01-01'},${inv.purchasePrice || 100},${inv.quantity || 10},${inv.currency || 'USD'}`
  );
  return [header, ...rows].join('\n');
};

export const mockPerformanceNow = (mockImplementation?: () => number) => {
  const mockNow = jest.spyOn(performance, 'now');
  
  if (mockImplementation) {
    mockNow.mockImplementation(mockImplementation);
  } else {
    let counter = 0;
    mockNow.mockImplementation(() => {
      counter += 100; // Simulate 100ms increments
      return counter;
    });
  }
  
  return () => {
    mockNow.mockRestore();
  };
};

export const mockDateNow = (mockDate: string | Date = '2023-06-01T00:00:00Z') => {
  const mockTime = typeof mockDate === 'string' ? new Date(mockDate).getTime() : mockDate.getTime();
  const mockNow = jest.spyOn(Date, 'now').mockReturnValue(mockTime);
  
  return () => {
    mockNow.mockRestore();
  };
};

export const roundToDecimals = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const createTestLogger = () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  logPortfolioCalculation: jest.fn(),
  logInvestmentMetrics: jest.fn(),
  logCurrencyConversion: jest.fn(),
});

// Performance testing helpers
export const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

export const expectPerformanceWithinLimit = (duration: number, limitMs: number) => {
  expect(duration).toBeLessThan(limitMs);
};