import { Investment } from '../db/investments';
import { RealMarketDataService } from './realMarketData';
import { CurrencyConverterService } from './currencyConverter';
import { logger, startTimer } from '../utils/logger';

export interface PortfolioMetrics {
  totalInvestment: number;
  currentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  topPerformers: Investment[];
  underPerformers: Investment[];
  diversificationScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface InvestmentWithMetrics extends Investment {
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  daysSinceInvestment: number;
  annualizedReturn?: number;
}

export class PortfolioCalculationService {
  private marketDataService: RealMarketDataService;
  private currencyConverter: CurrencyConverterService;

  constructor() {
    this.marketDataService = new RealMarketDataService();
    this.currencyConverter = new CurrencyConverterService();
  }

  async calculatePortfolioMetrics(
    investments: Investment[], 
    baseCurrency: string = 'USD'
  ): Promise<PortfolioMetrics> {
    const endTimer = startTimer(`PortfolioMetrics calculation (${baseCurrency})`);
    logger.info('PortfolioCalculation', `Starting portfolio calculation for ${investments.length} investments`, {
      baseCurrency,
      investmentCount: investments.length,
      securityNames: investments.map(inv => inv.securityName)
    });

    const investmentsWithMetrics = await this.calculateInvestmentMetrics(investments, baseCurrency);
    
    // Calculate total investment using converted values from metrics
    const totalInvestment = investmentsWithMetrics.reduce(
      (sum, inv) => {
        const purchaseValueConverted = this.currencyConverter.convert(
          inv.purchasePrice * inv.quantity,
          inv.currency,
          baseCurrency
        );
        return sum + purchaseValueConverted.convertedAmount;
      }, 0
    );
    
    const currentValue = investmentsWithMetrics.reduce(
      (sum, inv) => sum + inv.currentValue, 0
    );
    
    const totalProfitLoss = currentValue - totalInvestment;
    const totalProfitLossPercentage = totalInvestment > 0 
      ? (totalProfitLoss / totalInvestment) * 100 
      : 0;

    logger.logPortfolioCalculation(
      baseCurrency,
      investmentsWithMetrics.length,
      totalInvestment,
      currentValue,
      totalProfitLoss,
      totalProfitLossPercentage
    );

    const topPerformers = investmentsWithMetrics
      .filter(inv => inv.profitLossPercentage > 0)
      .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
      .slice(0, 3);

    const underPerformers = investmentsWithMetrics
      .filter(inv => inv.profitLossPercentage < 0)
      .sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)
      .slice(0, 3);

    const diversificationScore = this.calculateDiversificationScore(investmentsWithMetrics);
    const riskLevel = this.assessRiskLevel(investmentsWithMetrics, diversificationScore);

    endTimer();
    logger.info('PortfolioCalculation', 'Portfolio calculation completed', {
      diversificationScore,
      riskLevel,
      topPerformersCount: topPerformers.length,
      underPerformersCount: underPerformers.length
    });

    return {
      totalInvestment,
      currentValue,
      totalProfitLoss,
      totalProfitLossPercentage,
      topPerformers,
      underPerformers,
      diversificationScore,
      riskLevel
    };
  }

  async calculateInvestmentMetrics(
    investments: Investment[], 
    baseCurrency: string = 'USD'
  ): Promise<InvestmentWithMetrics[]> {
    const metricsPromises = investments.map(async (investment) => {
      const currentPrice = investment.currentPrice || investment.purchasePrice;
      
      // Convert values to base currency using currency converter
      const currentValueConversion = this.currencyConverter.convert(
        currentPrice * investment.quantity,
        investment.currency,
        baseCurrency
      );
      
      const purchaseValueConversion = this.currencyConverter.convert(
        investment.purchasePrice * investment.quantity,
        investment.currency,
        baseCurrency
      );
      
      const currentValueInBaseCurrency = currentValueConversion.convertedAmount;
      const purchaseValueInBaseCurrency = purchaseValueConversion.convertedAmount;
      
      const profitLoss = Math.round((currentValueInBaseCurrency - purchaseValueInBaseCurrency) * 100) / 100;
      const profitLossPercentage = purchaseValueInBaseCurrency > 0 
        ? Math.round(((profitLoss / purchaseValueInBaseCurrency) * 100) * 100) / 100
        : 0;
      
      const daysSinceInvestment = this.calculateDaysSinceInvestment(investment.investmentDate);
      const annualizedReturn = this.calculateAnnualizedReturn(
        profitLossPercentage, 
        daysSinceInvestment
      );

      logger.logInvestmentMetrics(
        investment.securityName,
        investment.currency,
        baseCurrency,
        investment.purchasePrice * investment.quantity,
        purchaseValueInBaseCurrency,
        currentValueInBaseCurrency,
        profitLoss,
        profitLossPercentage
      );

      // Warn about extreme profit/loss percentages
      if (Math.abs(profitLossPercentage) > 100) {
        logger.warn('PortfolioCalculation', `Extreme P/L detected for ${investment.securityName}`, {
          profitLossPercentage: profitLossPercentage.toFixed(2),
          possibleCause: 'Check currency conversion rates or price data accuracy'
        });
      }

      return {
        ...investment,
        currentValue: currentValueInBaseCurrency,
        profitLoss,
        profitLossPercentage,
        daysSinceInvestment,
        annualizedReturn
      };
    });

    return Promise.all(metricsPromises);
  }

