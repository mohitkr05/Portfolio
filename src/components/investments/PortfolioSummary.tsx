'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Target } from 'lucide-react';

import { PortfolioMetrics } from '@/lib/services/portfolioCalculations';

interface PortfolioSummaryProps {
  metrics: PortfolioMetrics;
  investmentCount: number;
  currency: string;
}

export default function PortfolioSummary({ metrics, investmentCount, currency }: PortfolioSummaryProps) {
  const formatCurrency = (amount: number) => {
    const localeMap: Record<string, string> = {
      'USD': 'en-US', 'AUD': 'en-AU', 'EUR': 'de-DE', 'GBP': 'en-GB',
      'JPY': 'ja-JP', 'CAD': 'en-CA', 'CHF': 'de-CH', 'INR': 'en-IN', 'CNY': 'zh-CN'
    };
    
    const locale = localeMap[currency] || 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return <Shield className="w-4 h-4" />;
      case 'Medium': return <Target className="w-4 h-4" />;
      case 'High': return <AlertTriangle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getProfitLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Portfolio Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.currentValue)}</div>
          <p className="text-xs text-muted-foreground">
            {investmentCount} investments
          </p>
        </CardContent>
      </Card>

      {/* Total Investment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalInvestment)}</div>
        </CardContent>
      </Card>

      {/* Profit/Loss */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
          {metrics.totalProfitLoss >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getProfitLossColor(metrics.totalProfitLoss)}`}>
            {formatCurrency(metrics.totalProfitLoss)}
          </div>
          <p className={`text-xs ${getProfitLossColor(metrics.totalProfitLoss)}`}>
            {formatPercentage(metrics.totalProfitLossPercentage)}
          </p>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          {getRiskIcon(metrics.riskLevel)}
        </CardHeader>
        <CardContent>
          <Badge className={getRiskColor(metrics.riskLevel)}>
            {metrics.riskLevel}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Diversification: {metrics.diversificationScore}%
          </p>
        </CardContent>
      </Card>

      {/* Diversification Score */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Portfolio Diversification</CardTitle>
          <CardDescription>
            Higher scores indicate better diversification across asset classes and regions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Diversification Score</span>
              <span className="text-sm font-medium">{metrics.diversificationScore}/100</span>
            </div>
            <Progress value={metrics.diversificationScore} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {metrics.diversificationScore >= 80 && "Excellent diversification"}
              {metrics.diversificationScore >= 60 && metrics.diversificationScore < 80 && "Good diversification"}
              {metrics.diversificationScore >= 40 && metrics.diversificationScore < 60 && "Moderate diversification"}
              {metrics.diversificationScore < 40 && "Consider improving diversification"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Insights */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Portfolio Insights
          </CardTitle>
          <CardDescription>Performance highlights and key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Performers */}
            {metrics.topPerformers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full mr-2">
                      <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    Top Performers
                  </h4>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    {metrics.topPerformers.length} stocks
                  </Badge>
                </div>
                <div className="space-y-2">
                  {metrics.topPerformers.slice(0, 3).map((investment, index) => {
                    const performancePercent = Math.round(((investment.currentPrice || investment.purchasePrice) / investment.purchasePrice - 1) * 100 * 100) / 100;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{investment.securityName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            +{performancePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Underperformers */}
            {metrics.underPerformers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full mr-2">
                      <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </div>
                    Underperformers
                  </h4>
                  <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    {metrics.underPerformers.length} stocks
                  </Badge>
                </div>
                <div className="space-y-2">
                  {metrics.underPerformers.slice(0, 3).map((investment, index) => {
                    const performancePercent = Math.round(((investment.currentPrice || investment.purchasePrice) / investment.purchasePrice - 1) * 100 * 100) / 100;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{investment.securityName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {performancePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Additional Insights */}
          {(metrics.topPerformers.length === 0 && metrics.underPerformers.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No performance data available yet.</p>
              <p className="text-xs">Add investments and update prices to see insights.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}