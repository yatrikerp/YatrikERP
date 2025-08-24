import { io } from 'socket.io-client';
import { useEffect, useState, useCallback } from 'react';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(process.env.REACT_APP_BACKEND_URL || window.location.origin, {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Admin Live Hook
export const useAdminLive = () => {
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [status, setStatus] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Join admin rooms
    socket.emit('admin:join');

    // Listen for admin events
    socket.on('admin:event', (event) => {
      setEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
    });

    // Listen for metrics updates
    socket.on('admin:metrics', (newMetrics) => {
      setMetrics(newMetrics);
    });

    // Connection status
    setStatus(socket.connected);
    socket.on('connect', () => setStatus(true));
    socket.on('disconnect', () => setStatus(false));

    return () => {
      socket.emit('admin:leave');
      socket.off('admin:event');
      socket.off('admin:metrics');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return { events, metrics, status };
};

// Trip Positions Hook
export const useTripPositions = (tripId) => {
  const [positions, setPositions] = useState([]);
  const [status, setStatus] = useState(false);

  useEffect(() => {
    if (!socket || !tripId) return;

    const roomName = `trip:${tripId}`;
    socket.emit('join', roomName);

    socket.on('position_update', (data) => {
      setPositions(prev => [...prev, data]);
    });

    setStatus(socket.connected);
    socket.on('connect', () => setStatus(true));
    socket.on('disconnect', () => setStatus(false));

    return () => {
      socket.emit('leave', roomName);
      socket.off('position_update');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [tripId]);

  return { positions, status };
};

// Duty Validation Hook
export const useDutyValidation = (dutyId) => {
  const [validations, setValidations] = useState([]);
  const [status, setStatus] = useState(false);

  useEffect(() => {
    if (!socket || !dutyId) return;

    const roomName = `duty:${dutyId}`;
    socket.emit('join', roomName);

    socket.on('validation_update', (data) => {
      setValidations(prev => [...prev, data]);
    });

    setStatus(socket.connected);
    socket.on('connect', () => setStatus(true));
    socket.on('disconnect', () => setStatus(false));

    return () => {
      socket.emit('leave', roomName);
      socket.off('validation_update');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [dutyId]);

  return { validations, status };
};

// Seat Updates Hook
export const useSeatUpdates = (tripId) => {
  const [seatUpdates, setSeatUpdates] = useState([]);
  const [status, setStatus] = useState(false);

  useEffect(() => {
    if (!socket || !tripId) return;

    const roomName = `trip:${tripId}`;
    socket.emit('join', roomName);

    socket.on('seat_update', (data) => {
      setSeatUpdates(prev => [...prev, data]);
    });

    setStatus(socket.connected);
    socket.on('connect', () => setStatus(true));
    socket.on('disconnect', () => setStatus(false));

    return () => {
      socket.emit('leave', roomName);
      socket.off('seat_update');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [tripId]);

  return { seatUpdates, status };
};

// Generic socket hook for custom events
export const useSocketEvent = (eventName, callback) => {
  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [eventName, callback]);

  return socket;
};

// Emit function
export const emitSocketEvent = (eventName, data) => {
  if (socket) {
    socket.emit(eventName, data);
  }
};

export default socket;


