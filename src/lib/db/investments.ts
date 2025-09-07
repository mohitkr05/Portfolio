import Dexie, { Table } from 'dexie';

export interface Investment {
  id?: number;
  country: string;
  securityType: 'Stock' | 'ETF' | 'Mutual Fund' | 'Real Estate' | 'Bond' | 'Crypto' | 'Other';
  securityName: string;
  investmentDate: string;
  purchasePrice: number;
  quantity: number;
  currency: string;
  currentPrice?: number;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioAnalysis {
  id?: number;
  totalInvestment: number;
  currentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  diversificationScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  suggestions: string[];
  createdAt: string;
}

export interface UserProfile {
  id?: number;
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  investmentGoal: string;
  timeHorizon: number; // in years
  preferredCurrencies: string[];
  createdAt: string;
  updatedAt: string;
}

class InvestmentDatabase extends Dexie {
  investments!: Table<Investment>;
  portfolioAnalyses!: Table<PortfolioAnalysis>;
  userProfiles!: Table<UserProfile>;

  constructor() {
    super('InvestmentPortfolioDB');
    
    this.version(1).stores({
      investments: '++id, country, securityType, securityName, investmentDate, currency',
      portfolioAnalyses: '++id, createdAt',
      userProfiles: '++id, riskTolerance'
    });
  }
}

export const db = new InvestmentDatabase();

export const securityTypes = [
  'Stock',
  'ETF', 
  'Mutual Fund',
  'Real Estate',
  'Bond',
  'Crypto',
  'Other'
] as const;

export const currencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF', 'CNY'
] as const;

export const countries = [
  'USA', 'India', 'Germany', 'Japan', 'UK', 'Canada', 'Australia', 'Switzerland', 'China', 'France'
] as const;