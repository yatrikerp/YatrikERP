class NotificationService {
  constructor() {
    this.listeners = [];
    this.notifications = [];
  }

  // Subscribe to notification updates
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all subscribers
  notify() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Add a new notification
  addNotification(notification) {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    this.notifications.unshift(newNotification);
    this.notify();
    
    // Store in localStorage for persistence
    this.saveToStorage();
    
    return newNotification;
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notify();
      this.saveToStorage();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notify();
    this.saveToStorage();
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Save to localStorage
  saveToStorage() {
    try {
      localStorage.setItem('passenger_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('passenger_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored).map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notify();
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notify();
    this.saveToStorage();
  }

  // Booking confirmation notification
  showBookingConfirmation(bookingData) {
    return this.addNotification({
      type: 'booking_confirmed',
      title: 'Booking Confirmed!',
      message: `Your trip from ${bookingData.from} to ${bookingData.to} has been confirmed.`,
      data: bookingData
    });
  }

  // Payment success notification
  showPaymentSuccess(paymentData) {
    return this.addNotification({
      type: 'payment_success',
      title: 'Payment Successful!',
      message: `Your payment of ₹${paymentData.amount} has been processed successfully.`,
      data: paymentData
    });
  }

  // Trip reminder notification
  showTripReminder(tripData) {
    return this.addNotification({
      type: 'trip_reminder',
      title: 'Trip Reminder',
      message: `Your trip to ${tripData.to} is tomorrow at ${tripData.time}.`,
      data: tripData
    });
  }

  // General info notification
  showInfo(title, message, data = {}) {
    return this.addNotification({
      type: 'info',
      title,
      message,
      data
    });
  }

  // Error notification
  showError(title, message, data = {}) {
    return this.addNotification({
      type: 'error',
      title,
      message,
      data
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Load notifications from storage on initialization
notificationService.loadFromStorage();

export default notificationService;
