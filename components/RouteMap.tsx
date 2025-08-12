import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import { Milestone, UserLocation } from '@/types';

interface RouteMapProps {
  milestones: Milestone[];
  currentLocation?: UserLocation;
  completedMilestones?: string[];
  currentMilestoneIndex?: number;
  onMilestonePress?: (milestone: Milestone, index: number) => void;
  followUser?: boolean;
  showRoute?: boolean;
  region?: Region;
}

export default function RouteMap({
  milestones,
  currentLocation,
  completedMilestones = [],
  currentMilestoneIndex = 0,
  onMilestonePress,
  followUser = false,
  showRoute = true,
  region,
}: RouteMapProps) {
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  useEffect(() => {
    console.warn("[RouteMap] Milestones updated:", milestones);
    if (milestones.length > 1) {
      fetchRoute();
    }else{
      console.warn("[RouteMap] Not enough milestones to fetch a route");
    }
  }, [milestones]);

  const fetchRoute = async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GRAPHHOPPER_API_KEY; // ✅ store in .env
      if (!apiKey) {
        console.error("[RouteMap] GraphHopper API key is missing.");
        return;
      }

      // Prepare coordinates for GraphHopper
      const points = milestones.map(
        m => `point=${m.coordinates.latitude},${m.coordinates.longitude}`
      ).join('&');

      const url = `https://graphhopper.com/api/1/route?${points}&vehicle=car&locale=en&calc_points=true&key=${apiKey}`;
      console.log("[RouteMap] Fetching route from:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("[RouteMap] GraphHopper raw response:", data);

      if (data.paths && data.paths.length > 0 && data.paths[0].points?.coordinates) {
        const coords: LatLng[] = data.paths[0].points.coordinates.map(
          ([lng,lat]: [number, number]) => ({
            latitude: lat,
            longitude: lng
          })
        );
        console.log("[RouteMap] Parsed route coordinates:", coords);
        setRouteCoords(coords);
      }else {
        console.warn("[RouteMap] No valid route returned from GraphHopper.");
      }
    } catch (err) {
      console.error('Error fetching route from GraphHopper:', err);
    }
  };

  useEffect(() => {
    if (followUser && currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation, followUser]);

  const getMarkerColor = (milestone: Milestone, index: number): string => {
    if (completedMilestones.includes(milestone.id)) return '#10B981';
    if (currentMilestoneIndex === index) return '#F97316';
    return '#3B82F6';
  };

  const getDefaultRegion = (): Region => {
    if (region) return region;

    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    if (milestones.length > 0) {
      return {
        latitude: milestones[0].coordinates.latitude,
        longitude: milestones[0].coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    return {
      latitude: 40.7128,
      longitude: -74.0060,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={getDefaultRegion()}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={followUser}
        toolbarEnabled={false}
      >
        {milestones.map((milestone, index) => (
          <Marker
            key={milestone.id}
            coordinate={milestone.coordinates}
            title={milestone.name}
            description={milestone.address}
            onPress={() => onMilestonePress?.(milestone, index)}
          >
            <View
              style={[
                styles.markerContainer,
                { backgroundColor: getMarkerColor(milestone, index) },
              ]}
            >
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}

        {showRoute && routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#3B82F6"
            strokeWidth={4}
            lineJoin="round"
            lineCap="round"
          />
        )}

        {showRoute && completedMilestones.length > 1 && (
          <Polyline
            coordinates={milestones
              .filter(m => completedMilestones.includes(m.id))
              .map(m => m.coordinates)}
            strokeColor="#10B981"
            strokeWidth={4}
            lineJoin="round"
            lineCap="round"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
