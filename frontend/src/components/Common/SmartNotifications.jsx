import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Info,
  Settings,
  Filter,
  Search,
  Trash2,
  Eye,
  Archive,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  StarOff,
  TrendingUp
} from 'lucide-react';

const SmartNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());

  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'alert',
        title: 'Route Maintenance Required',
        message: 'Route R003 (Mumbai-Aurangabad) requires immediate maintenance due to road conditions.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        priority: 'high',
        category: 'maintenance',
        read: false,
        starred: true,
        actions: ['Schedule Maintenance', 'Reroute Traffic', 'Dismiss']
      },
      {
        id: 2,
        type: 'success',
        title: 'Trip Completed Successfully',
        message: 'Trip T001 (Mumbai-Pune Express) completed on time with 95% passenger satisfaction.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        priority: 'medium',
        category: 'operations',
        read: true,
        starred: false,
        actions: ['View Details', 'Generate Report']
      },
      {
        id: 3,
        type: 'warning',
        title: 'Driver Duty Time Limit',
        message: 'Driver Amit Singh approaching maximum duty time limit. Consider relief driver assignment.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        priority: 'high',
        category: 'safety',
        read: false,
        starred: true,
        actions: ['Assign Relief Driver', 'Extend Duty', 'Dismiss']
      },
      {
        id: 4,
        type: 'info',
        title: 'New Booking Trend',
        message: 'Increased booking requests detected for Mumbai-Goa route. Consider adding extra trips.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        priority: 'low',
        category: 'analytics',
        read: true,
        starred: false,
        actions: ['Analyze Trend', 'Add Trips', 'Dismiss']
      },
      {
        id: 5,
        type: 'alert',
        title: 'Fuel Level Alert',
        message: 'Bus MH-12-AB-1234 fuel level below 20%. Schedule refueling at next stop.',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        priority: 'medium',
        category: 'fleet',
        read: false,
        starred: false,
        actions: ['Schedule Refueling', 'Find Nearest Station', 'Dismiss']
      },
      {
        id: 6,
        type: 'success',
        title: 'Revenue Target Achieved',
        message: 'Daily revenue target of ₹50,000 achieved by 3:00 PM. Excellent performance!',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        priority: 'low',
        category: 'finance',
        read: true,
        starred: true,
        actions: ['View Report', 'Share Success', 'Dismiss']
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert': return AlertCircle;
      case 'success': return CheckCircle;
      case 'warning': return Clock;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--erp-red)';
      case 'medium': return 'var(--erp-amber)';
      case 'low': return 'var(--erp-green)';
      default: return 'var(--erp-gray-500)';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'alert': return 'var(--erp-red)';
      case 'success': return 'var(--erp-green)';
      case 'warning': return 'var(--erp-amber)';
      case 'info': return 'var(--erp-blue)';
      default: return 'var(--erp-gray-500)';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNotifications(newExpanded);
  };

  const toggleStarred = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, starred: !notification.starred }
          : notification
      )
    );
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.category === filter;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const starredCount = notifications.filter(n => n.starred).length;

  return (
    <div className="smart-notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-left">
          <h3>Smart Notifications</h3>
          <div className="notification-stats">
            <span className="stat-item">
              <Bell className="h-4 w-4" />
              {notifications.length} total
            </span>
            <span className="stat-item unread">
              <AlertCircle className="h-4 w-4" />
              {unreadCount} unread
            </span>
            <span className="stat-item starred">
              <Star className="h-4 w-4" />
              {starredCount} starred
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button className="erp-btn-primary" onClick={() => setNotifications([])}>
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
          <button className="erp-btn-primary">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="notifications-controls">
        <div className="search-filter">
          <div className="search-box">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="maintenance">Maintenance</option>
            <option value="operations">Operations</option>
            <option value="safety">Safety</option>
            <option value="analytics">Analytics</option>
            <option value="fleet">Fleet</option>
            <option value="finance">Finance</option>
          </select>
        </div>
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            All
          </button>
          <button 
            className={`view-btn ${viewMode === 'unread' ? 'active' : ''}`}
            onClick={() => setViewMode('unread')}
          >
            Unread
          </button>
          <button 
            className={`view-btn ${viewMode === 'starred' ? 'active' : ''}`}
            onClick={() => setViewMode('starred')}
          >
            Starred
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell className="h-12 w-12" />
            <h4>No notifications found</h4>
            <p>All caught up! No new notifications to display.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const IconComponent = getNotificationIcon(notification.type);
            const isExpanded = expandedNotifications.has(notification.id);
            
            return (
              <div 
                key={notification.id} 
                className={`notification-card ${notification.read ? 'read' : 'unread'} ${notification.starred ? 'starred' : ''}`}
              >
                <div className="notification-header">
                  <div className="notification-icon" style={{ color: getTypeColor(notification.type) }}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      <h4>{notification.title}</h4>
                      <div className="notification-meta">
                        <span className="priority-badge" style={{ backgroundColor: getPriorityColor(notification.priority) }}>
                          {notification.priority}
                        </span>
                        <span className="timestamp">{formatTimestamp(notification.timestamp)}</span>
                      </div>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                  </div>
                  <div className="notification-actions">
                    <button 
                      className="action-btn star-btn"
                      onClick={() => toggleStarred(notification.id)}
                    >
                      {notification.starred ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                    </button>
                    <button 
                      className="action-btn expand-btn"
                      onClick={() => toggleExpanded(notification.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="notification-expanded">
                    <div className="expanded-actions">
                      {notification.actions.map((action, index) => (
                        <button key={index} className="erp-btn-primary">
                          {action}
                        </button>
                      ))}
                    </div>
                    <div className="expanded-meta">
                      <span>Category: {notification.category}</span>
                      <span>Priority: {notification.priority}</span>
                      <span>ID: {notification.id}</span>
                    </div>
                  </div>
                )}

                <div className="notification-footer">
                  <button 
                    className="footer-btn"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                  <button 
                    className="footer-btn delete"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Smart Insights */}
      <div className="smart-insights">
        <h4>Smart Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="insight-content">
              <h5>High Priority Alerts</h5>
              <p>{notifications.filter(n => n.priority === 'high').length} notifications require immediate attention</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">
              <Clock className="h-6 w-6" />
            </div>
            <div className="insight-content">
              <h5>Response Time</h5>
              <p>Average response time: 2.3 hours</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="insight-content">
              <h5>Resolution Rate</h5>
              <p>98% of notifications resolved within SLA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartNotifications;
