import InvestmentDashboard from '@/components/investments/InvestmentDashboard';

export const metadata = {
  title: 'Investment Portfolio - Local AI Portfolio',
  description: 'Track your investments, analyze performance, and get AI-powered recommendations',
};

export default function InvestmentsPage() {
  return <InvestmentDashboard />;
}