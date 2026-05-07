import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import RevenueAnalytics from '../components/analytics/RevenueAnalytics';

type AnalyticsTab = 'dashboard' | 'revenue' | 'products' | 'customers' | 'conversion' | 'abandoned-carts' | 'search';

const AdminAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'conversion', label: 'Conversion', icon: '🎯' },
    { id: 'abandoned-carts', label: 'Abandoned Carts', icon: '🛒' },
    { id: 'search', label: 'Search', icon: '🔍' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'revenue':
        return <RevenueAnalytics />;
      case 'products':
        return <ProductAnalyticsComponent />;
      case 'customers':
        return <CustomerAnalyticsComponent />;
      case 'conversion':
        return <ConversionAnalyticsComponent />;
      case 'abandoned-carts':
        return <AbandonedCartAnalyticsComponent />;
      case 'search':
        return <SearchAnalyticsComponent />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AnalyticsTab)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#C4985A] text-[#C4985A]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

// Placeholder components for other analytics sections
const ProductAnalyticsComponent: React.FC = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[#2C2420] mb-8">Product Analytics</h1>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Analytics</h2>
        <p className="text-gray-600">Detailed product performance analytics coming soon...</p>
      </div>
    </div>
  </div>
);

const CustomerAnalyticsComponent: React.FC = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[#2C2420] mb-8">Customer Analytics</h1>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Analytics</h2>
        <p className="text-gray-600">Customer behavior and segmentation analytics coming soon...</p>
      </div>
    </div>
  </div>
);

const ConversionAnalyticsComponent: React.FC = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[#2C2420] mb-8">Conversion Analytics</h1>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversion Analytics</h2>
        <p className="text-gray-600">Conversion funnel and optimization analytics coming soon...</p>
      </div>
    </div>
  </div>
);

const AbandonedCartAnalyticsComponent: React.FC = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[#2C2420] mb-8">Abandoned Cart Analytics</h1>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Abandoned Cart Analytics</h2>
        <p className="text-gray-600">Cart abandonment and recovery analytics coming soon...</p>
      </div>
    </div>
  </div>
);

const SearchAnalyticsComponent: React.FC = () => (
  <div className="p-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[#2C2420] mb-8">Search Analytics</h1>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Analytics</h2>
        <p className="text-gray-600">Search behavior and optimization analytics coming soon...</p>
      </div>
    </div>
  </div>
);

export default AdminAnalyticsPage;