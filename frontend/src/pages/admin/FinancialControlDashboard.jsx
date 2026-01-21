import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  RefreshCw,
  FileText,
  Building2,
  Bus,
  CreditCard,
  Wallet,
  Smartphone
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const FinancialControlDashboard = () => {
  const [financialData, setFinancialData] = useState({
    revenue: { total: 0, today: 0, week: 0, month: 0 },
    expenses: { total: 0, today: 0, week: 0, month: 0 },
    profit: { total: 0, today: 0, week: 0, month: 0 },
    routeProfitability: [],
    depotProfitability: [],
    busProfitability: [],
    paymentModeBreakdown: [],
    paymentAuditLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/financial/control');

      if (res.ok) {
        setFinancialData(res.data);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Control Dashboard</h1>
          <p className="text-gray-600">Revenue, expenses, and profitability analytics</p>
        </div>
        <button
          onClick={fetchFinancialData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${financialData.revenue.total.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${financialData.revenue.today.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title="This Week"
          value={`₹${financialData.revenue.week.toLocaleString()}`}
          icon={BarChart3}
          color="bg-purple-500"
        />
        <StatCard
          title="This Month"
          value={`₹${financialData.revenue.month.toLocaleString()}`}
          icon={PieChart}
          color="bg-yellow-500"
        />
      </div>

      {/* Profit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Profit"
          value={`₹${financialData.profit.total.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Today's Profit"
          value={`₹${financialData.profit.today.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title="Monthly Profit"
          value={`₹${financialData.profit.month.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      {/* Tabs for different views */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'routes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Route-Wise
          </button>
          <button
            onClick={() => setActiveTab('depots')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'depots'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Depot-Wise
          </button>
          <button
            onClick={() => setActiveTab('buses')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'buses'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bus-Wise
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'payments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment Modes
          </button>
        </div>

        {/* Route Profitability */}
        {activeTab === 'routes' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Route Profitability
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Revenue/Booking
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {financialData.routeProfitability.length > 0 ? (
                    financialData.routeProfitability.map((route, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {route.routeName || route._id || 'Unknown Route'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{route.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {route.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{((route.revenue || 0) / (route.bookings || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No route profitability data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Depot Profitability */}
        {activeTab === 'depots' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Depot-Wise Revenue
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Depot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Revenue/Booking
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {financialData.depotProfitability.length > 0 ? (
                    financialData.depotProfitability.map((depot, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {depot.depotName || depot._id || 'Unknown Depot'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{depot.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {depot.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{((depot.revenue || 0) / (depot.bookings || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No depot profitability data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bus Profitability */}
        {activeTab === 'buses' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Bus className="w-5 h-5" />
              Bus-Wise Revenue
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Revenue/Booking
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {financialData.busProfitability.length > 0 ? (
                    financialData.busProfitability.map((bus, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bus.busNumber || bus._id || 'Unknown Bus'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{bus.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bus.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{((bus.revenue || 0) / (bus.bookings || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No bus profitability data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Mode Breakdown */}
        {activeTab === 'payments' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Mode Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {financialData.paymentModeBreakdown.map((mode, index) => {
                const getIcon = () => {
                  const method = (mode._id || '').toLowerCase();
                  if (method.includes('upi') || method.includes('digital')) return <Smartphone className="w-6 h-6" />;
                  if (method.includes('card')) return <CreditCard className="w-6 h-6" />;
                  return <Wallet className="w-6 h-6" />;
                };
                return (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-500 rounded-lg text-white">
                        {getIcon()}
                      </div>
                      <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-blue-700 capitalize">
                        {mode._id || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">₹{mode.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{mode.count} transactions</p>
                  </div>
                );
              })}
            </div>
            {financialData.paymentModeBreakdown.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No payment mode data available</p>
              </div>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Route Profitability (Top 10)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Revenue/Booking
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {financialData.routeProfitability.length > 0 ? (
                    financialData.routeProfitability.map((route, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {route.routeName || route._id || 'Unknown Route'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{route.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {route.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{((route.revenue || 0) / (route.bookings || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No profitability data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Audit Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payment Audit Logs</h2>
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {financialData.paymentAuditLogs.length > 0 ? (
            financialData.paymentAuditLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Payment of ₹{log.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {log.route} • {log.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payment logs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialControlDashboard;
