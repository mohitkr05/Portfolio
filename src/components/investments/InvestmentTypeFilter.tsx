'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Coins, 
  Banknote, 
  PieChart,
  Filter,
  BarChart3
} from 'lucide-react';
import { Investment } from '@/lib/db/investments';
import { PortfolioMetrics } from '@/lib/services/portfolioCalculations';

interface InvestmentTypeFilterProps {
  investments: Investment[];
  portfolioMetrics: PortfolioMetrics;
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  baseCurrency: string;
}

interface TypeSummary {
  type: string;
  count: number;
  totalValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercentage: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

const INVESTMENT_TYPE_CONFIG = {
  'Stock': { icon: <TrendingUp className="w-4 h-4" />, color: 'bg-blue-500' },
  'ETF': { icon: <BarChart3 className="w-4 h-4" />, color: 'bg-green-500' },
  'Mutual Fund': { icon: <PieChart className="w-4 h-4" />, color: 'bg-purple-500' },
  'Bond': { icon: <Banknote className="w-4 h-4" />, color: 'bg-yellow-500' },
  'Real Estate': { icon: <Building2 className="w-4 h-4" />, color: 'bg-orange-500' },
  'Crypto': { icon: <Coins className="w-4 h-4" />, color: 'bg-amber-500' },
  'Other': { icon: <TrendingUp className="w-4 h-4" />, color: 'bg-gray-500' },
};

export default function InvestmentTypeFilter({ 
  investments, 
  portfolioMetrics, 
  selectedTypes, 
  onTypeChange, 
  baseCurrency 
}: InvestmentTypeFilterProps) {
  const [showAllTypes, setShowAllTypes] = useState(false);

  // Calculate summary by investment type
  const typeSummaries = useMemo(() => {
    const summaryMap = new Map<string, {
      count: number;
      totalValue: number;
      totalInvested: number;
    }>();

    investments.forEach(investment => {
      const type = investment.securityType;
      const currentValue = (investment.currentPrice || investment.purchasePrice) * investment.quantity;
      const investedValue = investment.purchasePrice * investment.quantity;

      if (!summaryMap.has(type)) {
        summaryMap.set(type, {
          count: 0,
          totalValue: 0,
          totalInvested: 0,
        });
      }

      const summary = summaryMap.get(type)!;
      summary.count += 1;
      summary.totalValue += currentValue;
      summary.totalInvested += investedValue;
    });

    const totalPortfolioValue = portfolioMetrics.currentValue;

    return Array.from(summaryMap.entries()).map(([type, data]): TypeSummary => {
      const profitLoss = data.totalValue - data.totalInvested;
      const profitLossPercentage = data.totalInvested > 0 
        ? Math.round((profitLoss / data.totalInvested) * 100 * 100) / 100
        : 0;
      const percentage = totalPortfolioValue > 0 
        ? Math.round((data.totalValue / totalPortfolioValue) * 100 * 100) / 100
        : 0;

      const config = INVESTMENT_TYPE_CONFIG[type as keyof typeof INVESTMENT_TYPE_CONFIG] || INVESTMENT_TYPE_CONFIG['Other'];

      return {
        type,
        count: data.count,
        totalValue: Math.round(data.totalValue * 100) / 100,
        totalInvested: Math.round(data.totalInvested * 100) / 100,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercentage,
        percentage,
        icon: config.icon,
        color: config.color,
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [investments, portfolioMetrics.currentValue]);

  const availableTypes = typeSummaries.map(summary => summary.type);
  const displayedTypes = showAllTypes ? typeSummaries : typeSummaries.slice(0, 4);

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const handleSelectAll = () => {
    onTypeChange(availableTypes);
  };

  const handleClearAll = () => {
    onTypeChange([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const getProfitLossColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Investment Type Filter
          </CardTitle>
          <CardDescription>
            Filter your portfolio by investment type to analyze specific categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Button 
              variant={selectedTypes.length === availableTypes.length ? "default" : "outline"}
              size="sm"
              onClick={handleSelectAll}
            >
              All Types ({availableTypes.length})
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearAll}
              disabled={selectedTypes.length === 0}
            >
              Clear All
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {availableTypes.map(type => {
              const summary = typeSummaries.find(s => s.type === type)!;
              const isSelected = selectedTypes.includes(type);
              
              return (
                <Button
                  key={type}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTypeToggle(type)}
                  className={`flex items-center gap-2 ${isSelected ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${summary.color}`}></div>
                  {type}
                  <Badge variant="secondary" className="ml-1">
                    {summary.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Investment Type Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedTypes.map(summary => (
          <Card key={summary.type} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${summary.color}`}></div>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${summary.color.replace('bg-', 'bg-')}/20`}>
                    {summary.icon}
                  </div>
                  <span>{summary.type}</span>
                </div>
                <Badge variant="outline">{summary.count} assets</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalValue)}</p>
                <p className="text-xs text-gray-500">
                  {summary.percentage}% of portfolio
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Invested</p>
                <p className="font-semibold">{formatCurrency(summary.totalInvested)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Profit/Loss</p>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${getProfitLossColor(summary.profitLoss)}`}>
                    {formatCurrency(summary.profitLoss)}
                  </span>
                  <span className={`text-sm ${getProfitLossColor(summary.profitLoss)}`}>
                    {formatPercentage(summary.profitLossPercentage)}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  {summary.profitLoss >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400 mr-1" />
                  )}
                  <span className={`text-xs ${getProfitLossColor(summary.profitLoss)}`}>
                    {summary.profitLoss >= 0 ? 'Gaining' : 'Losing'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {typeSummaries.length > 4 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowAllTypes(!showAllTypes)}
          >
            {showAllTypes ? 'Show Less' : `Show All ${typeSummaries.length} Types`}
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Composition</CardTitle>
          <CardDescription>
            Breakdown of your portfolio by investment type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {typeSummaries.map(summary => (
              <div key={summary.type} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${summary.color}`}></div>
                  <span className="font-medium">{summary.type}</span>
                  <Badge variant="outline" className="text-xs">
                    {summary.count}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{summary.percentage}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(summary.totalValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}