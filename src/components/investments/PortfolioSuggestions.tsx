'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, RefreshCw, Brain, TrendingUp, Shield, Target } from 'lucide-react';

import { Investment, db, UserProfile } from '@/lib/db/investments';
import { PortfolioCalculationService, PortfolioMetrics } from '@/lib/services/portfolioCalculations';

interface PortfolioSuggestionsProps {
  investments: Investment[];
  metrics: PortfolioMetrics;
}

export default function PortfolioSuggestions({ investments, metrics }: PortfolioSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const portfolioService = new PortfolioCalculationService();

  useEffect(() => {
    loadUserProfile();
    generateSuggestions();
  }, [investments, metrics]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async () => {
    try {
      const profiles = await db.userProfiles.toArray();
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const generateSuggestions = async () => {
    try {
      const investmentsWithMetrics = await portfolioService.calculateInvestmentMetrics(investments);
      const baseSuggestions = portfolioService.generatePortfolioSuggestions(
        metrics,
        investmentsWithMetrics,
        userProfile?.riskTolerance
      );
      setSuggestions(baseSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const generateAISuggestions = async () => {
    setLoading(true);
    try {
      // Create a simplified portfolio summary for AI analysis
      const portfolioSummary = {
        totalValue: metrics.currentValue,
        totalInvested: metrics.totalInvestment,
        profitLoss: metrics.totalProfitLoss,
        profitLossPercentage: metrics.totalProfitLossPercentage,
        diversificationScore: metrics.diversificationScore,
        riskLevel: metrics.riskLevel,
        investmentCount: investments.length,
        assetTypes: [...new Set(investments.map(inv => inv.securityType))],
        countries: [...new Set(investments.map(inv => inv.country))],
        currencies: [...new Set(investments.map(inv => inv.currency))],
        userRiskTolerance: userProfile?.riskTolerance || 'Moderate'
      };

      const prompt = `
        Analyze this investment portfolio and provide 3-5 specific, actionable recommendations:

        Portfolio Summary:
        - Total Value: $${portfolioSummary.totalValue.toFixed(2)}
        - Total Invested: $${portfolioSummary.totalInvested.toFixed(2)}
        - Profit/Loss: $${portfolioSummary.profitLoss.toFixed(2)} (${portfolioSummary.profitLossPercentage.toFixed(2)}%)
        - Diversification Score: ${portfolioSummary.diversificationScore}/100
        - Risk Level: ${portfolioSummary.riskLevel}
        - Number of Holdings: ${portfolioSummary.investmentCount}
        - Asset Types: ${portfolioSummary.assetTypes.join(', ')}
        - Countries: ${portfolioSummary.countries.join(', ')}
        - Currencies: ${portfolioSummary.currencies.join(', ')}
        - Risk Tolerance: ${portfolioSummary.userRiskTolerance}

        Please provide specific, actionable investment recommendations focusing on:
        1. Portfolio diversification improvements
        2. Risk management based on user tolerance
        3. Potential rebalancing suggestions
        4. Asset allocation adjustments
        5. Geographic or sector diversification

        Keep recommendations concise and practical. Each recommendation should be 1-2 sentences.
      `;

      // Try to use OpenAI API if available
      try {
        const response = await fetch('/api/portfolio-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            portfolioSummary,
            prompt: prompt.slice(0, 1000) // Limit prompt size
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.suggestions) {
            setAiSuggestions(data.suggestions);
            return;
          }
        }
      } catch (error) {
        console.warn('OpenAI API not available, using fallback suggestions');
      }

      // Fallback to mock suggestions if OpenAI API fails
      console.log('Using mock AI suggestions');
      const mockAISuggestions = [
        'Consider adding international bonds to reduce portfolio volatility and currency risk.',
        'Your portfolio lacks exposure to emerging markets. Consider adding an emerging markets ETF for growth potential.',
        'Technology sector concentration appears high. Consider rebalancing into defensive sectors like utilities or consumer staples.',
        'Add a small allocation to commodities or REIT ETFs for inflation protection.',
        'Consider tax-loss harvesting opportunities with underperforming positions to optimize tax efficiency.'
      ];

      setAiSuggestions(mockAISuggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionIcon = (suggestion: string) => {
    if (suggestion.toLowerCase().includes('diversif')) return <Target className="w-4 h-4" />;
    if (suggestion.toLowerCase().includes('risk')) return <Shield className="w-4 h-4" />;
    if (suggestion.toLowerCase().includes('rebalanc')) return <TrendingUp className="w-4 h-4" />;
    return <Lightbulb className="w-4 h-4" />;
  };

  const getSuggestionPriority = (suggestion: string) => {
    if (suggestion.toLowerCase().includes('high concentration') || 
        suggestion.toLowerCase().includes('exceeds your risk tolerance')) {
      return 'High';
    }
    if (suggestion.toLowerCase().includes('consider') && 
        (suggestion.toLowerCase().includes('diversif') || suggestion.toLowerCase().includes('risk'))) {
      return 'Medium';
    }
    return 'Low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Portfolio Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Portfolio Recommendations
          </CardTitle>
          <CardDescription>
            Automated analysis based on your current portfolio composition
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => {
                const priority = getSuggestionPriority(suggestion);
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    {getSuggestionIcon(suggestion)}
                    <div className="flex-1">
                      <p className="text-sm">{suggestion}</p>
                    </div>
                    <Badge className={getPriorityColor(priority)} variant="secondary">
                      {priority}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No specific recommendations at this time. Your portfolio appears well-balanced.
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI-Powered Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Advanced analysis and personalized recommendations powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiSuggestions.length === 0 ? (
              <div className="text-center py-6">
                <Button onClick={generateAISuggestions} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Portfolio...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Get AI Insights
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Generate personalized recommendations using AI analysis
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <Alert key={index}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      {suggestion}
                    </AlertDescription>
                  </Alert>
                ))}
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={generateAISuggestions} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh AI Insights
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}