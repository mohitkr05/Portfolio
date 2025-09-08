import InvestmentDashboard from '@/components/investments/InvestmentDashboard';

export const metadata = {
  title: 'Portfolio Investment Tracker - AI-Powered Portfolio Management',
  description: 'Track your investments, analyze performance with multi-currency support, get AI-powered recommendations, and manage your portfolio with advanced analytics.',
  keywords: 'portfolio tracker, investment management, AI recommendations, multi-currency, portfolio analytics',
};

export default function Home() {
  return <InvestmentDashboard />;
}
