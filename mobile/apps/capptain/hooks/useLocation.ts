import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAppDispatch } from '../store/hooks';
import { updateLocation } from '../store/slices/auth.slice';

export function useLocationPermission() {
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  return { hasPermission, requestPermission };
}

export function useLocation() {
  const dispatch = useAppDispatch();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);
        dispatch(updateLocation({
          coordinates: [currentLocation.coords.latitude, currentLocation.coords.longitude],
          accuracy: currentLocation.coords.accuracy || 0,
          heading: currentLocation.coords.heading || 0,
          speed: currentLocation.coords.speed || 0,
        }));

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation(newLocation);
            dispatch(updateLocation({
              coordinates: [newLocation.coords.latitude, newLocation.coords.longitude],
              accuracy: newLocation.coords.accuracy || 0,
              heading: newLocation.coords.heading || 0,
              speed: newLocation.coords.speed || 0,
            }));
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get location');
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { location, error };
} 