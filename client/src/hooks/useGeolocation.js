import { useState, useEffect } from "react";

// Default coordinates: Sangli, Maharashtra (Mane Bazar home city)
const DEFAULT_COORDS = { lat: 17.125265, lng: 74.187859 };

/**
 * useGeolocation — requests browser geolocation with a 5-second timeout.
 * Falls back to DEFAULT_COORDS if denied, unavailable, or slow.
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(DEFAULT_COORDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    // Safety timeout — resolve with default if browser hangs on permission prompt
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const onSuccess = (position) => {
      clearTimeout(fallbackTimer);
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setLoading(false);
    };

    const onError = (err) => {
      clearTimeout(fallbackTimer);
      setError(err.message);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 5 * 60 * 1000 // cache for 5 minutes
    });

    return () => clearTimeout(fallbackTimer);
  }, []);

  return { location, loading, error };
};
