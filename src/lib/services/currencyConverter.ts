import { logger } from '../utils/logger';

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

export interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  convertedAmount: number;
}

export class CurrencyConverterService {
  private exchangeRates: Map<string, number>;
  private lastUpdated: string;

  constructor() {
    this.exchangeRates = new Map();
    this.lastUpdated = new Date().toISOString();
    this.initializeRates();
  }

  private initializeRates() {
    // Base rates (relative to USD = 1.0)
    const rates: Record<string, number> = {
      'USD': 1.0,
      'AUD': 1.47,  // 1 USD = 1.47 AUD
      'EUR': 0.85,  // 1 USD = 0.85 EUR  
      'GBP': 0.75,  // 1 USD = 0.75 GBP
      'JPY': 150,   // 1 USD = 150 JPY
      'CAD': 1.33,  // 1 USD = 1.33 CAD
      'CHF': 0.88,  // 1 USD = 0.88 CHF
      'INR': 83,    // 1 USD = 83 INR
      'CNY': 7.2,   // 1 USD = 7.2 CNY
    };

    // Generate all cross-rates
    Object.keys(rates).forEach(from => {
      Object.keys(rates).forEach(to => {
        if (from !== to) {
          const rate = rates[to] / rates[from];
          this.exchangeRates.set(`${from}_${to}`, rate);
        } else {
          this.exchangeRates.set(`${from}_${to}`, 1.0);
        }
      });
    });
    
    logger.info('CurrencyConverter', 'Exchange rates initialized', {
      supportedCurrencies: Object.keys(rates),
      totalRates: this.exchangeRates.size,
      lastUpdated: this.lastUpdated
    });
  }

  async updateRatesFromAPI(): Promise<boolean> {
    // In a real implementation, you could fetch from APIs like:
    // - https://api.exchangerate-api.com/v4/latest/USD
    // - https://openexchangerates.org/api/latest.json
    // - https://api.fixer.io/latest
    
    try {
      // Mock API call - in practice you'd fetch real rates
      const mockApiResponse = {
        base: 'USD',
        rates: {
          'AUD': 1.47,
          'EUR': 0.85,
          'GBP': 0.75,
          'JPY': 150,
          'CAD': 1.33,
          'CHF': 0.88,
          'INR': 83,
          'CNY': 7.2,
        }
      };

      // Update rates from API response
      Object.entries(mockApiResponse.rates).forEach(([currency, rate]) => {
        // Direct rates from USD
        this.exchangeRates.set(`USD_${currency}`, rate);
        this.exchangeRates.set(`${currency}_USD`, 1 / rate);
        
        // Cross rates
        Object.entries(mockApiResponse.rates).forEach(([otherCurrency, otherRate]) => {
          if (currency !== otherCurrency) {
            const crossRate = otherRate / rate;
            this.exchangeRates.set(`${currency}_${otherCurrency}`, crossRate);
          }
        });
      });

      this.lastUpdated = new Date().toISOString();
      return true;
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      return false;
    }
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): ConversionResult {
    if (fromCurrency === toCurrency) {
      const result = {
        amount,
        fromCurrency,
        toCurrency,
        rate: 1,
        convertedAmount: amount
      };
      logger.debug('CurrencyConverter', 'Same currency conversion', result);
      return result;
    }

    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = this.exchangeRates.get(rateKey);

    if (rate === undefined) {
      logger.warn('CurrencyConverter', `Exchange rate not found: ${fromCurrency} to ${toCurrency}`, {
        fromCurrency,
        toCurrency,
        availableRates: Array.from(this.exchangeRates.keys()).filter(k => k.startsWith(fromCurrency))
      });
      // Fallback to 1:1 conversion
      return {
        amount,
        fromCurrency,
        toCurrency,
        rate: 1,
        convertedAmount: amount
      };
    }

    const convertedAmount = amount * rate;
    const result = {
      amount,
      fromCurrency,
      toCurrency,
      rate,
      convertedAmount
    };

    logger.logCurrencyConversion(fromCurrency, toCurrency, amount, rate, convertedAmount);
    return result;
  }

  getRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1;
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    return this.exchangeRates.get(rateKey) || 1;
  }

  getSupportedCurrencies(): string[] {
    return ['USD', 'AUD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'INR', 'CNY'];
  }

  getLastUpdated(): string {
    return this.lastUpdated;
  }

  formatCurrency(amount: number, currency: string): string {
    const formatters: Record<string, Intl.NumberFormat> = {
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'AUD': new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
      'CAD': new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
      'CHF': new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }),
      'INR': new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      'CNY': new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
    };

    const formatter = formatters[currency] || formatters['USD'];
    return formatter.format(amount);
  }
}