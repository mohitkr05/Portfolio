export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public debug(component: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, component, message, data);
  }

  public info(component: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, component, message, data);
  }

  public warn(component: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, component, message, data);
  }

  public error(component: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, component, message, data, error);
  }

  private log(level: LogLevel, component: string, message: string, data?: any, error?: Error): void {
    if (level < this.logLevel) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      error
    };

    // Add to internal log store
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output with formatting
    const levelStr = LogLevel[level];
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] ${levelStr} [${component}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`%c${prefix}`, 'color: gray', message, data || '');
        break;
      case LogLevel.INFO:
        console.info(`%c${prefix}`, 'color: blue', message, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`%c${prefix}`, 'color: orange', message, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`%c${prefix}`, 'color: red', message, error || data || '');
        if (error?.stack) {
          console.error(error.stack);
        }
        break;
    }
  }

  public getLogs(component?: string, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs;

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    return filteredLogs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Performance measurement utilities
  public startTimer(label: string): () => void {
    const start = performance.now();
    this.debug('Timer', `Started: ${label}`);
    
    return () => {
      const duration = performance.now() - start;
      this.info('Timer', `Completed: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // Portfolio-specific logging helpers
  public logCurrencyConversion(from: string, to: string, amount: number, rate: number, result: number): void {
    this.debug('CurrencyConverter', 'Currency conversion', {
      from,
      to,
      originalAmount: amount,
      exchangeRate: rate,
      convertedAmount: result,
      formattedOriginal: new Intl.NumberFormat().format(amount),
      formattedResult: new Intl.NumberFormat().format(result)
    });
  }

  public logPortfolioCalculation(
    baseCurrency: string,
    investmentCount: number,
    totalInvestment: number,
    currentValue: number,
    profitLoss: number,
    profitLossPercentage: number
  ): void {
    this.info('PortfolioCalculation', 'Portfolio metrics calculated', {
      baseCurrency,
      investmentCount,
      totalInvestment: totalInvestment.toFixed(2),
      currentValue: currentValue.toFixed(2),
      profitLoss: profitLoss.toFixed(2),
      profitLossPercentage: profitLossPercentage.toFixed(2),
      calculationValid: Math.abs((totalInvestment + profitLoss) - currentValue) < 0.01
    });
  }

  public logInvestmentMetrics(
    securityName: string,
    currency: string,
    baseCurrency: string,
    originalValue: number,
    convertedValue: number,
    currentValue: number,
    profitLoss: number,
    profitLossPercentage: number
  ): void {
    this.debug('InvestmentMetrics', `Investment calculation: ${securityName}`, {
      security: securityName,
      currency,
      baseCurrency,
      originalValue: originalValue.toFixed(2),
      convertedValue: convertedValue.toFixed(2),
      currentValue: currentValue.toFixed(2),
      profitLoss: profitLoss.toFixed(2),
      profitLossPercentage: profitLossPercentage.toFixed(2)
    });
  }

  public logMarketDataFetch(symbol: string, provider: string, price: number | null, success: boolean): void {
    if (success && price) {
      this.info('MarketData', `Price fetched: ${symbol}`, {
        symbol,
        provider,
        price: price.toFixed(2),
        timestamp: new Date().toISOString()
      });
    } else {
      this.warn('MarketData', `Price fetch failed: ${symbol}`, {
        symbol,
        provider,
        error: 'No price returned'
      });
    }
  }

  public logAPIError(component: string, operation: string, error: Error, context?: any): void {
    this.error(component, `API Error in ${operation}`, error, context);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common use cases
export const logDebug = (component: string, message: string, data?: any) => 
  logger.debug(component, message, data);

export const logInfo = (component: string, message: string, data?: any) => 
  logger.info(component, message, data);

export const logWarn = (component: string, message: string, data?: any) => 
  logger.warn(component, message, data);

export const logError = (component: string, message: string, error?: Error, data?: any) => 
  logger.error(component, message, error, data);

export const startTimer = (label: string) => logger.startTimer(label);