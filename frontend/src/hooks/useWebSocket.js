import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export const useWebSocket = (url) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    try {
      // Initialize socket connection
      socketRef.current = io(url, {
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('token')
        }
      });

      // Connection handlers
      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Message handler
      socketRef.current.on('message', (data) => {
        setLastMessage(data);
      });

    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  const sendMessage = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    sendMessage,
    on,
    off,
    emit
  };
};