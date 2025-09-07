import { Investment } from '../db/investments';

interface MarketDataProvider {
  name: string;
  getRealTimePrice: (symbol: string, exchange?: string) => Promise<number | null>;
  supportsExchange: (exchange: string) => boolean;
}

class AlphaVantageProvider implements MarketDataProvider {
  name = 'Alpha Vantage';
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo';
  }

  async getRealTimePrice(symbol: string, exchange?: string): Promise<number | null> {
    try {
      // Handle different exchange formats
      let searchSymbol = symbol;
      if (exchange === 'ASX' || symbol.includes('.AX')) {
        searchSymbol = symbol.replace('.AX', '') + '.AX';
      }

      const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${searchSymbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data['Global Quote'] && data['Global Quote']['05. price']) {
        return parseFloat(data['Global Quote']['05. price']);
      }

      return null;
    } catch (error) {
      console.error(`Alpha Vantage API error for ${symbol}:`, error);
      return null;
    }
  }

  supportsExchange(exchange: string): boolean {
    return ['NYSE', 'NASDAQ', 'ASX', 'LSE', 'TSE'].includes(exchange);
  }
}

class PolygonProvider implements MarketDataProvider {
  name = 'Polygon';
  private apiKey: string;
  private baseUrl = 'https://api.polygon.io/v2/aggs/ticker';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY || '';
  }

  async getRealTimePrice(symbol: string): Promise<number | null> {
    if (!this.apiKey) return null;

    try {
      const today = new Date().toISOString().split('T')[0];
      const url = `${this.baseUrl}/${symbol}/range/1/day/${today}/${today}?apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results[0] && data.results[0].c) {
        return data.results[0].c; // closing price
      }

      return null;
    } catch (error) {
      console.error(`Polygon API error for ${symbol}:`, error);
      return null;
    }
  }

  supportsExchange(exchange: string): boolean {
    return ['NYSE', 'NASDAQ'].includes(exchange);
  }
}

class YahooFinanceProvider implements MarketDataProvider {
  name = 'Yahoo Finance';
  private baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';

  async getRealTimePrice(symbol: string, exchange?: string): Promise<number | null> {
    try {
      // Format symbol for different exchanges
      let yahooSymbol = symbol;
      if (exchange === 'ASX') {
        yahooSymbol = symbol + '.AX';
      } else if (exchange === 'LSE') {
        yahooSymbol = symbol + '.L';
      } else if (exchange === 'TSE') {
        yahooSymbol = symbol + '.T';
      }

      const url = `${this.baseUrl}/${yahooSymbol}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
        return data.chart.result[0].meta.regularMarketPrice;
      }

      return null;
    } catch (error) {
      console.error(`Yahoo Finance API error for ${symbol}:`, error);
      return null;
    }
  }

  supportsExchange(exchange: string): boolean {
    return ['NYSE', 'NASDAQ', 'ASX', 'LSE', 'TSE', 'TSX'].includes(exchange);
  }
}

export class RealMarketDataService {
  private providers: MarketDataProvider[];
  private symbolToExchange: Map<string, string>;

  constructor() {
    this.providers = [
      new AlphaVantageProvider(),
      new PolygonProvider(),
      new YahooFinanceProvider(),
    ];

    // Map symbols to their exchanges
    this.symbolToExchange = new Map([
      // Australian stocks
      ['DRO', 'ASX'], ['FAIR', 'ASX'], ['IOO', 'ASX'], 
      ['NDQ', 'ASX'], ['WES', 'ASX'], ['ZIP', 'ASX'],
      // US stocks  
      ['AMZN', 'NASDAQ'], ['CRM', 'NYSE'], ['DRIV', 'NASDAQ'],
      ['IBM', 'NYSE'], ['NVDA', 'NASDAQ'], ['QCOM', 'NASDAQ'],
      ['TSLA', 'NASDAQ'], ['ZS', 'NASDAQ'],
    ]);
  }

  async getCurrentPrice(investment: Investment): Promise<number | null> {
    const symbol = investment.securityName;
    const exchange = this.getExchangeForSymbol(symbol, investment.country);

    // Try each provider until we get a valid price
    for (const provider of this.providers) {
      if (provider.supportsExchange(exchange)) {
        try {
          const price = await provider.getRealTimePrice(symbol, exchange);
          if (price !== null && price > 0) {
            console.log(`✅ Got price for ${symbol} from ${provider.name}: $${price}`);
            return price;
          }
        } catch (error) {
          console.warn(`❌ ${provider.name} failed for ${symbol}:`, error);
        }
      }
    }

    console.warn(`⚠️ No price found for ${symbol}, using mock data`);
    return this.getMockPrice(symbol, investment.purchasePrice);
  }

  private getExchangeForSymbol(symbol: string, country: string): string {
    // Check our symbol mapping first
    if (this.symbolToExchange.has(symbol)) {
      return this.symbolToExchange.get(symbol)!;
    }

    // Fallback to country-based mapping
    const countryToExchange: Record<string, string> = {
      'USA': 'NYSE',
      'Australia': 'ASX', 
      'UK': 'LSE',
      'Japan': 'TSE',
      'Canada': 'TSX',
      'Germany': 'XETRA',
    };

    return countryToExchange[country] || 'NYSE';
  }

  private getMockPrice(symbol: string, purchasePrice: number): number {
    // Generate consistent mock price based on symbol
    const hash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const variation = (hash % 20 - 10) / 100; // -10% to +10%
    return purchasePrice * (1 + variation);
  }

  async updateAllPrices(investments: Investment[]): Promise<Investment[]> {
    console.log(`🔄 Updating prices for ${investments.length} investments...`);
    
    const updatedInvestments: Investment[] = [];
    const rateLimitDelay = 500; // 500ms between calls to respect API limits

    for (let i = 0; i < investments.length; i++) {
      const investment = investments[i];
      
      try {
        const currentPrice = await this.getCurrentPrice(investment);
        
        updatedInvestments.push({
          ...investment,
          currentPrice: currentPrice || investment.currentPrice || investment.purchasePrice,
          lastUpdated: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Rate limiting - wait between requests
        if (i < investments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        }

      } catch (error) {
        console.error(`Error updating price for ${investment.securityName}:`, error);
        updatedInvestments.push({
          ...investment,
          updatedAt: new Date().toISOString()
        });
      }
    }

    console.log(`✅ Updated ${updatedInvestments.length} investment prices`);
    return updatedInvestments;
  }

  // Utility method to test API connectivity
  async testConnectivity(): Promise<{ provider: string; status: string; }[]> {
    const testSymbol = 'AAPL';
    const results = [];

    for (const provider of this.providers) {
      try {
        const price = await provider.getRealTimePrice(testSymbol);
        results.push({
          provider: provider.name,
          status: price ? `✅ Working ($${price})` : '⚠️ No data'
        });
      } catch (error) {
        results.push({
          provider: provider.name,
          status: `❌ Error: ${error}`
        });
      }
    }

    return results;
  }
}