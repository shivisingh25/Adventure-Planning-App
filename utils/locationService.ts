import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { useLocationStore } from '@/stores/useLocationStore';
import { UserLocation } from '@/types';
import { calculateDistance } from './routeOptimization';
import { Milestone } from '@/types';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
      
      useLocationStore.getState().setCurrentLocation(userLocation);
    }
  }
});

export class LocationService {
  private static instance: LocationService;
  private watchPositionSubscription: Location.LocationSubscription | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        useLocationStore.getState().setLocationPermission('denied');
        return false;
      }

      // Request background permissions for navigation
      if (Platform.OS !== 'web') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (backgroundStatus !== 'granted') {
          console.warn('Background location permission denied');
        }
      }

      useLocationStore.getState().setLocationPermission('granted');
      useLocationStore.getState().setLocationEnabled(true);
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      useLocationStore.getState().setLocationPermission('denied');
      return false;
    }
  }

  async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      if (Platform.OS === 'web') {
        // Web fallback
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLocation: UserLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy || undefined,
                timestamp: position.timestamp,
              };
              resolve(userLocation);
            },
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
      });

      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
      };

      useLocationStore.getState().setCurrentLocation(userLocation);
      return userLocation;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  async startLocationTracking(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      if (Platform.OS === 'web') {
        // Web implementation using watchPosition
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const userLocation: UserLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || undefined,
              timestamp: position.timestamp,
            };
            useLocationStore.getState().setCurrentLocation(userLocation);
          },
          (error) => console.error('Web location tracking error:', error),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
        );
        
        useLocationStore.getState().startTracking();
        return true;
      }

      // Start foreground location tracking
      this.watchPositionSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (location) => {
          const userLocation: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
          };
          useLocationStore.getState().setCurrentLocation(userLocation);
        }
      );

      // Start background location tracking for navigation
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 10,
        deferredUpdatesInterval: 5000,
        foregroundService: {
          notificationTitle: 'AdventureRoute is tracking your location',
          notificationBody: 'Navigate to your next milestone',
        },
      });

      useLocationStore.getState().startTracking();
      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }

  async stopLocationTracking(): Promise<void> {
    try {
      if (this.watchPositionSubscription) {
        this.watchPositionSubscription.remove();
        this.watchPositionSubscription = null;
      }

      if (Platform.OS !== 'web') {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (isRegistered) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      }

      useLocationStore.getState().stopTracking();
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
    }
  }

  // Calculate distance to milestone
  calculateDistanceToMilestone(
    currentLocation: UserLocation,
    milestone: Milestone
  ): number {
    return calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      milestone.coordinates.latitude,
      milestone.coordinates.longitude
    );
  }

  // Check if user is near a milestone (within 50-100m)
  isNearMilestone(
    currentLocation: UserLocation,
    milestone: Milestone,
    radiusInMeters: number = 100
  ): boolean {
    const distanceInKm = this.calculateDistanceToMilestone(currentLocation, milestone);
    const distanceInMeters = distanceInKm * 1000;
    return distanceInMeters <= radiusInMeters;
  }
}