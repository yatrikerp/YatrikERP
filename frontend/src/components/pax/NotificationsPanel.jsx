import React, { useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, X, Clock, Bus, MapPin } from 'lucide-react';

const NotificationsPanel = ({ notificationsData, onDismiss, onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const defaultNotifications = [
    {
      id: 1,
      type: 'urgent',
      title: 'Bus Delayed',
      message: 'Your bus KL-07-AB-1234 is delayed by 15 minutes due to traffic.',
      timestamp: '2 minutes ago',
      isRead: false,
      icon: Bus,
      color: 'bg-red-100 text-red-800'
    },
    {
      id: 2,
      type: 'info',
      title: 'Boarding Started',
      message: 'Boarding has started for your Mumbai → Delhi trip. Please reach the platform.',
      timestamp: '10 minutes ago',
      isRead: false,
      icon: MapPin,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 3,
      type: 'success',
      title: 'Payment Successful',
      message: 'Your payment of ₹1200 for trip TRP001 has been processed successfully.',
      timestamp: '1 hour ago',
      isRead: true,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 4,
      type: 'warning',
      title: 'Route Change',
      message: 'Minor route change for your upcoming trip due to road construction.',
      timestamp: '2 hours ago',
      isRead: true,
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 5,
      type: 'info',
      title: 'New Offers',
      message: 'Get 20% off on your next booking. Use code YATRIK20.',
      timestamp: '1 day ago',
      isRead: true,
      icon: Info,
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  const data = notificationsData || defaultNotifications;
  const urgentNotifications = data.filter(n => n.type === 'urgent' && !n.isRead);
  const otherNotifications = data.filter(n => n.type !== 'urgent' || n.isRead);
  const unreadCount = data.filter(n => !n.isRead).length;

  const getIcon = (type) => {
    const iconMap = {
      urgent: AlertTriangle,
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle
    };
    return iconMap[type] || Info;
  };

  const handleDismiss = (notificationId) => {
    if (onDismiss) {
      onDismiss(notificationId);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {/* Urgent Notifications */}
            {urgentNotifications.length > 0 && (
              <div className="p-3 bg-red-50 border-b border-red-100">
                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Urgent Alerts
                </h4>
                {urgentNotifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div key={notification.id} className="bg-white rounded-lg p-3 mb-2 border border-red-200">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${notification.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-sm">{notification.title}</h5>
                          <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {notification.timestamp}
                            </span>
                            <button
                              onClick={() => handleDismiss(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Other Notifications */}
            <div className="p-3">
              {otherNotifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div key={notification.id} className={`rounded-lg p-3 mb-2 border transition-all duration-200 hover:shadow-sm ${
                    notification.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${notification.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className={`font-semibold text-sm ${
                            notification.isRead ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h5>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notification.timestamp}
                          </span>
                          <div className="flex gap-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => handleDismiss(notification.id)}
                              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
