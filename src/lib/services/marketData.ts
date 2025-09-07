import { Investment } from '../db/investments';


interface AlphaVantageResponse {
  'Global Quote': {
    '01. symbol': string;
    '05. price': string;
    '07. latest trading day': string;
  };
}

export class MarketDataService {
  private readonly ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
  
  // Note: This would need a real API key in production
  private readonly API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo';

  async getCurrentPrice(investment: Investment): Promise<number | null> {
    try {
      switch (investment.securityType) {
        case 'Stock':
        case 'ETF':
          return await this.getStockPrice(investment.securityName);
        case 'Mutual Fund':
          return await this.getMutualFundPrice(investment.securityName);
        case 'Real Estate':
          return await this.getRealEstatePrice(investment.securityName);
        default:
          console.warn(`Price fetching not implemented for ${investment.securityType}`);
          return null;
      }
    } catch (error) {
      console.error(`Error fetching price for ${investment.securityName}:`, error);
      return null;
    }
  }

  private async getStockPrice(symbol: string): Promise<number | null> {
    // For demo purposes, we'll use mock data since Alpha Vantage requires API key
    if (this.API_KEY === 'demo') {
      return this.getMockPrice(symbol);
    }

    try {
      const url = `${this.ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.API_KEY}`;
      const response = await fetch(url);
      const data: AlphaVantageResponse = await response.json();
      
      if (data['Global Quote'] && data['Global Quote']['05. price']) {
        return parseFloat(data['Global Quote']['05. price']);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching stock price:', error);
      return null;
    }
  }

  private async getMutualFundPrice(symbol: string): Promise<number | null> {
    // Mutual fund prices typically updated once per day
    // In a real implementation, you'd use appropriate APIs
    return this.getMockPrice(symbol);
  }

  private async getRealEstatePrice(symbol: string): Promise<number | null> {
    // Real estate ETF prices
    return this.getStockPrice(symbol);
  }

  private getMockPrice(symbol: string): number {
    // Mock price generator for demo purposes
    const mockPrices: Record<string, number> = {
      'AAPL': 175.20,
      'SPY': 420.15,
      'RELIANCE.NS': 2650.30,
      'VTSAX': 102.45,
      'SAP.DE': 125.80,
      'VNQ': 92.30,
      '7203.T': 1380.00,
      'TSCO.L': 295.60
    };

    const basePrice = mockPrices[symbol] || 100;
    // Add some random variation (+/- 5%)
    const variation = (Math.random() - 0.5) * 0.1;
    return basePrice * (1 + variation);
  }

  async updateAllPrices(investments: Investment[]): Promise<Investment[]> {
    const updatedInvestments: Investment[] = [];
    
    for (const investment of investments) {
      const currentPrice = await this.getCurrentPrice(investment);
      
      updatedInvestments.push({
        ...investment,
        currentPrice: currentPrice || investment.currentPrice,
        lastUpdated: currentPrice ? new Date().toISOString() : investment.lastUpdated,
        updatedAt: new Date().toISOString()
      });
    }
    
    return updatedInvestments;
  }

  // Currency conversion service (simplified)
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    // Mock exchange rates for demo
    const exchangeRates: Record<string, number> = {
      'USD_EUR': 0.85,
      'USD_GBP': 0.75,
      'USD_JPY': 150,
      'USD_INR': 83,
      'EUR_USD': 1.18,
      'GBP_USD': 1.33,
      'JPY_USD': 0.0067,
      'INR_USD': 0.012
    };
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const reverseRateKey = `${toCurrency}_${fromCurrency}`;
    
    if (exchangeRates[rateKey]) {
      return amount * exchangeRates[rateKey];
    } else if (exchangeRates[reverseRateKey]) {
      return amount / exchangeRates[reverseRateKey];
    }
    
    // If no direct conversion available, convert through USD
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const usdAmount = await this.convertCurrency(amount, fromCurrency, 'USD');
      return await this.convertCurrency(usdAmount, 'USD', toCurrency);
    }
    
    return amount; // Fallback
  }
}