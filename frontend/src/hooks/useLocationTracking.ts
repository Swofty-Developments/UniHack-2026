import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export interface UserMapLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
}

function toUserMapLocation(coords: Location.LocationObjectCoords): UserMapLocation {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    heading: coords.heading,
  };
}

export function useLocationTracking() {
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const [userLocation, setUserLocation] = useState<UserMapLocation | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const bootstrapLocationTracking = useCallback(async () => {
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationDenied(true);
        return;
      }

      setLocationDenied(false);

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(toUserMapLocation(currentPosition.coords));

      headingSubscriptionRef.current?.remove();
      headingSubscriptionRef.current = await Location.watchHeadingAsync((heading) => {
        const resolvedHeading =
          heading.trueHeading >= 0 && Number.isFinite(heading.trueHeading)
            ? heading.trueHeading
            : heading.magHeading;

        if (!Number.isFinite(resolvedHeading)) {
          return;
        }

        setUserLocation((prev) => (prev ? { ...prev, heading: resolvedHeading } : prev));
      });

      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 15, timeInterval: 15000 },
        (position) => setUserLocation(toUserMapLocation(position.coords))
      );
    } catch {
      setLocationDenied(true);
    } finally {
      setIsLocating(false);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationDenied(true);
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextLocation = toUserMapLocation(position.coords);
      setLocationDenied(false);
      setUserLocation(nextLocation);
      return nextLocation;
    } catch {
      setLocationDenied(true);
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    void bootstrapLocationTracking();

    return () => {
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
      headingSubscriptionRef.current?.remove();
      headingSubscriptionRef.current = null;
    };
  }, [bootstrapLocationTracking]);

  return { userLocation, locationDenied, isLocating, requestLocation };
}
