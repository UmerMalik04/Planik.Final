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
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      if (!Capacitor.isNativePlatform() && 'Notification' in window) {
        alert("Notifications are blocked. Please allow them in your browser settings.");
      }
      return false;
    }

    if (!Capacitor.isNativePlatform()) {
      // Web: Show test notification
      new Notification("Push notifications enabled!", {
        body: "You'll now receive workout reminders",
        icon: '/favicon.ico'
      });
    } else {
      // Mobile: Schedule daily workout reminder at 7:00 PM
      await this.scheduleDailyWorkoutReminder();
    }

    return true;
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
}