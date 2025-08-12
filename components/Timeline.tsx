import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CircleCheck as CheckCircle, Circle, Clock } from 'lucide-react-native';
import { Milestone } from '@/types';

interface TimelineProps {
  milestones: Milestone[];
  completedMilestones: string[];
  currentMilestoneIndex: number;
  onMilestonePress: (milestone: Milestone, index: number) => void;
}

export default function Timeline({
  milestones,
  completedMilestones,
  currentMilestoneIndex,
  onMilestonePress,
}: TimelineProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {milestones.map((milestone, index) => {
        const isCompleted = completedMilestones.includes(milestone.id);
        const isCurrent = currentMilestoneIndex === index;
        const isUpcoming = index > currentMilestoneIndex;
        
        return (
          <TouchableOpacity
            key={milestone.id}
            style={[
              styles.timelineItem,
              isCompleted && styles.timelineItemCompleted,
              isCurrent && styles.timelineItemCurrent,
              isUpcoming && styles.timelineItemUpcoming,
            ]}
            onPress={() => onMilestonePress(milestone, index)}
          >
            {/* Connection Line */}
            {index > 0 && (
              <View style={[
                styles.connectionLine,
                isCompleted && styles.connectionLineCompleted,
              ]} />
            )}
            
            {/* Milestone Icon */}
            <View style={styles.milestoneIcon}>
              {isCompleted ? (
                <CheckCircle size={24} color="#10B981" />
              ) : (
                <Circle 
                  size={24} 
                  color={isCurrent ? '#F97316' : isUpcoming ? '#D1D5DB' : '#3B82F6'} 
                />
              )}
            </View>
            
            {/* Milestone Info */}
            <View style={styles.milestoneInfo}>
              <Text style={[
                styles.milestoneName,
                isCompleted && styles.milestoneNameCompleted,
                isCurrent && styles.milestoneNameCurrent,
                isUpcoming && styles.milestoneNameUpcoming,
              ]}>
                {milestone.name}
              </Text>
              
              <View style={styles.milestoneDetails}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.milestoneTime}>
                  {formatDuration(milestone.estimatedDuration)}
                </Text>
              </View>
              
              {/* Progress Indicator */}
              <View style={[
                styles.progressIndicator,
                isCompleted && styles.progressIndicatorCompleted,
                isCurrent && styles.progressIndicatorCurrent,
              ]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  timelineItem: {
    alignItems: 'center',
    width: 120,
    position: 'relative',
  },
  timelineItemCompleted: {
    opacity: 0.8,
  },
  timelineItemCurrent: {
    transform: [{ scale: 1.05 }],
  },
  timelineItemUpcoming: {
    opacity: 0.6,
  },
  connectionLine: {
    position: 'absolute',
    top: 12,
    left: -4,
    width: 8,
    height: 2,
    backgroundColor: '#D1D5DB',
    zIndex: 0,
  },
  connectionLineCompleted: {
    backgroundColor: '#10B981',
  },
  milestoneIcon: {
    marginBottom: 8,
    zIndex: 1,
  },
  milestoneInfo: {
    alignItems: 'center',
    width: '100%',
  },
  milestoneName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  milestoneNameCompleted: {
    color: '#10B981',
  },
  milestoneNameCurrent: {
    color: '#F97316',
  },
  milestoneNameUpcoming: {
    color: '#9CA3AF',
  },
  milestoneDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  milestoneTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressIndicator: {
    width: '80%',
    height: 2,
    backgroundColor: '#D1D5DB',
    borderRadius: 1,
  },
  progressIndicatorCompleted: {
    backgroundColor: '#10B981',
  },
  progressIndicatorCurrent: {
    backgroundColor: '#F97316',
  },
});