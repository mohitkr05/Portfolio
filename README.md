# Portfolio Investment Tracker

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20App-blue?style=for-the-badge&logo=vercel)](https://simple-personal-portfolio-1.netlify.app/investments)
[![Build Status](https://img.shields.io/badge/Build-Passing-green?style=for-the-badge&logo=github)](https://github.com/mohitkr05/Portfolio)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A comprehensive Portfolio Investment Tracker built with Next.js that provides AI-powered investment analysis, multi-currency support, and advanced portfolio analytics. Track your investments, analyze performance, and get intelligent recommendations all in one place.

## 🚀 **[Live Demo](https://simple-personal-portfolio-1.netlify.app/investments)**

## ✨ Key Features

### 📊 **Investment Tracking & Analytics**
- **CSV Import/Export:** Easy portfolio setup with template-based CSV uploads
- **Real-time Market Data:** Live price updates from multiple APIs (Alpha Vantage, Polygon.io)
- **Multi-Currency Support:** Track investments across 9+ currencies with real-time conversion
- **Performance Analysis:** Detailed profit/loss calculations with percentage returns
- **Investment Type Filtering:** Analyze by stocks, ETFs, bonds, crypto, and more

### 🤖 **AI-Powered Intelligence** 
- **Smart Recommendations:** OpenAI-powered investment suggestions based on your portfolio
- **Risk Assessment:** Automated portfolio risk scoring and diversification analysis
- **Performance Insights:** Identify top performers and underperformers automatically

### 🎨 **Modern Dashboard**
- **Visual Analytics:** Beautiful charts and performance indicators
- **Responsive Design:** Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode:** Automatic theme switching
- **Professional UI:** Built with ShadCN UI and Tailwind CSS

### 🔒 **Privacy & Security**
- **Local Data Storage:** All data stored securely in your browser (IndexedDB)
- **No Server Required:** Fully client-side application
- **Your API Keys:** Use your own OpenAI and market data API keys

## Tech Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- ShadCN UI
- Dexie.js (for IndexedDB)
- OpenAI API

## Getting Started

### Prerequisites

- Node.js (v18.17 or later)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/local-ai-portfolio.git
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. (Optional) Add your OpenAI API key:

   Create a `.env.local` file in the root of the project and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your-api-key
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Investment Portfolio Tracker

The application now includes a comprehensive investment tracking system:

### Features
- **CSV Import:** Upload investment data using the provided template format
- **Real-time Price Updates:** Fetch current market prices for stocks, ETFs, and other securities  
- **Profit/Loss Calculation:** Automatic calculation of gains/losses with percentage returns
- **Portfolio Analysis:** Diversification scoring and risk assessment
- **AI Recommendations:** Get personalized investment suggestions based on your portfolio composition
- **Multi-Currency Support:** Track investments across different currencies and countries

### CSV Template Format
```csv
country,security_type,security_name,investment_date,purchase_price,quantity,currency
USA,Stock,AAPL,2023-01-15,150.25,10,USD
USA,ETF,SPY,2023-02-01,380.50,5,USD
India,Stock,RELIANCE.NS,2023-03-10,2450.75,20,INR
```

### Supported Security Types
- Stocks
- ETFs (Exchange Traded Funds)
- Mutual Funds
- Real Estate Investment Trusts (REITs)
- Bonds
- Cryptocurrencies
- Other investment vehicles

To access the investment tracker, navigate to `/investments` in your browser or use the navigation menu.

## Deployment

You can easily deploy your portfolio to Vercel. For more information, see the [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## Contributing

Contributions are welcome! Please see the [contributing guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.