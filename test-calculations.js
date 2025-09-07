// Simple test to verify portfolio calculations
const testData = [
  { securityName: 'DRO', purchasePrice: 100.82, quantity: 27, currency: 'USD', currentPrice: 105.00 },
  { securityName: 'AMZN', purchasePrice: 165.00, quantity: 0.82929, currency: 'AUD', currentPrice: 170.00 }
];

// Exchange rates (1 USD = X currency)
const exchangeRates = {
  'USD': 1.0,
  'AUD': 1.47
};

function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / exchangeRates[fromCurrency];
  const convertedAmount = amountInUSD * exchangeRates[toCurrency];
  
  return convertedAmount;
}

function calculatePortfolioInUSD(investments) {
  let totalInvestment = 0;
  let currentValue = 0;
  
  console.log('\nInvestment Analysis:');
  console.log('====================');
  
  investments.forEach(inv => {
    const originalValue = inv.purchasePrice * inv.quantity;
    const currentValueOriginal = (inv.currentPrice || inv.purchasePrice) * inv.quantity;
    
    const originalValueUSD = convertCurrency(originalValue, inv.currency, 'USD');
    const currentValueUSD = convertCurrency(currentValueOriginal, inv.currency, 'USD');
    
    const profitLoss = currentValueUSD - originalValueUSD;
    const profitLossPercent = (profitLoss / originalValueUSD) * 100;
    
    console.log(`${inv.securityName} (${inv.currency}):`);
    console.log(`  Original: ${originalValue.toFixed(2)} ${inv.currency} = $${originalValueUSD.toFixed(2)} USD`);
    console.log(`  Current:  ${currentValueOriginal.toFixed(2)} ${inv.currency} = $${currentValueUSD.toFixed(2)} USD`);
    console.log(`  P&L: $${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)`);
    console.log('');
    
    totalInvestment += originalValueUSD;
    currentValue += currentValueUSD;
  });
  
  const totalProfitLoss = currentValue - totalInvestment;
  const totalProfitLossPercent = (totalProfitLoss / totalInvestment) * 100;
  
  console.log('Portfolio Summary (USD):');
  console.log('========================');
  console.log(`Total Invested: $${totalInvestment.toFixed(2)}`);
  console.log(`Current Value:  $${currentValue.toFixed(2)}`);
  console.log(`Profit/Loss:    $${totalProfitLoss.toFixed(2)} (${totalProfitLossPercent.toFixed(2)}%)`);
  
  // Verify calculation
  const calculationCheck = totalInvestment + totalProfitLoss;
  console.log(`\nVerification: $${totalInvestment.toFixed(2)} + $${totalProfitLoss.toFixed(2)} = $${calculationCheck.toFixed(2)}`);
  console.log(`Should equal current value: $${currentValue.toFixed(2)}`);
  console.log(`Match: ${Math.abs(calculationCheck - currentValue) < 0.01 ? 'YES' : 'NO'}`);
}

calculatePortfolioInUSD(testData);