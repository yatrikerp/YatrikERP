import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Archive, Trash2, AlertCircle, Info, CheckCircle, Clock, Bus, MapPin, User, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen, filter, typeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: 'read', readAt: new Date() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read', readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconProps = { size: 16 };
    
    switch (type) {
      case 'trip_assigned':
      case 'trip_updated':
      case 'trip_cancelled':
        return <Bus {...iconProps} />;
      case 'bus_assigned':
      case 'bus_maintenance':
        return <Wrench {...iconProps} />;
      case 'route_created':
      case 'route_updated':
        return <MapPin {...iconProps} />;
      case 'driver_assigned':
      case 'conductor_assigned':
        return <User {...iconProps} />;
      case 'emergency':
        return <AlertCircle {...iconProps} />;
      case 'maintenance_due':
        return <Clock {...iconProps} />;
      default:
        return priority === 'urgent' ? <AlertCircle {...iconProps} /> : <Info {...iconProps} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <div className="notification-title">
            <Bell size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="notification-actions">
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <Check size={16} />
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="notification-filters">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="trip_assigned">Trip Assigned</option>
            <option value="bus_assigned">Bus Assigned</option>
            <option value="maintenance_due">Maintenance Due</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <p>No notifications found</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-item ${notification.status}`}
                onClick={() => {
                  if (notification.status === 'unread') {
                    markAsRead(notification._id);
                  }
                  if (notification.actionData?.url) {
                    window.location.href = notification.actionData.url;
                  }
                }}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-title-row">
                    <h4 className="notification-title-text">{notification.title}</h4>
                    <div className="notification-meta">
                      <span 
                        className="priority-indicator"
                        style={{ backgroundColor: getPriorityColor(notification.priority) }}
                      ></span>
                      <span className="time-ago">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.actionData && (
                    <div className="notification-action">
                      <button className="action-button">
                        {notification.actionData.buttonText || 'View'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="notification-actions">
                  {notification.status === 'unread' && (
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  
                  <button 
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveNotification(notification._id);
                    }}
                    title="Archive"
                  >
                    <Archive size={14} />
                  </button>
                  
                  <button 
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
