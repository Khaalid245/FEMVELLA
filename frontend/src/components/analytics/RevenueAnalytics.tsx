import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { analyticsApi, RevenueAnalytics } from '../../api/analytics';

const RevenueAnalyticsPage: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueData();
  }, [selectedPeriod]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getRevenueAnalytics(selectedPeriod);
      setRevenueData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load revenue data');
      console.error('Revenue analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Chart configurations
  const revenueChartData = {
    labels: revenueData?.daily_data.map(d => 
      new Date(d.date).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: 'Revenue',
        data: revenueData?.daily_data.map(d => d.revenue) || [],
        borderColor: 'rgb(196, 152, 90)',
        backgroundColor: 'rgba(196, 152, 90, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Orders',
        data: revenueData?.daily_data.map(d => d.orders) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const categoryRevenueData = {
    labels: revenueData?.category_breakdown.map(c => c.category) || [],
    datasets: [
      {
        data: revenueData?.category_breakdown.map(c => c.revenue) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF',
        ],
      },
    ],
  };

  const dayOfWeekData = {
    labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    datasets: [
      {
        label: 'Average Revenue',
        data: revenueData?.day_of_week_analysis.map(d => d.avg_revenue) || [],
        backgroundColor: 'rgba(196, 152, 90, 0.8)',
      },
    ],
  };

  const aovTrendData = {
    labels: revenueData?.daily_data.map(d => 
      new Date(d.date).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: 'Average Order Value',
        data: revenueData?.daily_data.map(d => d.aov) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#C4985A]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchRevenueData}
            className="mt-4 px-4 py-2 bg-[#C4985A] text-white rounded hover:bg-[#B8875A]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2C2420] mb-4">Revenue Analytics</h1>
          
          {/* Period Selector */}
          <div className="flex space-x-4 mb-6">
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === days
                    ? 'bg-[#C4985A] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {days === 365 ? '1 Year' : `${days} Days`}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        {revenueData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-[#C4985A]">
                {formatCurrency(revenueData.summary.total_revenue)}
              </p>
              <div className={`flex items-center mt-2 ${
                revenueData.summary.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="text-sm font-medium">
                  {revenueData.summary.growth_rate >= 0 ? '↗' : '↘'} 
                  {formatPercentage(Math.abs(revenueData.summary.growth_rate))}
                </span>
                <span className="text-xs text-gray-400 ml-2">vs previous period</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600">
                {revenueData.summary.total_orders.toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(revenueData.summary.average_order_value)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Daily Average</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(revenueData.summary.total_revenue / selectedPeriod)}
              </p>
            </div>
          </motion.div>
        )}

        {/* Charts Grid */}
        {revenueData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue & Orders Trend */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Revenue & Orders Trend</h3>
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      type: 'linear' as const,
                      display: true,
                      position: 'left' as const,
                      ticks: {
                        callback: (value) => formatCurrency(Number(value)),
                      },
                    },
                    y1: {
                      type: 'linear' as const,
                      display: true,
                      position: 'right' as const,
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                }}
              />
            </motion.div>

            {/* Category Revenue Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Revenue by Category</h3>
              <div className="flex items-center justify-center">
                <Doughnut
                  data={categoryRevenueData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = formatCurrency(Number(context.raw));
                            return `${label}: ${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </motion.div>

            {/* Day of Week Analysis */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Revenue by Day of Week</h3>
              <Bar
                data={dayOfWeekData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => formatCurrency(Number(value)),
                      },
                    },
                  },
                }}
              />
            </motion.div>

            {/* Average Order Value Trend */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Average Order Value Trend</h3>
              <Line
                data={aovTrendData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => formatCurrency(Number(value)),
                      },
                    },
                  },
                }}
              />
            </motion.div>
          </div>
        )}

        {/* Category Performance Table */}
        {revenueData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#2C2420]">Category Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.category_breakdown.map((category, index) => {
                    const percentage = (category.revenue / revenueData.summary.total_revenue) * 100;
                    const avgPrice = category.units > 0 ? category.revenue / category.units : 0;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(category.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.units.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(avgPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-[#C4985A] h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">{formatPercentage(percentage)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RevenueAnalyticsPage;