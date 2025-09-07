import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if ('Notification' in window && permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, [permission]);

  const sendNotification = useCallback((options) => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    if (permission === 'granted') {
      const notification = new Notification(options.title || 'Bus Management Alert', {
        body: options.message || '',
        icon: options.icon || '/bus-icon.png',
        badge: options.badge || '/badge-icon.png',
        tag: options.tag || 'bus-alert',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        vibrate: options.vibrate || [200, 100, 200],
        data: options.data || {}
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.onClick) {
          options.onClick(event);
        }
        notification.close();
      };

      setNotifications(prev => [...prev, { notification, timestamp: new Date() }]);

      // Auto-close after 5 seconds if not required to interact
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    }
  }, [permission]);

  const subscribe = useCallback(async () => {
    if ('Notification' in window && permission !== 'granted') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return permission === 'granted';
  }, [permission]);

  const clearNotifications = useCallback(() => {
    notifications.forEach(({ notification }) => notification.close());
    setNotifications([]);
  }, [notifications]);

  return {
    permission,
    notifications,
    sendNotification,
    subscribe,
    clearNotifications
  };
};

