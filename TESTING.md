# Testing Documentation

This document provides comprehensive information about the testing infrastructure for the Portfolio Investment Tracker application.

## 🧪 Test Architecture

### Test Structure
```
src/
├── __tests__/
│   ├── integration/          # Integration tests
│   └── utils/                # Test utilities and helpers
├── lib/
│   └── services/
│       └── __tests__/        # Unit tests for services
└── components/
    └── __tests__/            # Component tests (future)
```

### Test Categories

1. **Unit Tests** - Test individual functions and classes in isolation
2. **Integration Tests** - Test complete workflows and data flow
3. **Component Tests** - Test React components (planned)
4. **E2E Tests** - Test complete user workflows (planned)

## 🚀 Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit
```

### Coverage Goals
- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 80% minimum
- **Statements**: 80% minimum

## 📋 Test Suites

### 1. Currency Converter Tests (`currencyConverter.test.ts`)
**Coverage**: Core currency conversion logic, exchange rates, formatting

**Key Test Cases**:
- ✅ Same currency conversions (USD → USD)
- ✅ Cross-currency conversions (USD → AUD, EUR → GBP)
- ✅ Round-trip conversion accuracy
- ✅ Unsupported currency handling
- ✅ Edge cases (zero, negative amounts)
- ✅ Currency formatting with localization
- ✅ Logging integration

**Example**:
```typescript
it('should convert USD to AUD correctly', () => {
  const result = currencyConverter.convert(100, 'USD', 'AUD');
  expect(result.convertedAmount).toBe(147);
  expect(result.rate).toBe(1.47);
});
```

### 2. Portfolio Calculations Tests (`portfolioCalculations.test.ts`)
**Coverage**: Portfolio metrics, investment analysis, risk assessment

**Key Test Cases**:
- ✅ Portfolio metrics calculation in multiple currencies
- ✅ Individual investment metrics
- ✅ Top/underperformer identification
- ✅ Diversification scoring
- ✅ Risk level assessment
- ✅ Empty portfolio handling
- ✅ Edge cases and error conditions
- ✅ Mathematical consistency validation

**Example**:
```typescript
it('should calculate basic portfolio metrics correctly in USD', async () => {
  const result = await portfolioService.calculatePortfolioMetrics(mockInvestments, 'USD');
  expect(result.totalInvestment).toBeCloseTo(1340.15, 2);
  expect(result.currentValue).toBeCloseTo(1457.16, 2);
  expect(result.totalProfitLoss).toBeCloseTo(117.01, 2);
});
```

### 3. Integration Tests (`portfolioFlow.test.ts`)
**Coverage**: End-to-end workflow from CSV upload to portfolio analysis

**Key Test Cases**:
- ✅ Complete CSV processing pipeline
- ✅ Multi-currency portfolio handling
- ✅ Data validation and error handling
- ✅ Performance testing with large portfolios
- ✅ Mathematical consistency across currencies
- ✅ Data integrity throughout pipeline

**Example**:
```typescript
it('should process CSV through complete pipeline successfully', async () => {
  const csvRows = parseCSV(sampleCSV);
  const investments = csvRows.map(row => convertCSVRowToInvestment(row));
  const portfolioMetrics = await portfolioService.calculatePortfolioMetrics(investments, 'USD');
  
  // Verify mathematical consistency
  const calculatedTotal = portfolioMetrics.totalInvestment + portfolioMetrics.totalProfitLoss;
  expect(Math.abs(calculatedTotal - portfolioMetrics.currentValue)).toBeLessThan(0.01);
});
```

## 🔧 Test Utilities

### Test Helpers (`testHelpers.ts`)

**Mock Data Creation**:
```typescript
// Create a single mock investment
const investment = createMockInvestment({ 
  securityName: 'AAPL', 
  currentPrice: 150 
});

// Create a diversified portfolio
const portfolio = createDiversifiedPortfolio();

// Create a concentrated portfolio for risk testing
const concentrated = createConcentratedPortfolio();
```

**Validation Helpers**:
```typescript
// Validate portfolio metrics structure
expectPortfolioMetricsStructure(result);

// Validate mathematical consistency
expectMathematicalConsistency(metrics);

// Validate performance within limits
expectPerformanceWithinLimit(duration, 1000); // < 1 second
```

**CSV Testing**:
```typescript
const csvString = createCSVString([
  { securityName: 'AAPL', purchasePrice: 150 },
  { securityName: 'GOOGL', purchasePrice: 2500 }
]);
```

## 📊 Logging and Debugging

### Test Logging
The logging system is mocked in tests to avoid console noise:

```typescript
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logCurrencyConversion: jest.fn(),
  },
}));
```

### Debugging Tests
```bash
# Run specific test file
npm test -- currencyConverter.test.ts

