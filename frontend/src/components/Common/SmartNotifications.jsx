import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';
import './SmartNotifications.css';

const SmartNotifications = ({ userRole = 'passenger' }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.log('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.log('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
      case 'delay':
        return <AlertTriangle className="notification-icon warning" />;
      case 'success':
      case 'completed':
        return <CheckCircle className="notification-icon success" />;
      case 'info':
      case 'update':
        return <Info className="notification-icon info" />;
      case 'schedule':
        return <Clock className="notification-icon schedule" />;
      default:
        return <Info className="notification-icon info" />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const toggleNotifications = () => setIsOpen(!isOpen);
  const closeNotifications = () => setIsOpen(false);

  return (
    <div className="smart-notifications">
      <div className="notification-bell" onClick={toggleNotifications}>
        <Bell className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <button className="close-btn" onClick={closeNotifications}>
              <X className="close-icon" />
            </button>
      </div>

      <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <Bell className="no-notifications-icon" />
                <p>No notifications</p>
          </div>
        ) : (
              notifications.map((notification) => (
              <div 
                key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
              >
                  <div className="notification-icon-container">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                      <div className="notification-meta">
                      <span className="notification-time">
                        {formatTime(notification.timestamp)}
                      </span>
                      {notification.priority && (
                        <span className={`notification-priority ${notification.priority}`}>
                          {notification.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
        )}
      </div>

          {notifications.length > 0 && (
            <div className="notifications-footer">
              <button className="mark-all-read-btn">
                Mark all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartNotifications;
