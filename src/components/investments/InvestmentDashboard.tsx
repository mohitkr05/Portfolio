'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, RefreshCw } from 'lucide-react';

import { Investment, db } from '@/lib/db/investments';
import { parseCSV, validateCSVRow, convertCSVRowToInvestment } from '@/lib/utils/csv';
import { PortfolioCalculationService, PortfolioMetrics } from '@/lib/services/portfolioCalculations';
import { RealMarketDataService } from '@/lib/services/realMarketData';
import InvestmentTable from './InvestmentTable';
import PortfolioSummary from './PortfolioSummary';
import PortfolioSuggestions from './PortfolioSuggestions';
import CurrencySelector from './CurrencySelector';
import InvestmentTypeFilter from './InvestmentTypeFilter';

export default function InvestmentDashboard() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const portfolioService = new PortfolioCalculationService();
  const marketDataService = new RealMarketDataService();

  useEffect(() => {
    loadInvestments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize selected types when investments load
  useEffect(() => {
    if (investments.length > 0 && selectedTypes.length === 0) {
      const uniqueTypes = [...new Set(investments.map(inv => inv.securityType))];
      setSelectedTypes(uniqueTypes);
    }
  }, [investments, selectedTypes.length]);

  // Filter investments based on selected types
  const filteredInvestments = investments.filter(inv => 
    selectedTypes.length === 0 || selectedTypes.includes(inv.securityType)
  );

  useEffect(() => {
    // Recalculate metrics when currency or selected types change
    if (investments.length > 0 && selectedTypes.length > 0) {
      const recalculate = async () => {
        try {
          const metrics = await portfolioService.calculatePortfolioMetrics(filteredInvestments, selectedCurrency);
          setPortfolioMetrics(metrics);
        } catch (error) {
          console.error('Failed to recalculate metrics:', error);
        }
      };
      recalculate();
    }
  }, [selectedCurrency, filteredInvestments]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const data = await db.investments.toArray();
      setInvestments(data);
      
      if (data.length > 0) {
        const metrics = await portfolioService.calculatePortfolioMetrics(data, selectedCurrency);
        setPortfolioMetrics(metrics);
      }
    } catch (err) {
      setError('Failed to load investments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      
      const csvContent = await file.text();
      const rows = parseCSV(csvContent);
      
      const validationErrors: string[] = [];
      const validInvestments: Investment[] = [];
      
      rows.forEach((row, index) => {
        const errors = validateCSVRow(row);
        if (errors.length > 0) {
          validationErrors.push(`Row ${index + 2}: ${errors.join(', ')}`);
        } else {
          validInvestments.push(convertCSVRowToInvestment(row));
        }
      });
      
      if (validationErrors.length > 0) {
        setError(`Validation errors:\n${validationErrors.join('\n')}`);
        return;
      }
      
      // Clear existing investments and add new ones
      await db.investments.clear();
      await db.investments.bulkAdd(validInvestments);
      
      await loadInvestments();
      
    } catch (err) {
      setError('Failed to process CSV file');
      console.error(err);
    } finally {
      setUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleRefreshPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedInvestments = await marketDataService.updateAllPrices(investments);
      
      // Update database
      for (const investment of updatedInvestments) {
        await db.investments.put(investment);
      }
      
      setInvestments(updatedInvestments);
      
      if (updatedInvestments.length > 0) {
        const metrics = await portfolioService.calculatePortfolioMetrics(updatedInvestments, selectedCurrency);
        setPortfolioMetrics(metrics);
      }
      
    } catch (err) {
      setError('Failed to refresh prices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `country,security_type,security_name,investment_date,purchase_price,quantity,currency
USA,Stock,AAPL,2023-01-15,150.25,10,USD
USA,ETF,SPY,2023-02-01,380.50,5,USD
India,Stock,RELIANCE.NS,2023-03-10,2450.75,20,INR`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investment-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPortfolioData = async () => {
    try {
      const data = {
        investments,
        portfolioMetrics,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export portfolio data');
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    setSelectedCurrency(currency);
    
    // Recalculate metrics with new currency
    if (investments.length > 0) {
      try {
        setLoading(true);
        const metrics = await portfolioService.calculatePortfolioMetrics(filteredInvestments, currency);
        setPortfolioMetrics(metrics);
      } catch (error) {
        console.error('Failed to recalculate with new currency:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTypeChange = (types: string[]) => {
    setSelectedTypes(types);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-3">Investment Portfolio</h1>
            <p className="text-blue-100 text-lg">
              Track your investments, analyze performance, and get AI-powered recommendations
            </p>
            {portfolioMetrics && (
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <span className="opacity-80">Total Investments:</span>
                  <span className="font-semibold ml-1">{investments.length}</span>
                </div>
                <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <span className="opacity-80">Portfolio Value:</span>
                  <span className="font-semibold ml-1">{portfolioMetrics.currentValue.toLocaleString()} {selectedCurrency}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <CurrencySelector 
              selectedCurrency={selectedCurrency}
              onCurrencyChange={handleCurrencyChange}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={downloadTemplate} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
              <Button variant="secondary" onClick={downloadPortfolioData} disabled={investments.length === 0} className="bg-white/20 hover:bg-white/30 text-white border-white/30 disabled:opacity-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="secondary" onClick={handleRefreshPrices} disabled={loading || investments.length === 0} className="bg-white/20 hover:bg-white/30 text-white border-white/30 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Prices
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      {investments.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">Get Started with Your Portfolio</CardTitle>
            <CardDescription className="text-base">
              Upload a CSV file with your investment data to begin tracking your portfolio performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={uploading}
                className="max-w-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
              />
              {uploading && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="font-medium">Processing your data...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Upload for existing portfolios */}
      {investments.length > 0 && (
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Upload className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Add More Investments
            </CardTitle>
            <CardDescription>
              Upload additional investment data to expand your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={uploading}
                className="max-w-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {investments.length > 0 && portfolioMetrics && (
        <>
          <PortfolioSummary 
            metrics={portfolioMetrics} 
            investmentCount={filteredInvestments.length}
            currency={selectedCurrency}
          />

          <InvestmentTypeFilter
            investments={investments}
            portfolioMetrics={portfolioMetrics}
            selectedTypes={selectedTypes}
            onTypeChange={handleTypeChange}
            baseCurrency={selectedCurrency}
          />
          
          <InvestmentTable 
            investments={filteredInvestments} 
            onRefresh={loadInvestments}
            baseCurrency={selectedCurrency}
          />
          
          <PortfolioSuggestions 
            investments={filteredInvestments}
            metrics={portfolioMetrics}
          />
        </>
      )}

      {investments.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No investments found</h3>
            <p className="text-muted-foreground mb-4">
              Upload a CSV file to start tracking your investment portfolio
            </p>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}