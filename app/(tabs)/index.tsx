import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Route as RouteIcon, Clock, Star } from 'lucide-react-native';
import { useRouteStore } from '@/stores/useRouteStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { LocationService } from '@/utils/locationService';
import { NotificationService } from '@/utils/notificationService';

export default function HomeScreen() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { savedRoutes, activeRoute, isNavigating } = useRouteStore();
  const { currentLocation, locationPermission } = useLocationStore();
  const [locationService] = useState(() => LocationService.getInstance());
  const [notificationService] = useState(() => NotificationService.getInstance());

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Request location permissions
      const locationGranted = await locationService.requestPermissions();
      
      // Request notification permissions
      const notificationGranted = await notificationService.requestPermissions();
      
      if (locationGranted) {
        await locationService.getCurrentLocation();
      }
      
      setIsInitializing(false);
      
      if (!locationGranted) {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to provide adventure planning and navigation features.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
      setIsInitializing(false);
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing AdventureRoute...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AdventureRoute</Text>
        <Text style={styles.subtitle}>Discover. Plan. Explore.</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Location Status */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <MapPin size={24} color="#3B82F6" />
            <Text style={styles.locationTitle}>Current Location</Text>
          </View>
          
          {currentLocation ? (
            <Text style={styles.locationText}>
              Lat: {currentLocation.latitude.toFixed(4)}, 
              Lng: {currentLocation.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.locationError}>
              {locationPermission === 'denied' 
                ? 'Location access denied' 
                : 'Getting your location...'}
            </Text>
          )}
        </View>

        {/* Active Route Status */}
        {isNavigating && activeRoute && (
          <View style={styles.activeRouteCard}>
            <View style={styles.activeRouteHeader}>
              <RouteIcon size={24} color="#10B981" />
              <Text style={styles.activeRouteTitle}>Active Adventure</Text>
            </View>
            
            <Text style={styles.activeRouteName}>{activeRoute.name}</Text>
            <Text style={styles.activeRouteProgress}>
              {activeRoute.completedMilestones.length} of {activeRoute.route.milestones.length} milestones completed
            </Text>
            
            <View style={styles.activeRouteStats}>
              <View style={styles.statItem}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.statText}>
                  {formatDuration(activeRoute.route.estimatedTotalTime)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.statText}>
                  {formatDistance(activeRoute.route.totalDistance)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <RouteIcon size={32} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Plan New Route</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Star size={32} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Explore Nearby</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Routes */}
        <View style={styles.savedRoutesContainer}>
          <Text style={styles.sectionTitle}>Saved Adventures</Text>
          
          {savedRoutes.length > 0 ? (
            savedRoutes.slice(0, 3).map((route, index) => (
              <View key={index} style={styles.savedRouteCard}>
                <Text style={styles.savedRouteName}>
                  Adventure {index + 1}
                </Text>
                <Text style={styles.savedRouteDetails}>
                  {route.milestones.length} milestones • {formatDistance(route.totalDistance)} • {formatDuration(route.estimatedTotalTime)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No saved adventures yet. Create your first route to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Adventure Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{savedRoutes.length}</Text>
              <Text style={styles.statLabel}>Routes Created</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {savedRoutes.reduce((total, route) => total + route.milestones.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Milestones</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {savedRoutes.reduce((total, route) => total + route.totalDistance, 0).toFixed(1)}km
              </Text>
              <Text style={styles.statLabel}>Total Distance</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationError: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  activeRouteCard: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  activeRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeRouteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  activeRouteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activeRouteProgress: {
    fontSize: 14,
    color: '#D1FAE5',
    marginBottom: 12,
  },
  activeRouteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  savedRoutesContainer: {
    marginTop: 24,
  },
  savedRouteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savedRouteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  savedRouteDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});