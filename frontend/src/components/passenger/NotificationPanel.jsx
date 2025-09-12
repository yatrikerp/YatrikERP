import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Eye, 
  Download, 
  Calendar,
  MapPin,
  Clock,
  Bus,
  Ticket
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import notificationService from '../../services/notificationService';

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Get notifications from the notification service
      const allNotifications = notificationService.getNotifications();
      
      // If no notifications exist, create some sample ones
      if (allNotifications.length === 0) {
        notificationService.showBookingConfirmation({
          bookingId: 'BK12345678',
          pnr: 'PNR12345678',
          trip: {
            from: 'Kochi',
            to: 'Thiruvananthapuram',
            date: '2024-01-15',
            time: '08:00',
            seats: ['U1', 'U2']
          }
        });
        
        notificationService.showPaymentSuccess({
          amount: 900,
          bookingId: 'BK12345678'
        });
      }
      
      const updatedNotifications = notificationService.getNotifications();
      setNotifications(updatedNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      notificationService.markAsRead(notificationId);
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      notificationService.markAllAsRead();
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationAction = (notification) => {
    markAsRead(notification.id);
    
    switch (notification.type) {
      case 'booking_confirmed':
        navigate(`/passenger/ticket/${notification.data.pnr}`);
        break;
      case 'payment_success':
        navigate('/passenger/dashboard');
        break;
      case 'trip_reminder':
        navigate('/passenger/dashboard');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'payment_success':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'trip_reminder':
        return <Calendar className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 24) {
      return timestamp.toLocaleDateString();
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return `${minutes}m ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-pink-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-pink-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-pink-600 hover:text-pink-700"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Bell className="w-12 h-12 mb-4" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? 'bg-pink-50 border-pink-200' : 'bg-white border-gray-200'
                    }`}
                    onClick={() => handleNotificationAction(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          !notification.read ? 'text-gray-700' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Additional Info for Booking Confirmed */}
                        {notification.type === 'booking_confirmed' && notification.data.trip && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Bus className="w-4 h-4" />
                              <span className="font-medium">Trip Details</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                <span>{notification.data.trip.from} → {notification.data.trip.to}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(notification.data.trip.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>{notification.data.trip.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Ticket className="w-3 h-3" />
                                <span>Seats: {notification.data.trip.seats.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="mt-3 flex gap-2">
                          {notification.type === 'booking_confirmed' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/passenger/ticket/${notification.data.pnr}`);
                                }}
                                className="flex items-center gap-1 text-xs bg-pink-600 text-white px-3 py-1 rounded-full hover:bg-pink-700"
                              >
                                <Eye className="w-3 h-3" />
                                View Ticket
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Download ticket functionality
                                  console.log('Download ticket:', notification.data.pnr);
                                }}
                                className="flex items-center gap-1 text-xs bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-700"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
