import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Search, Plus, X, Clock, MapPin, Zap } from 'lucide-react-native';
import { useRouteStore } from '@/stores/useRouteStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { PlaceSearchService } from '@/utils/placeSearchService';
import { PlaceSearchResult, Milestone } from '@/types';

const DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

export default function PlanRouteScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [searchService] = useState(() => PlaceSearchService.getInstance());

  const {
    searchResults,
    selectedMilestones,
    optimizedRoute,
    isOptimizing,
    setSearchResults,
    addMilestone,
    removeMilestone,
    updateMilestoneEstimatedTime,
    optimizeRoute,
    clearAll,
    saveRoute,
  } = useRouteStore();

  const { currentLocation } = useLocationStore();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchService.searchPlaces(searchQuery, currentLocation || undefined);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Search Error', 'Failed to search for places. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMilestone = (place: PlaceSearchResult) => {
    if (selectedMilestones.length >= 10) {
      Alert.alert('Limit Reached', 'Maximum 10 milestones allowed per route.');
      return;
    }
    
    addMilestone(place, selectedDuration);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleOptimizeRoute = async () => {
    if (selectedMilestones.length < 3) {
      Alert.alert('More Milestones Needed', 'At least 3 milestones are required for route optimization.');
      return;
    }

    try {
      await optimizeRoute(selectedMilestones);
      Alert.alert('Success', 'Route optimized successfully!');
    } catch (error) {
      console.error('Optimization failed:', error);
      Alert.alert('Optimization Error', 'Failed to optimize route. Please try again.');
    }
  };

  const handleSaveRoute = () => {
    if (!optimizedRoute) return;
    
    Alert.prompt(
      'Save Route',
      'Enter a name for this adventure:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (routeName) => {
            if (routeName) {
              saveRoute(optimizedRoute, routeName);
              Alert.alert('Success', 'Route saved successfully!');
            }
          },
        },
      ],
      'plain-text',
      `Adventure ${new Date().toLocaleDateString()}`
    );
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Plan Your Adventure</Text>
        <Text style={styles.subtitle}>Search places and create your route</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for places..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Search size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Duration Picker */}
          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Estimated visit time:</Text>
            <View style={styles.durationOptions}>
              {DURATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.durationOption,
                    selectedDuration === option.value && styles.durationOptionSelected,
                  ]}
                  onPress={() => setSelectedDuration(option.value)}
                >
                  <Text
                    style={[
                      styles.durationOptionText,
                      selectedDuration === option.value && styles.durationOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.searchResultCard}
                onPress={() => handleAddMilestone(place)}
              >
                <View style={styles.searchResultHeader}>
                  <Text style={styles.searchResultName}>{place.name}</Text>
                  <Plus size={20} color="#3B82F6" />
                </View>
                <Text style={styles.searchResultAddress}>{place.address}</Text>
                {place.distance && (
                  <Text style={styles.searchResultDistance}>
                    {formatDistance(place.distance)} away
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Milestones */}
        {selectedMilestones.length > 0 && (
          <View style={styles.milestonesContainer}>
            <View style={styles.milestonesHeader}>
              <Text style={styles.sectionTitle}>
                Selected Milestones ({selectedMilestones.length}/10)
              </Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAll}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            
            {selectedMilestones.map((milestone, index) => (
              <View key={milestone.id} style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneOrder}>{index + 1}</Text>
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneName}>{milestone.name}</Text>
                    <Text style={styles.milestoneAddress}>{milestone.address}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeMilestoneButton}
                    onPress={() => removeMilestone(milestone.id)}
                  >
                    <X size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.milestoneDetails}>
                  <View style={styles.milestoneDetailItem}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.milestoneDetailText}>
                      {formatDuration(milestone.estimatedDuration)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Optimize Route Button */}
        {selectedMilestones.length >= 3 && (
          <TouchableOpacity
            style={styles.optimizeButton}
            onPress={handleOptimizeRoute}
            disabled={isOptimizing}
          >
            <Zap size={20} color="#FFFFFF" />
            <Text style={styles.optimizeButtonText}>
              {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Optimized Route Results */}
        {optimizedRoute && (
          <View style={styles.optimizedRouteContainer}>
            <Text style={styles.sectionTitle}>Optimized Route</Text>
            
            <View style={styles.routeStatsCard}>
              <View style={styles.routeStatsGrid}>
                <View style={styles.routeStatItem}>
                  <Text style={styles.routeStatNumber}>{optimizedRoute.milestones.length}</Text>
                  <Text style={styles.routeStatLabel}>Milestones</Text>
                </View>
                <View style={styles.routeStatItem}>
                  <Text style={styles.routeStatNumber}>
                    {formatDistance(optimizedRoute.totalDistance)}
                  </Text>
                  <Text style={styles.routeStatLabel}>Distance</Text>
                </View>
                <View style={styles.routeStatItem}>
                  <Text style={styles.routeStatNumber}>
                    {formatDuration(optimizedRoute.estimatedTotalTime)}
                  </Text>
                  <Text style={styles.routeStatLabel}>Duration</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.saveRouteButton}
                onPress={handleSaveRoute}
              >
                <Text style={styles.saveRouteButtonText}>Save Route</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optimizedMilestonesContainer}>
              {optimizedRoute.milestones.map((milestone, index) => (
                <View key={milestone.id} style={styles.optimizedMilestoneCard}>
                  <View style={styles.optimizedMilestoneHeader}>
                    <View style={styles.optimizedMilestoneOrder}>
                      <Text style={styles.optimizedMilestoneOrderText}>{index + 1}</Text>
                    </View>
                    <View style={styles.optimizedMilestoneInfo}>
                      <Text style={styles.optimizedMilestoneName}>{milestone.name}</Text>
                      <Text style={styles.optimizedMilestoneAddress}>{milestone.address}</Text>
                    </View>
                  </View>
                  
                  {index < optimizedRoute.routeSegments.length && (
                    <View style={styles.routeSegmentInfo}>
                      <Text style={styles.routeSegmentText}>
                        → {formatDistance(optimizedRoute.routeSegments[index].distance)} to next milestone
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
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
  searchContainer: {
    marginTop: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationContainer: {
    marginBottom: 20,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  durationOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  durationOptionTextSelected: {
    color: '#FFFFFF',
  },
  searchResultsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  searchResultCard: {
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
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  searchResultDistance: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  milestonesContainer: {
    marginBottom: 24,
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  milestoneCard: {
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
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneOrderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  milestoneAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  removeMilestoneButton: {
    padding: 4,
  },
  milestoneDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 44,
  },
  milestoneDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  milestoneDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optimizeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  optimizedRouteContainer: {
    marginBottom: 40,
  },
  routeStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  routeStatItem: {
    alignItems: 'center',
  },
  routeStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  routeStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  saveRouteButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveRouteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optimizedMilestonesContainer: {
    gap: 12,
  },
  optimizedMilestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optimizedMilestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optimizedMilestoneOrder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optimizedMilestoneOrderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optimizedMilestoneInfo: {
    flex: 1,
  },
  optimizedMilestoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  optimizedMilestoneAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeSegmentInfo: {
    marginTop: 8,
    marginLeft: 40,
  },
  routeSegmentText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
});