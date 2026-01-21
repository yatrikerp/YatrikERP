import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  X,
  Eye
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const NotificationsAlertManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter, statusFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await apiFetch(`/api/admin/notifications/alerts?${params.toString()}`);

      if (res.ok) {
        setNotifications(res.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      trip_assigned: 'bg-blue-100 text-blue-700',
      trip_cancelled: 'bg-red-100 text-red-700',
      trip_delayed: 'bg-yellow-100 text-yellow-700',
      trip_completed: 'bg-green-100 text-green-700',
      maintenance_due: 'bg-orange-100 text-orange-700',
      route_changed: 'bg-purple-100 text-purple-700',
      schedule_updated: 'bg-indigo-100 text-indigo-700',
      system_announcement: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <Bell className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  if (loading && notifications.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Notifications & Alert Management</h1>
          <p className="text-gray-600">Manage system notifications and alerts</p>
        </div>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="trip_assigned">Trip Assigned</option>
              <option value="trip_cancelled">Trip Cancelled</option>
              <option value="trip_delayed">Trip Delayed</option>
              <option value="trip_completed">Trip Completed</option>
              <option value="maintenance_due">Maintenance Due</option>
              <option value="route_changed">Route Changed</option>
              <option value="schedule_updated">Schedule Updated</option>
              <option value="system_announcement">System Announcement</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Notifications ({notifications.length})
        </h2>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div
                key={notification._id || index}
                className={`p-6 rounded-lg border ${
                  notification.isRead
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(notification.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                            {notification.type.replace(/_/g, ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            notification.priority === 'urgent' || notification.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : notification.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {notification.isRead ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Read</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-blue-600">
                              <Eye className="w-4 h-4" />
                              <span>Unread</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
              <p className="text-sm text-gray-400">Notifications will appear here when they are generated</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsAlertManagement;
