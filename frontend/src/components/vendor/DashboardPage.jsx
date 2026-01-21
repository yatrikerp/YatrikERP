import React, { useState, useEffect } from 'react';
import { Package, DollarSign, Clock, Award, AlertTriangle, Activity, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const DashboardPage = ({ vendor, dashboardData, onRefresh }) => {
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchActivityTimeline();
    if (dashboardData?.alerts) {
      setAlerts(dashboardData.alerts);
    }
  }, [dashboardData]);

  const fetchActivityTimeline = async () => {
    try {
      const response = await apiFetch('/api/vendor/activity-timeline');
      if (response.ok && response.data.success) {
        setActivityTimeline(response.data.data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
    }
  };

  // Handle different data structures
  const stats = dashboardData?.stats || dashboardData || {};
  
  // Debug log to see what data we're receiving
  useEffect(() => {
    if (dashboardData) {
      console.log('📊 DashboardPage received data:', dashboardData);
      console.log('📊 Stats extracted:', stats);
    }
  }, [dashboardData, stats]);

  return (
    <div className="space-y-6">
      {/* Live KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Active POs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeWorkOrders || stats.pendingPOs || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Pending: {stats.pendingPOs || 0}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Acceptance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingPOs || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting response</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Delivery</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inProgressPOs || 0}</p>
              <p className="text-xs text-gray-400 mt-1">In progress</p>
            </div>
            <Package className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Invoices Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingInvoices || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting admin</p>
            </div>
            <Clock className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Amount Receivable</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{(stats.pendingPayments || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400 mt-1">Total: ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</p>
            </div>
            <DollarSign className="w-10 h-10 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Trust Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{vendor?.trustScore || 0}/100</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    (vendor?.trustScore || 0) >= 90 ? 'bg-green-600' :
                    (vendor?.trustScore || 0) >= 70 ? 'bg-blue-600' :
                    (vendor?.trustScore || 0) >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${vendor?.trustScore || 0}%` }}
                />
              </div>
            </div>
            <Award className="w-10 h-10 text-pink-600" />
          </div>
        </div>
      </div>

      {/* Critical Alerts Engine */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            Critical Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' || alert.priority === 'high' ? 'bg-red-50 border-red-500' :
                  alert.type === 'warning' || alert.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start">
                  {alert.type === 'error' || alert.priority === 'high' ? (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : alert.type === 'warning' || alert.priority === 'medium' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    {alert.details && (
                      <p className="text-xs text-gray-600 mt-1">{alert.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Activity Timeline
        </h2>
        {activityTimeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No recent activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activityTimeline.map((activity, idx) => (
              <div key={idx} className="flex items-start space-x-4 pb-4 border-b last:border-0">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'po_received' ? 'bg-blue-100' :
                  activity.type === 'po_accepted' ? 'bg-green-100' :
                  activity.type === 'dispatch_created' ? 'bg-purple-100' :
                  activity.type === 'grn_completed' ? 'bg-indigo-100' :
                  activity.type === 'invoice_approved' ? 'bg-yellow-100' :
                  activity.type === 'payment_released' ? 'bg-green-100' :
                  'bg-gray-100'
                }`}>
                  {activity.type === 'po_received' ? <Package className="w-5 h-5 text-blue-600" /> :
                   activity.type === 'po_accepted' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                   activity.type === 'dispatch_created' ? <Package className="w-5 h-5 text-purple-600" /> :
                   activity.type === 'grn_completed' ? <CheckCircle className="w-5 h-5 text-indigo-600" /> :
                   activity.type === 'invoice_approved' ? <CheckCircle className="w-5 h-5 text-yellow-600" /> :
                   activity.type === 'payment_released' ? <DollarSign className="w-5 h-5 text-green-600" /> :
                   <Activity className="w-5 h-5 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
