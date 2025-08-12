import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: false, 
    shouldShowList: false
  }),
});

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web notifications
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }
      
      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  async sendMilestoneReachedNotification(milestoneName: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Milestone Reached!', {
            body: `You've reached ${milestoneName}! Enjoy exploring.`,
            icon: '/assets/images/icon.png',
          });
        }
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Milestone Reached! 🎉',
          body: `You've reached ${milestoneName}! Enjoy exploring.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send milestone notification:', error);
    }
  }

  async sendNextDestinationNotification(milestoneName: string, distance: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Next Destination', {
            body: `Next stop: ${milestoneName} - ${distance} ahead`,
            icon: '/assets/images/icon.png',
          });
        }
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Next Destination 🧭',
          body: `Next stop: ${milestoneName} - ${distance} ahead`,
          sound: false,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send destination notification:', error);
    }
  }

  async sendRouteCompletionNotification(totalMilestones: number): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Adventure Complete!', {
            body: `Congratulations! You've completed all ${totalMilestones} milestones.`,
            icon: '/assets/images/icon.png',
          });
        }
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Adventure Complete! 🏆',
          body: `Congratulations! You've completed all ${totalMilestones} milestones.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send completion notification:', error);
    }
  }
}