import React from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-center h-20 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Portfolio Tracker
            </h1>
          </div>
        </div>
        <nav className="mt-8 space-y-2 px-4">
          <Link 
            href="/" 
            className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
          >
            <TrendingUp className="w-5 h-5 text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <span className="font-medium">Portfolio Dashboard</span>
          </Link>
        </nav>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
