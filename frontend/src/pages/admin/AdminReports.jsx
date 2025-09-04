import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download, 
  Calendar, 
  Filter, 
  RefreshCw,
  FileText,
  PieChart,
  LineChart,
  Users,
  Bus,
  Route,
  DollarSign,
  Clock,
  MapPin,
  Activity,
  Target,
  Zap,
  Eye,
  Settings,
  Share,
  Mail,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    depot: 'all',
    route: 'all',
    status: 'all'
  });

  const reportTemplates = [
    {
      id: 'revenue_analysis',
      name: 'Revenue Analysis',
      description: 'Comprehensive revenue breakdown by routes, depots, and time periods',
      icon: DollarSign,
      color: 'bg-green-100 text-green-800',
      category: 'Financial',
      fields: ['total_revenue', 'average_fare', 'booking_count', 'refund_amount']
    },
    {
      id: 'trip_performance',
      name: 'Trip Performance',
      description: 'Trip completion rates, delays, and operational efficiency metrics',
      icon: Bus,
      color: 'bg-blue-100 text-blue-800',
      category: 'Operations',
      fields: ['completed_trips', 'cancelled_trips', 'average_delay', 'occupancy_rate']
    },
    {
      id: 'user_analytics',
      name: 'User Analytics',
      description: 'User registration, activity patterns, and engagement metrics',
      icon: Users,
      color: 'bg-purple-100 text-purple-800',
      category: 'Users',
      fields: ['new_registrations', 'active_users', 'booking_frequency', 'user_retention']
    },
    {
      id: 'route_efficiency',
      name: 'Route Efficiency',
      description: 'Route performance, popular destinations, and optimization insights',
      icon: Route,
      color: 'bg-orange-100 text-orange-800',
      category: 'Routes',
      fields: ['route_popularity', 'average_journey_time', 'fuel_efficiency', 'passenger_load']
    },
    {
      id: 'depot_performance',
      name: 'Depot Performance',
      description: 'Depot-wise operations, staff performance, and resource utilization',
      icon: MapPin,
      color: 'bg-teal-100 text-teal-800',
      category: 'Depots',
      fields: ['fleet_utilization', 'staff_efficiency', 'maintenance_cost', 'operational_hours']
    },
    {
      id: 'financial_summary',
      name: 'Financial Summary',
      description: 'Complete financial overview with profit/loss and expense analysis',
      icon: BarChart3,
      color: 'bg-indigo-100 text-indigo-800',
      category: 'Financial',
      fields: ['gross_revenue', 'operational_cost', 'net_profit', 'expense_breakdown']
    },
    {
      id: 'real_time_dashboard',
      name: 'Real-time Dashboard',
      description: 'Live operational metrics and system performance indicators',
      icon: Activity,
      color: 'bg-red-100 text-red-800',
      category: 'Operations',
      fields: ['active_trips', 'live_bookings', 'system_load', 'alert_count']
    },
    {
      id: 'predictive_analytics',
      name: 'Predictive Analytics',
      description: 'AI-powered insights for demand forecasting and optimization',
      icon: Target,
      color: 'bg-yellow-100 text-yellow-800',
      category: 'Analytics',
      fields: ['demand_forecast', 'peak_hours', 'seasonal_trends', 'optimization_suggestions']
    }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportId) => {
    try {
      setLoading(true);
      setSelectedReport(reportId);
      
      console.log('📊 Generating report:', reportId);
      console.log('📅 Date range:', dateRange);
      console.log('🔍 Filters:', filters);
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        depot: filters.depot,
        route: filters.route,
        status: filters.status
      });

      console.log('🌐 API URL:', `/api/admin/reports/${reportId}?${params}`);
      
      const response = await fetch(`/api/admin/reports/${reportId}?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('📡 Report response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📈 Report data received:', data);
        setReportData(data);
      } else {
        console.error('❌ Report generation failed:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert(`Failed to generate report: ${response.status}`);
      }
    } catch (error) {
      console.error('💥 Error generating report:', error);
      alert('Error generating report. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = 'pdf') => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format
      });

      const response = await fetch(`/api/admin/reports/${selectedReport}/export?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `report-${selectedReport}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getReportIcon = (reportId) => {
    const report = reportTemplates.find(r => r.id === reportId);
    return report?.icon || BarChart3;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Comprehensive business intelligence and performance analytics</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchReports}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing Reports API...');
                    // First test the simple test endpoint
                    const testResponse = await fetch('/api/admin/test-reports', {
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    console.log('📡 Test Reports API status:', testResponse.status);
                    
                    if (testResponse.ok) {
                      const testData = await testResponse.json();
                      console.log('✅ Test Reports API data:', testData);
                      
                      // Now test the main reports endpoint
                      const response = await fetch('/api/admin/reports', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                      });
                      console.log('📡 Reports API status:', response.status);
                      
                      if (response.ok) {
                        const data = await response.json();
                        console.log('📊 Reports API data:', data);
                        alert(`Reports API working! Found ${data.reports?.length || 0} report templates.`);
                      } else {
                        alert(`Main Reports API failed: ${response.status}`);
                      }
                    } else {
                      alert(`Test Reports API failed: ${testResponse.status}`);
                    }
                  } catch (error) {
                    console.error('Reports API test error:', error);
                    alert('Reports API test failed. Check console.');
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Activity className="w-5 h-5" />
                <span>Test API</span>
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg">
                <Download className="w-5 h-5" />
                <span>Export All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Templates */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h3>
              <div className="space-y-3">
                {reportTemplates.map((template) => {
                  const TemplateIcon = template.icon;
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => generateReport(template.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedReport === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${template.color}`}>
                          <TemplateIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.category}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{template.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Filters */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Filters</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Depot</label>
                    <select
                      value={filters.depot}
                      onChange={(e) => setFilters({...filters, depot: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Depots</option>
                      <option value="depot1">Central Depot</option>
                      <option value="depot2">North Depot</option>
                      <option value="depot3">South Depot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="running">Running</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Report Area */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedReport ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Report Template</h3>
                <p className="text-gray-600 mb-6">Choose from the available report templates to generate comprehensive analytics</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <button
                    onClick={() => generateReport('revenue_analysis')}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-green-800">Revenue Report</span>
                  </button>
                  <button
                    onClick={() => generateReport('trip_performance')}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Bus className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-blue-800">Trip Performance</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Report Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        {React.createElement(getReportIcon(selectedReport), { className: "w-6 h-6 text-blue-600" })}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {reportTemplates.find(r => r.id === selectedReport)?.name}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {dateRange.startDate} to {dateRange.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => exportReport('pdf')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => exportReport('excel')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport(null);
                          setReportData(null);
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                {loading ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating report...</p>
                  </div>
                ) : reportData ? (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {reportData.metrics?.map((metric, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                              {metric.change && (
                                <div className={`flex items-center mt-2 text-sm ${
                                  metric.change > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {metric.change > 0 ? 
                                    <TrendingUp className="w-4 h-4 mr-1" /> : 
                                    <TrendingDown className="w-4 h-4 mr-1" />
                                  }
                                  {Math.abs(metric.change)}%
                                </div>
                              )}
                            </div>
                            <div className={`p-3 rounded-lg ${metric.color || 'bg-blue-100'}`}>
                              {React.createElement(metric.icon || BarChart3, { 
                                className: `w-6 h-6 ${metric.iconColor || 'text-blue-600'}` 
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h4>
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <LineChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Chart visualization</p>
                            <p className="text-sm text-gray-400">Integration with chart library required</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribution</h4>
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Pie chart visualization</p>
                            <p className="text-sm text-gray-400">Integration with chart library required</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Detailed Data</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              {reportData.columns?.map((column, index) => (
                                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.rows?.map((row, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-500">Unable to generate report with current filters</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Stats Overview */}
        {!selectedReport && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900">24</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+3 this month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Sources</p>
                  <p className="text-3xl font-bold text-gray-900">8</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>All connected</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Export</p>
                  <p className="text-3xl font-bold text-gray-900">2h</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span>ago</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled Reports</p>
                  <p className="text-3xl font-bold text-gray-900">5</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600">
                <Zap className="w-4 h-4 mr-1" />
                <span>Auto-generated</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
