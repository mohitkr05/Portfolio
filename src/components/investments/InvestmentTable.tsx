'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

import { Investment, db } from '@/lib/db/investments';

interface InvestmentTableProps {
  investments: Investment[];
  onRefresh: () => void;
  baseCurrency?: string;
}

export default function InvestmentTable({ investments, onRefresh, baseCurrency = 'USD' }: InvestmentTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : currency === 'EUR' ? 'EUR' : currency === 'GBP' ? 'GBP' : currency === 'JPY' ? 'JPY' : 'USD',
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    if (isNaN(percentage)) return 'N/A';
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSecurityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Stock': 'bg-blue-100 text-blue-800',
      'ETF': 'bg-green-100 text-green-800',
      'Mutual Fund': 'bg-purple-100 text-purple-800',
      'Real Estate': 'bg-orange-100 text-orange-800',
      'Bond': 'bg-gray-100 text-gray-800',
      'Crypto': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-slate-100 text-slate-800',
    };
    return colors[type] || colors['Other'];
  };

  const getProfitLossColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const calculateProfitLoss = (investment: Investment) => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    const currentValue = currentPrice * investment.quantity;
    const investedValue = investment.purchasePrice * investment.quantity;
    const profitLoss = currentValue - investedValue;
    const profitLossPercentage = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

    return {
      profitLoss,
      profitLossPercentage,
      currentValue,
      investedValue
    };
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await db.investments.delete(id);
      onRefresh();
    } catch (error) {
      console.error('Error deleting investment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const investmentsWithCalculations = investments.map(investment => ({
    ...investment,
    ...calculateProfitLoss(investment)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Holdings</CardTitle>
        <CardDescription>
          Detailed view of all your investments with current performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Security</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Invested Value</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">P&L %</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investmentsWithCalculations.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{investment.securityName}</div>
                      <div className="text-xs text-muted-foreground">{investment.currency}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSecurityTypeColor(investment.securityType)}>
                      {investment.securityType}
                    </Badge>
                  </TableCell>
                  <TableCell>{investment.country}</TableCell>
                  <TableCell className="text-right">{investment.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(investment.purchasePrice, investment.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {investment.currentPrice 
                      ? formatCurrency(investment.currentPrice, investment.currency)
                      : formatCurrency(investment.purchasePrice, investment.currency)
                    }
                    {investment.lastUpdated && (
                      <div className="text-xs text-muted-foreground">
                        Updated: {formatDate(investment.lastUpdated)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(investment.investedValue, investment.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(investment.currentValue, investment.currency)}
                  </TableCell>
                  <TableCell className={`text-right ${getProfitLossColor(investment.profitLoss)}`}>
                    <div className="flex items-center justify-end">
                      {investment.profitLoss >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {formatCurrency(Math.abs(investment.profitLoss), investment.currency)}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${getProfitLossColor(investment.profitLoss)}`}>
                    {formatPercentage(investment.profitLossPercentage)}
                  </TableCell>
                  <TableCell>{formatDate(investment.investmentDate)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(investment.id!)}
                        disabled={deletingId === investment.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {investments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No investments found. Upload a CSV file to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}