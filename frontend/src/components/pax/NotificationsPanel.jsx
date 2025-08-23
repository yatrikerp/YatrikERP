import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  MapPin,
  Bus,
  Calendar,
  MessageSquare,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'reminder',
        title: 'Trip Reminder',
        message: 'Your Kochi → Trivandrum trip departs in 2 hours',
        time: '2 hours ago',
        read: false,
        priority: 'high',
        tripId: 'TR001',
        route: 'Kochi → Trivandrum',
        departure: '2025-08-20T08:00:00',
        busNumber: 'KL-07-AB-1234',
        seatNo: 'A12'
      },
      {
        id: 2,
        type: 'update',
        title: 'Trip Update',
        message: 'Your Kochi → Bangalore trip is confirmed',
        time: '1 day ago',
        read: true,
        priority: 'medium',
        tripId: 'TR002',
        route: 'Kochi → Bangalore',
        departure: '2025-08-22T20:00:00',
        busNumber: 'KL-07-CD-5678',
        seatNo: 'B15'
      },
      {
        id: 3,
        type: 'delay',
        title: 'Trip Delay',
        message: 'Your Kochi → Chennai trip is delayed by 30 minutes',
        time: '3 hours ago',
        read: false,
        priority: 'high',
        tripId: 'TR003',
        route: 'Kochi → Chennai',
        departure: '2025-08-19T06:00:00',
        busNumber: 'KL-07-EF-9012',
        seatNo: 'C08'
      },
      {
        id: 4,
        type: 'cancellation',
        title: 'Trip Cancelled',
        message: 'Your Bangalore → Kochi trip has been cancelled due to technical issues',
        time: '2 days ago',
        read: true,
        priority: 'high',
        tripId: 'TR004',
        route: 'Bangalore → Kochi',
        departure: '2025-08-18T08:00:00',
        busNumber: 'KA-01-GH-3456',
        seatNo: 'A15'
      },
      {
        id: 5,
        type: 'feedback',
        title: 'Feedback Request',
        message: 'How was your recent trip? Please share your experience',
        time: '3 days ago',
        read: false,
        priority: 'low',
        tripId: 'TR005',
        route: 'Kochi → Munnar',
        departure: '2025-08-15T06:00:00',
        busNumber: 'KL-07-IJ-7890',
        seatNo: 'D20'
      },
      {
        id: 6,
        type: 'payment',
        title: 'Payment Successful',
        message: 'Payment of ₹450 for Kochi → Trivandrum has been processed',
        time: '4 days ago',
        read: true,
        priority: 'medium',
        tripId: 'TR001',
        route: 'Kochi → Trivandrum',
        departure: '2025-08-20T08:00:00',
        busNumber: 'KL-07-AB-1234',
        seatNo: 'A12'
      }
    ];
    
    setNotifications(mockNotifications);
    setFilteredNotifications(mockNotifications);
  }, []);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;
    
    if (filter !== 'all') {
      filtered = notifications.filter(notification => notification.type === filter);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'reminder': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'update': return 'text-green-600 bg-green-50 border-green-200';
      case 'delay': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'cancellation': return 'text-red-600 bg-red-50 border-red-200';
      case 'feedback': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'payment': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'reminder': return <Clock className="w-4 h-4" />;
      case 'update': return <CheckCircle className="w-4 h-4" />;
      case 'delay': return <AlertCircle className="w-4 h-4" />;
      case 'cancellation': return <XCircle className="w-4 h-4" />;
      case 'feedback': return <MessageSquare className="w-4 h-4" />;
      case 'payment': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAsUnread = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: false }
          : notification
      )
    );
  };

  const handleDeleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filters = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'reminder', label: 'Reminders', count: notifications.filter(n => n.type === 'reminder').length },
    { value: 'update', label: 'Updates', count: notifications.filter(n => n.type === 'update').length },
    { value: 'delay', label: 'Delays', count: notifications.filter(n => n.type === 'delay').length },
    { value: 'cancellation', label: 'Cancellations', count: notifications.filter(n => n.type === 'cancellation').length },
    { value: 'feedback', label: 'Feedback', count: notifications.filter(n => n.type === 'feedback').length },
    { value: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-gray-600 mt-1">Stay updated with your trip information</p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark All as Read
                </button>
              )}
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Notifications</h3>
          
          <div className="flex flex-wrap gap-2">
            {filters.map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === filterOption.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{filterOption.label}</span>
                <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                  {filterOption.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {filter === 'all' ? 'All Notifications' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`}
          </h3>
          <p className="text-gray-600 mt-1">
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="p-6">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`border rounded-xl p-6 transition-all ${
                    notification.read 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Notification Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(notification.type)}`}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notification.type)}
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </div>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>

                      {/* Notification Content */}
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-900 mb-1">{notification.title}</h4>
                        <p className="text-gray-700">{notification.message}</p>
                      </div>

                      {/* Trip Information */}
                      {notification.tripId && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3 p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Route:</span>
                            <span className="font-medium text-gray-900">{notification.route}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Bus className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Bus:</span>
                            <span className="font-medium text-gray-900">{notification.busNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Departure:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(notification.departure).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Time and Actions */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{notification.time}</span>
                        <div className="flex items-center gap-2">
                          {notification.read ? (
                            <button
                              onClick={() => handleMarkAsUnread(notification.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Mark as unread"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleViewDetails(notification)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </button>
                          
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No notifications found</p>
              <p className="text-sm text-gray-400">
                {filter === 'all' ? 'You\'re all caught up!' : `No ${filter} notifications at the moment`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Notification Details</h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(selectedNotification.type)}`}>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedNotification.type)}
                    {selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}
                  </div>
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedNotification.priority)}`}>
                  {selectedNotification.priority}
                </span>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{selectedNotification.title}</h4>
                <p className="text-gray-700 mb-4">{selectedNotification.message}</p>
              </div>
              
              {selectedNotification.tripId && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Trip Information</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Route:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedNotification.route}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Bus Number:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedNotification.busNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Seat Number:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedNotification.seatNo}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Departure:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(selectedNotification.departure).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">Received {selectedNotification.time}</span>
                <div className="flex gap-3">
                  {selectedNotification.read ? (
                    <button
                      onClick={() => {
                        handleMarkAsUnread(selectedNotification.id);
                        setSelectedNotification(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Mark as Unread
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleMarkAsRead(selectedNotification.id);
                        setSelectedNotification(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      handleDeleteNotification(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
