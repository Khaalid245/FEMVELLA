import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { analyticsApi } from '../../api/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardData {
  revenue: {
    daily_data: Array<{
      date: string;
      revenue: number;
      orders: number;
      aov: number;
      conversion_rate: number;
    }>;
    summary: {
      total_revenue: number;
      growth_rate: number;
      total_orders: number;
      average_order_value: number;
    };
  };
  top_products: Array<{
    product_id: number;
    name: string;
    category: string;
    revenue: number;
    units_sold: number;
    conversion_rate: number;
  }>;
  customer_segments: {
    segments: Array<{
      segment: string;
      count: number;
      percentage: number;
      revenue: number;
      avg_order_value: number;
    }>;
    total_customers: number;
  };
  conversion_funnel: {
    funnel_data: {
      visitors: number;
      product_views: number;
      add_to_cart: number;
      checkout_start: number;
      checkout_complete: number;
    };
    conversion_rates: {
      overall_conversion: number;
      visitor_to_view: number;
      view_to_cart: number;
      cart_to_checkout: number;
      checkout_to_purchase: number;
    };
  };
  abandoned_carts: {
    total_abandoned: number;
    recovery_rate: number;
    total_value: number;
    lost_revenue: number;
  };
}

interface RealTimeMetrics {
  active_sessions: number;
  today_visitors: number;
  today_orders: number;
  today_revenue: number;
  current_cart_abandonment: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchRealTimeMetrics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchRealTimeMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getDashboardOverview(selectedPeriod);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeMetrics = async () => {
    try {
      const data = await analyticsApi.getRealTimeMetrics();
      setRealTimeMetrics(data);
    } catch (err) {
      console.error('Real-time metrics error:', err);
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
    labels: dashboardData?.revenue.daily_data.map(d => 
      new Date(d.date).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData?.revenue.daily_data.map(d => d.revenue) || [],
        borderColor: 'rgb(196, 152, 90)',
        backgroundColor: 'rgba(196, 152, 90, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const conversionFunnelData = {
    labels: ['Visitors', 'Product Views', 'Add to Cart', 'Checkout', 'Purchase'],
    datasets: [
      {
        label: 'Conversion Funnel',
        data: dashboardData ? [
          dashboardData.conversion_funnel.funnel_data.visitors,
          dashboardData.conversion_funnel.funnel_data.product_views,
          dashboardData.conversion_funnel.funnel_data.add_to_cart,
          dashboardData.conversion_funnel.funnel_data.checkout_start,
          dashboardData.conversion_funnel.funnel_data.checkout_complete,
        ] : [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
      },
    ],
  };

  const customerSegmentData = {
    labels: dashboardData?.customer_segments.segments.map(s => s.segment) || [],
    datasets: [
      {
        data: dashboardData?.customer_segments.segments.map(s => s.percentage) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
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
            onClick={fetchDashboardData}
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
          <h1 className="text-3xl font-bold text-[#2C2420] mb-4">Analytics Dashboard</h1>
          
          {/* Period Selector */}
          <div className="flex space-x-4 mb-6">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === days
                    ? 'bg-[#C4985A] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Metrics */}
        {realTimeMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
          >
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Sessions</h3>
              <p className="text-2xl font-bold text-green-600">{realTimeMetrics.active_sessions}</p>
              <span className="text-xs text-gray-400">Last 30 minutes</span>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Visitors</h3>
              <p className="text-2xl font-bold text-blue-600">{realTimeMetrics.today_visitors}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Orders</h3>
              <p className="text-2xl font-bold text-purple-600">{realTimeMetrics.today_orders}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Revenue</h3>
              <p className="text-2xl font-bold text-[#C4985A]">{formatCurrency(realTimeMetrics.today_revenue)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Cart Abandonment</h3>
              <p className="text-2xl font-bold text-red-600">{realTimeMetrics.current_cart_abandonment}</p>
              <span className="text-xs text-gray-400">Today</span>
            </div>
          </motion.div>
        )}

        {/* Key Metrics Cards */}
        {dashboardData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-[#C4985A]">
                {formatCurrency(dashboardData.revenue.summary.total_revenue)}
              </p>
              <div className={`flex items-center mt-2 ${
                dashboardData.revenue.summary.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="text-sm font-medium">
                  {dashboardData.revenue.summary.growth_rate >= 0 ? '↗' : '↘'} 
                  {formatPercentage(Math.abs(dashboardData.revenue.summary.growth_rate))}
                </span>
                <span className="text-xs text-gray-400 ml-2">vs previous period</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600">
                {dashboardData.revenue.summary.total_orders.toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(dashboardData.revenue.summary.average_order_value)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatPercentage(dashboardData.conversion_funnel.conversion_rates.overall_conversion)}
              </p>
            </div>
          </motion.div>
        )}

        {/* Charts Grid */}
        {dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Revenue Trend</h3>
              <Line
                data={revenueChartData}
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

            {/* Conversion Funnel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Conversion Funnel</h3>
              <Bar
                data={conversionFunnelData}
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
                    },
                  },
                }}
              />
            </motion.div>

            {/* Customer Segments */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Customer Segments</h3>
              <div className="flex items-center justify-center">
                <Doughnut
                  data={customerSegmentData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Top Products</h3>
              <div className="space-y-4">
                {dashboardData.top_products.slice(0, 5).map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-[#C4985A] text-white text-xs font-bold rounded-full">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#C4985A]">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">{product.units_sold} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Abandoned Carts Summary */}
        {dashboardData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-[#2C2420] mb-4">Abandoned Carts</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData.abandoned_carts.total_abandoned}
                </p>
                <p className="text-sm text-gray-500">Total Abandoned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(dashboardData.abandoned_carts.recovery_rate)}
                </p>
                <p className="text-sm text-gray-500">Recovery Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#C4985A]">
                  {formatCurrency(dashboardData.abandoned_carts.total_value)}
                </p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(dashboardData.abandoned_carts.lost_revenue)}
                </p>
                <p className="text-sm text-gray-500">Lost Revenue</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;