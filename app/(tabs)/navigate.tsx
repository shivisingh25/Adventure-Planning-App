import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Play, Square, MapPin, Clock, CircleCheck as CheckCircle, Circle, Navigation as NavigationIcon } from 'lucide-react-native';
import { useRouteStore } from '@/stores/useRouteStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { LocationService } from '@/utils/locationService';
import { NotificationService } from '@/utils/notificationService';
import { Milestone } from '@/types';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function NavigateScreen() {
  const [locationService] = useState(() => LocationService.getInstance());
  const [notificationService] = useState(() => NotificationService.getInstance());
  const mapRef = useRef<MapView>(null);
  const [showTimeline, setShowTimeline] = useState(true);

  const {
    optimizedRoute,
    activeRoute,
    isNavigating,
    startNavigation,
    stopNavigation,
    markMilestoneCompleted,
    updateCurrentMilestone,
  } = useRouteStore();


  const { currentLocation, isTracking } = useLocationStore();

  // New state for GraphHopper route coordinates
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  // Fetch route from GraphHopper when milestones change
  useEffect(() => {
    const milestones = activeRoute ? activeRoute.route.milestones : optimizedRoute?.milestones ?? [];
    if (milestones.length > 1) {
      fetchRouteFromGraphHopper(milestones);
    }
  }, [activeRoute, optimizedRoute]);

  const fetchRouteFromGraphHopper = async (milestones: Milestone[]) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GRAPHHOPPER_API_KEY;
      if (!apiKey) {
        console.error("GraphHopper API key missing");
        return;
      }

      const points = milestones
        .map(m => `point=${m.coordinates.latitude},${m.coordinates.longitude}`)
        .join("&");

      const url = `https://graphhopper.com/api/1/route?${points}&vehicle=car&locale=en&calc_points=true&key=${apiKey}`;
      console.log("[NavigateScreen] Fetching route from:", url);

      const res = await fetch(url);
      const data = await res.json();

      if (data.paths?.[0]?.points?.coordinates) {
        const coords = data.paths[0].points.coordinates.map(
          ([lng, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lng
          })
        );
        setRouteCoords(coords);
      } else {
        console.warn("[NavigateScreen] No valid route from GraphHopper");
      }
    } catch (err) {
      console.error("Error fetching route:", err);
    }
  };


  useEffect(() => {
    if (isNavigating && currentLocation && activeRoute) {
      checkMilestoneProximity();
    }
  }, [currentLocation, isNavigating, activeRoute]);

  const checkMilestoneProximity = async () => {
    if (!currentLocation || !activeRoute) return;

    const currentMilestone = activeRoute.route.milestones[activeRoute.currentMilestoneIndex];
    if (!currentMilestone || activeRoute.completedMilestones.includes(currentMilestone.id)) {
      return;
    }

    const isNear = locationService.isNearMilestone(currentLocation, currentMilestone, 100);
    
    if (isNear) {
      markMilestoneCompleted(currentMilestone.id);
      await notificationService.sendMilestoneReachedNotification(currentMilestone.name);
      
      // Check if route is completed
      if (activeRoute.currentMilestoneIndex >= activeRoute.route.milestones.length - 1) {
        await notificationService.sendRouteCompletionNotification(activeRoute.route.milestones.length);
        stopNavigation();
        Alert.alert('Adventure Complete!', 'Congratulations! You\'ve completed your adventure.');
      } else {
        // Send next destination notification
        const nextMilestone = activeRoute.route.milestones[activeRoute.currentMilestoneIndex + 1];
        if (nextMilestone) {
          const distance = locationService.calculateDistanceToMilestone(currentLocation, nextMilestone);
          await notificationService.sendNextDestinationNotification(
            nextMilestone.name,
            distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
          );
        }
      }
    }
  };

  const handleStartNavigation = async () => {
    if (!optimizedRoute) {
      Alert.alert('No Route', 'Please create an optimized route first.');
      return;
    }

    const trackingStarted = await locationService.startLocationTracking();
    if (trackingStarted) {
      startNavigation(optimizedRoute);
      Alert.alert('Navigation Started', 'Your adventure has begun! Follow the route and enjoy exploring.');
    } else {
      Alert.alert('Location Error', 'Unable to start location tracking. Please check your location settings.');
    }
  };

  const handleStopNavigation = () => {
    Alert.alert(
      'Stop Navigation',
      'Are you sure you want to stop the current adventure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await locationService.stopLocationTracking();
            stopNavigation();
          },
        },
      ]
    );
  };

  const centerMapOnUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  const centerMapOnRoute = () => {
    if (!activeRoute || !mapRef.current) return;

    const coordinates = activeRoute.route.milestones.map(m => m.coordinates);
    
    if (currentLocation) {
      coordinates.push(currentLocation);
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getMapRegion = () => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
    }
    
    if (activeRoute && activeRoute.route.milestones.length > 0) {
      const firstMilestone = activeRoute.route.milestones[0];
      return {
        latitude: firstMilestone.coordinates.latitude,
        longitude: firstMilestone.coordinates.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
    }

    // Default to New York
    return {
      latitude: 40.7128,
      longitude: -74.0060,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
  };

  //Timeline scroll reference
  const timelineScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
  if (!timelineScrollRef.current || !activeRoute) return;
  
  const itemWidth = 120; // Adjust based on your timeline item width + margin
  const scrollX = activeRoute.currentMilestoneIndex * itemWidth;

  timelineScrollRef.current.scrollTo({ x: scrollX, animated: true });
}, [activeRoute?.currentMilestoneIndex]);


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Navigation</Text>
        <View style={styles.headerActions}>
          {isNavigating ? (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopNavigation}
            >
              <Square size={16} color="#FFFFFF" />
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          ) : optimizedRoute ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartNavigation}
            >
              <Play size={16} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={getMapRegion()}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={isNavigating}
        >
          {/* Route Milestones */}
          {(activeRoute ? activeRoute.route.milestones : optimizedRoute?.milestones)?.map((milestone, index) => {
            const isCompleted = activeRoute?.completedMilestones.includes(milestone.id);
            const isCurrent = activeRoute?.currentMilestoneIndex === index;
            
            
            return (
              <Marker
                key={milestone.id}
                coordinate={milestone.coordinates}
                title={milestone.name}
                description={milestone.address}
              >
                <View style={[
                  styles.markerContainer,
                  isCompleted && styles.markerCompleted,
                  isCurrent && styles.markerCurrent,
                  
                ]}>
                  <Text style={[
                    styles.markerText,
                    isCompleted && styles.markerTextCompleted,
                    isCurrent && styles.markerTextCurrent,
                  ]}>
                    {index + 1}
                  </Text>
                </View>
              </Marker>
            );
          })}

          {/* Route Polyline */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#3B82F6"
              strokeWidth={3}
            />
          )}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={centerMapOnUser}
          >
            <NavigationIcon size={20} color="#3B82F6" />
          </TouchableOpacity>
          
          {(activeRoute || optimizedRoute) && (
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={centerMapOnRoute}
            >
              <MapPin size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>

        {/* Timeline Toggle */}
        <TouchableOpacity
          style={styles.timelineToggle}
          onPress={() => setShowTimeline(!showTimeline)}
        >
          <Text style={styles.timelineToggleText}>
            {showTimeline ? 'Hide' : 'Show'} Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      {showTimeline && (activeRoute || optimizedRoute) && (
        <View style={styles.timelineContainer}>
          <ScrollView 
            ref={timelineScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeline}
          >
            {(activeRoute ? activeRoute.route.milestones : optimizedRoute?.milestones)?.map((milestone, index) => {
              const isCompleted = activeRoute?.completedMilestones.includes(milestone.id);
              const isCurrent = activeRoute?.currentMilestoneIndex === index;
              
              return (
                <TouchableOpacity
                  key={milestone.id}
                  style={[
                    styles.timelineItem,
                    isCompleted && styles.timelineItemCompleted,
                    isCurrent && styles.timelineItemCurrent,
                  ]}
                  onPress={() => {
                    if (mapRef.current) {
                      mapRef.current.animateToRegion({
                        ...milestone.coordinates,
                        latitudeDelta: LATITUDE_DELTA * 0.5,
                        longitudeDelta: LONGITUDE_DELTA * 0.5,
                      });
                    }
                  }}
                >
                  <View style={styles.timelineItemIcon}>
                    {isCompleted ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : (
                      <Circle size={20} color={isCurrent ? '#F97316' : '#D1D5DB'} />
                    )}
                  </View>
                  
                  <Text style={[
                    styles.timelineItemName,
                    isCompleted && styles.timelineItemNameCompleted,
                    isCurrent && styles.timelineItemNameCurrent,
                  ]}>
                    {milestone.name}
                  </Text>
                  
                  <View style={styles.timelineItemDetails}>
                    <Clock size={12} color="#6B7280" />
                    <Text style={styles.timelineItemTime}>
                      {formatDuration(milestone.estimatedDuration)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* No Route State */}
      {!optimizedRoute && !activeRoute && (
        <View style={styles.noRouteContainer}>
          <MapPin size={48} color="#D1D5DB" />
          <Text style={styles.noRouteTitle}>No Route Available</Text>
          <Text style={styles.noRouteText}>
            Create and optimize a route in the Plan tab to start navigation.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  mapControlButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineToggle: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  markerCompleted: {
    backgroundColor: '#10B981',
  },
  markerCurrent: {
    backgroundColor: '#F97316',
    borderColor: '#C2410C',
  },
  markerText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 'bold',
  },
  markerTextCompleted: {
    color: '#D1FAE5',
  },
  markerTextCurrent: {
    color: '#FFF7ED',
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 16,
  },
  timeline: {
    paddingHorizontal: 20,
    gap: 16,
  },
  timelineItem: {
    alignItems: 'center',
    width: 120,
  },
  timelineItemCompleted: {
    opacity: 0.7,
  },
  timelineItemCurrent: {
    transform: [{ scale: 1.05 }],
  },
  timelineItemIcon: {
    marginBottom: 8,
  },
  timelineItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  timelineItemNameCompleted: {
    color: '#10B981',
  },
  timelineItemNameCurrent: {
    color: '#F97316',
  },
  timelineItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineItemTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  noRouteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noRouteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noRouteText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