# Run with verbose output
npm test -- --verbose

# Run specific test case
npm test -- --testNamePattern="should convert USD to AUD"
```

## 🛠️ Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom for React component testing
- **Setup**: Automatic mocking of Next.js router and IndexedDB
- **Coverage**: V8 provider with thresholds
- **Path mapping**: Supports @/ aliases

### Mock Configuration (`jest.setup.js`)
- **Next.js Router**: Fully mocked for navigation testing
- **Environment Variables**: Test values for API keys
- **Performance API**: Mocked for Node.js compatibility
- **IndexedDB**: Fake implementation for database testing

## 🔍 Quality Assurance

### Pre-commit Checks
```bash
# Run before committing
npm run test:coverage
npm run lint
npm run build
```

### Continuous Integration
```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm run test:coverage
    npm run test:integration
```

### Test Coverage Reports
Coverage reports are generated in the `coverage/` directory:
- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Format**: For CI/CD integration
- **JSON Summary**: For programmatic analysis

## 📈 Performance Testing

### Large Portfolio Testing
Tests validate performance with large datasets:

```typescript
it('should handle large portfolios efficiently', async () => {
  const largePortfolio = Array.from({ length: 100 }, createMockInvestment);
  
  const { result, duration } = await measureExecutionTime(
    () => portfolioService.calculatePortfolioMetrics(largePortfolio, 'USD')
  );
  
  expect(duration).toBeLessThan(1000); // < 1 second
});
```

### Memory Usage
- Monitor memory usage during large portfolio calculations
- Validate garbage collection efficiency
- Test for memory leaks in watch mode

## 🐛 Error Handling Tests

### Edge Cases Covered
- ✅ Empty portfolios
- ✅ Invalid currency codes
- ✅ Extreme numerical values
- ✅ Malformed CSV data
- ✅ Network failures (mocked)
- ✅ Division by zero scenarios
- ✅ Negative prices/quantities

### Error Recovery
```typescript
it('should handle invalid CSV data gracefully', async () => {
  const invalidCSV = 'country,invalid_headers\nUSA,invalid_data';
  const rows = parseCSV(invalidCSV);
  const errors = validateCSVRow(rows[0]);
  
  expect(errors.length).toBeGreaterThan(0);
});
```

## 📝 Adding New Tests

### 1. Unit Tests
Create test files alongside the code they test:
```
src/lib/services/newService.ts
src/lib/services/__tests__/newService.test.ts
```

### 2. Integration Tests
Add to the integration directory:
```
src/__tests__/integration/newFlow.test.ts
```

### 3. Test Structure
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  
  beforeEach(() => {
    service = new ServiceName();
    jest.clearAllMocks();
  });
  
  describe('methodName', () => {
    it('should handle normal case', () => {
      // Test implementation
    });
    
    it('should handle edge case', () => {
      // Test implementation  
    });
  });
});
```

## 🎯 Testing Best Practices

### 1. Test Naming
- Use descriptive test names that explain the expected behavior
- Follow the pattern: "should [expected behavior] when [condition]"

### 2. Test Organization
- Group related tests with `describe` blocks
- Use `beforeEach`/`afterEach` for setup/cleanup
- Keep tests independent and isolated

### 3. Assertions
- Use specific matchers (`toBeCloseTo` for floating point numbers)
- Test both positive and negative cases
- Validate structure and values separately

### 4. Mocking
- Mock external dependencies
- Use dependency injection for testability
- Verify mock interactions when relevant

### 5. Performance
- Set reasonable performance expectations
- Test with realistic data sizes
- Monitor test execution time

## 📋 Test Checklist

Before submitting code, ensure:
- [ ] All tests pass
- [ ] Coverage meets minimum thresholds (80%)
- [ ] New features have corresponding tests
- [ ] Edge cases are covered
- [ ] Performance tests pass
- [ ] Integration tests validate end-to-end functionality
- [ ] Error handling is tested
- [ ] Documentation is updated

## 🚨 Troubleshooting

### Common Issues

**Tests timing out**:
```bash
# Increase timeout in jest.config.js
testTimeout: 10000
```

**Mock not working**:
```typescript
// Ensure mocks are cleared between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

**Coverage not accurate**:
```bash
# Clear coverage cache
npx jest --clearCache
```

**IndexedDB errors**:
```bash
# Ensure fake-indexeddb is properly configured in jest.setup.js
npm install --save-dev fake-indexeddb
```

This comprehensive testing infrastructure ensures the reliability and accuracy of the portfolio investment tracking system across all scenarios and edge cases.