import { Investment } from '../db/investments';

export interface CSVRow {
  country: string;
  security_type: string;
  security_name: string;
  investment_date: string;
  purchase_price: string;
  quantity: string;
  currency: string;
}

export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    if (row.country && row.security_type && row.security_name && row.investment_date && row.purchase_price && row.quantity && row.currency) {
      rows.push(row as unknown as CSVRow);
    }
  }
  
  return rows;
}

export function validateCSVRow(row: CSVRow): string[] {
  const errors: string[] = [];
  
  if (!row.country) errors.push('Country is required');
  if (!row.security_type) errors.push('Security type is required');
  if (!row.security_name) errors.push('Security name is required');
  if (!row.investment_date) errors.push('Investment date is required');
  if (!row.purchase_price || isNaN(Number(row.purchase_price))) {
    errors.push('Valid purchase price is required');
  }
  if (!row.quantity || isNaN(Number(row.quantity))) {
    errors.push('Valid quantity is required');
  }
  if (!row.currency) errors.push('Currency is required');
  
  // Validate date format
  if (row.investment_date && !isValidDate(row.investment_date)) {
    errors.push('Investment date must be in YYYY-MM-DD format');
  }
  
  return errors;
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function convertCSVRowToInvestment(row: CSVRow): Investment {
  const now = new Date().toISOString();
  
  return {
    country: row.country,
    securityType: row.security_type as Investment['securityType'],
    securityName: row.security_name,
    investmentDate: row.investment_date,
    purchasePrice: Number(row.purchase_price),
    quantity: Number(row.quantity),
    currency: row.currency,
    createdAt: now,
    updatedAt: now
  };
}

export function generateCSVTemplate(): string {
  const headers = ['country', 'security_type', 'security_name', 'investment_date', 'purchase_price', 'quantity', 'currency'];
  const sampleRows = [
    'USA,Stock,AAPL,2023-01-15,150.25,10,USD',
    'USA,ETF,SPY,2023-02-01,380.50,5,USD',
    'India,Stock,RELIANCE.NS,2023-03-10,2450.75,20,INR'
  ];
  
  return [headers.join(','), ...sampleRows].join('\n');
}