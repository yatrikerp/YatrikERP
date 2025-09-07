import { useState, useEffect } from 'react';

export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState({
    loaded: false,
    coordinates: { lat: null, lng: null },
    error: null
  });

  const onSuccess = (location) => {
    setLocation({
      loaded: true,
      coordinates: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      error: null
    });
  };

  const onError = (error) => {
    setLocation({
      loaded: true,
      coordinates: { lat: null, lng: null },
      error
    });
  };

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      onError({
        code: 0,
        message: 'Geolocation not supported'
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        ...options
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  return location;
};

