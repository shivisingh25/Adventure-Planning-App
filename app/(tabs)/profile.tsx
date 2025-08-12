import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Settings, MapPin, Bell, Shield, Trash2, Download, Share } from 'lucide-react-native';
import { useRouteStore } from '@/stores/useRouteStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { LocationService } from '@/utils/locationService';

export default function ProfileScreen() {
  const [locationService] = useState(() => LocationService.getInstance());
  
  const { 
    savedRoutes, 
    clearAll, 
    deleteRoute,
  } = useRouteStore();

  const { 
    isLocationEnabled, 
    isTracking, 
    locationPermission,
    setLocationEnabled,
    clearLocationHistory 
  } = useLocationStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleToggleLocationTracking = async () => {
    if (isTracking) {
      await locationService.stopLocationTracking();
    } else {
      const started = await locationService.startLocationTracking();
      if (!started) {
        Alert.alert('Permission Error', 'Unable to start location tracking. Please check your location settings.');
      }
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all saved routes and location history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAll();
            clearLocationHistory();
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const handleDeleteRoute = (routeId: string, routeName: string) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete "${routeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRoute(routeId);
            Alert.alert('Success', 'Route deleted successfully.');
          },
        },
      ]
    );
  };

  const getLocationStatusText = () => {
    if (locationPermission === 'denied') return 'Permission Denied';
    if (locationPermission === 'undetermined') return 'Permission Required';
    if (isTracking) return 'Active';
    return 'Inactive';
  };

  const getLocationStatusColor = () => {
    if (locationPermission === 'denied') return '#EF4444';
    if (locationPermission === 'undetermined') return '#F97316';
    if (isTracking) return '#10B981';
    return '#6B7280';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>Manage your adventure preferences</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={24} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          {/* Location Settings */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <MapPin size={20} color="#6B7280" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Location Tracking</Text>
                <Text style={styles.settingSubtitle}>
                  Status: <Text style={{ color: getLocationStatusColor() }}>
                    {getLocationStatusText()}
                  </Text>
                </Text>
              </View>
              <Switch
                value={isTracking}
                onValueChange={handleToggleLocationTracking}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={isTracking ? '#3B82F6' : '#F3F4F6'}
                disabled={locationPermission === 'denied'}
              />
            </View>
          </View>

          {/* Notification Settings */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>
                  Milestone and navigation alerts
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={notificationsEnabled ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* Saved Routes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Adventures ({savedRoutes.length})</Text>
          
          {savedRoutes.length > 0 ? (
            savedRoutes.map((route, index) => (
              <View key={index} style={styles.routeCard}>
                <View style={styles.routeCardHeader}>
                  <Text style={styles.routeCardTitle}>
                    Adventure {index + 1}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteRouteButton}
                    onPress={() => handleDeleteRoute((route as any).id || `route_${index}`, `Adventure ${index + 1}`)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.routeCardDetails}>
                  {route.milestones.length} milestones • {route.totalDistance.toFixed(1)}km
                </Text>
                
                <View style={styles.routeCardActions}>
                  <TouchableOpacity style={styles.routeActionButton}>
                    <Share size={16} color="#3B82F6" />
                    <Text style={styles.routeActionText}>Share</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.routeActionButton}>
                    <Download size={16} color="#3B82F6" />
                    <Text style={styles.routeActionText}>Export</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyRoutesContainer}>
              <Text style={styles.emptyRoutesText}>
                No saved adventures yet. Create your first route to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Privacy & Data Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Privacy & Data</Text>
          </View>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearAllData}
          >
            <Trash2 size={20} color="#FFFFFF" />
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoTitle}>AdventureRoute</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoDescription}>
            Location-based micro-adventure planning with intelligent route optimization.
          </Text>
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
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  settingCard: {
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
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  routeCard: {
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
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  deleteRouteButton: {
    padding: 4,
  },
  routeCardDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  routeCardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  routeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  routeActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 4,
  },
  emptyRoutesContainer: {
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
  emptyRoutesText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  appInfoSection: {
    marginTop: 32,
    marginBottom: 40,
    alignItems: 'center',
    paddingVertical: 24,
  },
  appInfoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  appInfoDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});