  private calculateDaysSinceInvestment(investmentDate: string): number {
    const investDate = new Date(investmentDate);
    const today = new Date();
    const timeDiff = today.getTime() - investDate.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  }

  private calculateAnnualizedReturn(totalReturnPercentage: number, days: number): number | undefined {
    if (days <= 0) return undefined;
    
    const years = days / 365.25;
    if (years < 0.1) return undefined; // Don't calculate for very short periods
    
    return Math.pow(1 + totalReturnPercentage / 100, 1 / years) - 1;
  }

  private calculateDiversificationScore(investments: InvestmentWithMetrics[]): number {
    if (investments.length === 0) return 0;

    // Score based on different dimensions
    let score = 0;
    
    // Security type diversification (0-30 points)
    const securityTypes = new Set(investments.map(inv => inv.securityType));
    score += Math.min(securityTypes.size * 6, 30);
    
    // Geographic diversification (0-25 points)
    const countries = new Set(investments.map(inv => inv.country));
    score += Math.min(countries.size * 5, 25);
    
    // Currency diversification (0-20 points)
    const currencies = new Set(investments.map(inv => inv.currency));
    score += Math.min(currencies.size * 4, 20);
    
    // Investment concentration (0-25 points)
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const maxConcentration = Math.max(...investments.map(inv => inv.currentValue / totalValue));
    score += (1 - maxConcentration) * 25;
    
    return Math.round(score);
  }

  private assessRiskLevel(
    investments: InvestmentWithMetrics[], 
    diversificationScore: number
  ): 'Low' | 'Medium' | 'High' {
    // Risk factors
    let riskScore = 0;
    
    // High volatility securities
    const highRiskTypes = ['Stock', 'Crypto'];
    const highRiskRatio = investments.filter(inv => 
      highRiskTypes.includes(inv.securityType)
    ).length / investments.length;
    riskScore += highRiskRatio * 40;
    
    // Concentration risk
    if (diversificationScore < 50) riskScore += 30;
    else if (diversificationScore < 75) riskScore += 15;
    
    // Geographic concentration
    const countries = new Set(investments.map(inv => inv.country));
    if (countries.size === 1) riskScore += 20;
    else if (countries.size === 2) riskScore += 10;
    
    // Currency risk
    const currencies = new Set(investments.map(inv => inv.currency));
    if (currencies.size === 1) riskScore += 10;
    
    if (riskScore >= 70) return 'High';
    if (riskScore >= 40) return 'Medium';
    return 'Low';
  }

  generatePortfolioSuggestions(
    metrics: PortfolioMetrics,
    investments: InvestmentWithMetrics[],
    userRiskTolerance?: 'Conservative' | 'Moderate' | 'Aggressive'
  ): string[] {
    const suggestions: string[] = [];
    
    // Diversification suggestions
    if (metrics.diversificationScore < 50) {
      suggestions.push('Consider diversifying across more asset classes and geographic regions');
    }
    
    if (metrics.diversificationScore < 75) {
      const securityTypes = new Set(investments.map(inv => inv.securityType));
      if (!securityTypes.has('Bond')) {
        suggestions.push('Consider adding bonds to reduce portfolio volatility');
      }
      if (!securityTypes.has('ETF')) {
        suggestions.push('ETFs can provide instant diversification at low cost');
      }
    }
    
    // Performance-based suggestions
    if (metrics.totalProfitLossPercentage < -10) {
      suggestions.push('Review underperforming investments and consider rebalancing');
    }
    
    // Risk-based suggestions
    if (metrics.riskLevel === 'High' && userRiskTolerance === 'Conservative') {
      suggestions.push('Your portfolio risk level exceeds your risk tolerance. Consider reducing exposure to volatile assets');
    }
    
    if (metrics.riskLevel === 'Low' && userRiskTolerance === 'Aggressive') {
      suggestions.push('Your portfolio may be too conservative for your risk tolerance. Consider adding growth assets');
    }
    
    // Concentration warnings
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const maxConcentration = Math.max(...investments.map(inv => inv.currentValue / totalValue));
    if (maxConcentration > 0.3) {
      suggestions.push('High concentration in single investment detected. Consider rebalancing to reduce risk');
    }
    
    // Currency diversification
    const currencies = new Set(investments.map(inv => inv.currency));
    if (currencies.size === 1) {
      suggestions.push('Consider investments in different currencies to hedge against currency risk');
    }
    
    return suggestions;
  }
}