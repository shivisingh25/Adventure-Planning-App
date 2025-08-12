import { create } from 'zustand';
import { UserLocation } from '@/types';

interface LocationState {
  currentLocation: UserLocation | null;
  isLocationEnabled: boolean;
  locationPermission: 'granted' | 'denied' | 'undetermined';
  isTracking: boolean;
  locationHistory: UserLocation[];
  
  // Actions
  setCurrentLocation: (location: UserLocation) => void;
  setLocationPermission: (permission: 'granted' | 'denied' | 'undetermined') => void;
  setLocationEnabled: (enabled: boolean) => void;
  startTracking: () => void;
  stopTracking: () => void;
  addLocationToHistory: (location: UserLocation) => void;
  clearLocationHistory: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isLocationEnabled: false,
  locationPermission: 'undetermined',
  isTracking: false,
  locationHistory: [],

  setCurrentLocation: (location) => {
    set({ currentLocation: location });
    get().addLocationToHistory(location);
  },

  setLocationPermission: (permission) => set({ locationPermission: permission }),

  setLocationEnabled: (enabled) => set({ isLocationEnabled: enabled }),

  startTracking: () => set({ isTracking: true }),

  stopTracking: () => set({ isTracking: false }),

  addLocationToHistory: (location) => {
    set(state => ({
      locationHistory: [...state.locationHistory.slice(-99), location] // Keep last 100 locations
    }));
  },

  clearLocationHistory: () => set({ locationHistory: [] }),
}));