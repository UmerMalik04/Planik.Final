import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationOptions {
  title: string;
  body: string;
  id?: number;
  schedule?: {
    at: Date;
  };
  sound?: boolean;
  attachments?: any[];
  actionTypeId?: string;
  extra?: any;
}

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // For web, check if notifications are supported
      if ('Notification' in window) {
        // Check current permission status first
        if (Notification.permission === 'granted') {
          return true;
        }
        
        if (Notification.permission === 'denied') {
          return false;
        }
        
        // Request permission
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    try {
      const permStatus = await LocalNotifications.requestPermissions();
      return permStatus.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async enablePushNotifications(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // For web, check if notifications are supported first
      if (!('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        return false;
      }
      
      console.log('Current notification permission:', Notification.permission);
      
      // If permission is already denied, don't try to request again
      if (Notification.permission === 'denied') {
        console.log('Notification permission is denied');
        return false;
      }
      
      // If permission is already granted, show test notification
      if (Notification.permission === 'granted') {
        try {
          new Notification("Push notifications enabled!", {
            body: "You'll now receive workout reminders",
            icon: '/favicon.ico'
          });
          return true;
        } catch (error) {
          console.error('Error showing notification:', error);
          return false;
        }
      }
      
      // Request permission if not set
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          console.log('Permission request result:', permission);
          
          if (permission === 'granted') {
            new Notification("Push notifications enabled!", {
              body: "You'll now receive workout reminders",
              icon: '/favicon.ico'
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return false;
        }
      }
      
      return false;
    }

    // Mobile platform handling
    try {
      const permStatus = await LocalNotifications.requestPermissions();
      if (permStatus.display !== 'granted') {
        return false;
      }
      
      // Schedule daily workout reminder at 7:00 PM
      await this.scheduleDailyWorkoutReminder();
      return true;
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      return false;
    }
  }

  static async disablePushNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Web: Just log or show message
      console.log("Notifications turned off");
    } else {
      // Mobile: Cancel all scheduled notifications
      try {
        await LocalNotifications.cancel({ notifications: [] });
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          const ids = pending.notifications.map(n => ({ id: n.id }));
          await LocalNotifications.cancel({ notifications: ids });
        }
      } catch (error) {
        console.error('Error canceling notifications:', error);
      }
    }
  }

  static async scheduleDailyWorkoutReminder(): Promise<boolean> {
    try {
      // Schedule daily notification at 7:00 PM
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(19, 0, 0, 0); // 7:00 PM
      
      // If 7 PM has passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Time to workout! 💪',
            body: 'Your daily workout reminder',
            id: 1001, // Fixed ID for daily reminder
            schedule: {
              at: reminderTime,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
          },
        ],
      });

      return true;
    } catch (error) {
      console.error('Error scheduling daily workout reminder:', error);
      return false;
    }
  }

  static async scheduleNotification(options: NotificationOptions): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web, use browser notifications
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(options.title, {
            body: options.body,
            icon: '/favicon.ico'
          });
          return true;
        }
        return false;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: options.title,
            body: options.body,
            id: options.id || Date.now(),
            schedule: options.schedule,
            sound: options.sound ? 'default' : undefined,
            attachments: options.attachments,
            actionTypeId: options.actionTypeId,
            extra: options.extra,
          },
        ],
      });

      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }

  static async scheduleWorkoutReminder(time: Date): Promise<boolean> {
    return await this.scheduleNotification({
      title: 'Workout Reminder 💪',
      body: "Time for your workout! Don't skip it!",
      schedule: { at: time },
      sound: true,
    });
  }

  static async scheduleMealReminder(mealType: string, time: Date): Promise<boolean> {
    return await this.scheduleNotification({
      title: `${mealType} Time 🍽️`,
      body: `Don't forget to log your ${mealType.toLowerCase()}!`,
      schedule: { at: time },
      sound: true,
    });
  }

  static async sendWorkoutCompleteNotification(): Promise<boolean> {
    return await this.scheduleNotification({
      title: 'Great Job! 🎉',
      body: 'Workout completed! Keep up the great work!',
      sound: true,
    });
  }

  static async sendAchievementNotification(achievement: string): Promise<boolean> {
    return await this.scheduleNotification({
      title: 'Achievement Unlocked! 🏆',
      body: `Congratulations! You've earned: ${achievement}`,
      sound: true,
    });
  }

  static async scheduleCustomWorkoutReminder(time: string): Promise<boolean> {
    const [hours, minutes] = time.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= new Date()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    return await this.scheduleNotification({
      title: 'Workout Time! 💪',
      body: 'Your scheduled workout reminder',
      schedule: { at: reminderTime },
      sound: true,
      id: 1002, // Different ID from daily reminder
    });
  }

  static async getNotificationPermissionStatus(): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      if ('Notification' in window) {
        return Notification.permission;
      }
      return 'default';
    }
    
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      return permStatus.display;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return 'denied';
    }
  }
}