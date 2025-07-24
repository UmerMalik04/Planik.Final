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