import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, CircleCheck as CheckCircle, Circle, X } from 'lucide-react-native';
import { Milestone } from '@/types';

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  isCompleted?: boolean;
  isCurrent?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export default function MilestoneCard({
  milestone,
  index,
  isCompleted = false,
  isCurrent = false,
  onPress,
  onRemove,
  showRemoveButton = false,
}: MilestoneCardProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompleted && styles.containerCompleted,
        isCurrent && styles.containerCurrent,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {/* Order Badge */}
        <View style={[
          styles.orderBadge,
          isCompleted && styles.orderBadgeCompleted,
          isCurrent && styles.orderBadgeCurrent,
        ]}>
          {isCompleted ? (
            <CheckCircle size={20} color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.orderText,
              isCurrent && styles.orderTextCurrent,
            ]}>
              {index + 1}
            </Text>
          )}
        </View>
        
        {/* Milestone Info */}
        <View style={styles.info}>
          <Text style={[
            styles.name,
            isCompleted && styles.nameCompleted,
            isCurrent && styles.nameCurrent,
          ]}>
            {milestone.name}
          </Text>
          <Text style={[
            styles.address,
            isCompleted && styles.addressCompleted,
          ]}>
            {milestone.address}
          </Text>
        </View>

        {/* Remove Button */}
        {showRemoveButton && onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
          >
            <X size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {formatDuration(milestone.estimatedDuration)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {milestone.coordinates.latitude.toFixed(4)}, {milestone.coordinates.longitude.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Status Indicator */}
      <View style={[
        styles.statusIndicator,
        isCompleted && styles.statusIndicatorCompleted,
        isCurrent && styles.statusIndicatorCurrent,
      ]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#D1D5DB',
  },
  containerCompleted: {
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  containerCurrent: {
    borderLeftColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderBadgeCompleted: {
    backgroundColor: '#10B981',
  },
  orderBadgeCurrent: {
    backgroundColor: '#F97316',
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderTextCurrent: {
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  nameCompleted: {
    color: '#10B981',
  },
  nameCurrent: {
    color: '#F97316',
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  addressCompleted: {
    color: '#059669',
  },
  removeButton: {
    padding: 4,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 44,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  statusIndicatorCompleted: {
    backgroundColor: '#10B981',
  },
  statusIndicatorCurrent: {
    backgroundColor: '#F97316',
  },
});