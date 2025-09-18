import React from 'react';
import { 
  X, 
  Bell, 
  Check, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Clock,
  Calendar,
  Bus,
  User
} from 'lucide-react';
import './NotificationCenter.css';

const NotificationCenter = ({ 
  notifications = [], 
  unreadCount = 0, 
  onClose, 
  onMarkAsRead, 
  onMarkAllAsRead 
}) => {
  const getNotificationIcon = (type, priority) => {
    switch (type) {
      case 'trip_update':
        return <Bus size={16} className="text-blue-500" />;
      case 'trip_assigned':
        return <Calendar size={16} className="text-green-500" />;
      case 'system_alert':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'message':
        return <Info size={16} className="text-gray-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="notification-center">
      <div className="notification-overlay" onClick={onClose}></div>
      <div className="notification-panel">
        {/* Header */}
        <div className="notification-header">
          <div className="header-left">
            <Bell size={20} />
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount}</span>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
              >
                <Check size={16} />
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`notification-item ${getPriorityColor(notification.priority)} ${
                  notification.read ? 'read' : 'unread'
                }`}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">
                    {notification.title}
                    {!notification.read && <div className="unread-dot"></div>}
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-time">
                    <Clock size={12} />
                    <span>{formatTime(notification.timestamp)}</span>
                  </div>
                </div>
                {notification.priority === 'high' && (
                  <div className="priority-indicator">
                    <AlertCircle size={16} className="text-red-500" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-notifications">
              <Bell size={48} className="text-gray-400" />
              <h4>No notifications</h4>
              <p>You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="notification-footer">
          <div className="notification-stats">
            <span className="total-count">{notifications.length} total</span>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount} unread</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;