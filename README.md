# Local AI Portfolio

Local AI Portfolio is a fully client-side Next.js application that lets you manage and showcase your portfolio online. All data is stored locally in your browser, and you can use your own OpenAI API key for AI-powered text generation.

## Features

- **Portfolio Dashboard:** Add, edit, and delete portfolio items (projects, blog posts, skills).
- **Investment Portfolio Tracker:** Upload CSV files to track investments, calculate profit/loss, analyze diversification, and get AI-powered recommendations.
- **Public Portfolio View:** A modern landing page to showcase your work.
- **AI Integration:** Generate portfolio content and investment recommendations with OpenAI.
- **Local Data Storage:** All data is stored in your browser (IndexedDB).
- **Import/Export:** Back up and restore your portfolio with JSON/CSV files.

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