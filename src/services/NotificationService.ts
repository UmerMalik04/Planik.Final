/**
 * NotificationService — workout/meal reminders across every platform.
 *
 * Three execution environments need different code:
 *  - NATIVE (iOS/Android via Capacitor): uses @capacitor/local-notifications,
 *    which delivers OS-level notifications even when the app is killed.
 *  - iOS PWA installed to Home Screen: limited support, falls back to the
 *    Notification API.
 *  - Desktop / Android web: uses the standard Notification + Service Worker
 *    APIs (sw-push.js) so reminders fire even when the tab is closed.
 *
 * The "web reminder checker" interval is the safety net for cases where
 * neither native nor service-worker scheduling is available — it polls the
 * stored reminder time and fires a notification once the moment arrives,
 * but only while the tab is open.
 */
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

// Extend Window interface for our custom properties
declare global {
  interface Window {
    // workoutReminderInterval is declared globally in src/vite-env.d.ts
    pushServiceWorker?: ServiceWorkerRegistration | null;
  }
}

// Detect if running as iOS PWA (added to home screen)
const isIOSPWA = (): boolean => {
  return (
    ('standalone' in window.navigator && (window.navigator as any).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
};

// Detect iOS Safari
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Detect if push notifications are supported
const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

export class NotificationService {
  private static swRegistration: ServiceWorkerRegistration | null = null;

  // Register the push service worker
  static async registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('[NotificationService] Service workers not supported');
      return null;
    }

    try {
      // Check if already registered
      if (this.swRegistration) {
        return this.swRegistration;
      }

      // Register our custom push service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/'
      });

      console.log('[NotificationService] Push service worker registered:', registration.scope);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      this.swRegistration = registration;
      window.pushServiceWorker = registration;
      
      return registration;
    } catch (error) {
      console.error('[NotificationService] Service worker registration failed:', error);
      return null;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    console.log('[NotificationService] Requesting permissions, platform:', Capacitor.getPlatform());
    
    if (!Capacitor.isNativePlatform()) {
      // For web/PWA
      if ('Notification' in window) {
        // Check current permission status first
        if (Notification.permission === 'granted') {
          console.log('[NotificationService] Web: Permission already granted');
          return true;
        }
        
        if (Notification.permission === 'denied') {
          console.log('[NotificationService] Web: Permission denied');
          return false;
        }
        
        // Request permission - this triggers the native browser/OS dialog
        const permission = await Notification.requestPermission();
        console.log('[NotificationService] Web: Permission result:', permission);
        return permission === 'granted';
      }
      return false;
    }

    // Native platform (iOS/Android via Capacitor)
    try {
      console.log('[NotificationService] Native: Checking current permissions...');
      const currentStatus = await LocalNotifications.checkPermissions();
      console.log('[NotificationService] Native: Current status:', currentStatus.display);
      
      if (currentStatus.display === 'granted') {
        console.log('[NotificationService] Native: Already granted');
        return true;
      }
      
      console.log('[NotificationService] Native: Requesting permissions...');
      const permStatus = await LocalNotifications.requestPermissions();
      console.log('[NotificationService] Native: Request result:', permStatus.display);
      
      return permStatus.display === 'granted';
    } catch (error) {
      console.error('[NotificationService] Error requesting notification permissions:', error);
      return false;
    }
  }

  static async enablePushNotifications(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // For web/PWA - use service worker based notifications
      if (!('Notification' in window)) {
        console.log('[NotificationService] Notifications not supported in this browser');
        return false;
      }
      
      console.log('[NotificationService] Current notification permission:', Notification.permission);
      
      // If permission is denied, cannot enable
      if (Notification.permission === 'denied') {
        console.log('[NotificationService] Notification permission is denied');
        return false;
      }
      
      // Request permission if needed
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          console.log('[NotificationService] Permission request result:', permission);
          
          if (permission !== 'granted') {
            return false;
          }
        } catch (error) {
          console.error('[NotificationService] Error requesting notification permission:', error);
          return false;
        }
      }
      
      // Register service worker for push notifications
      const registration = await this.registerPushServiceWorker();
      
      if (registration) {
        // Show a test notification via service worker
        try {
          await registration.showNotification('Notifications Enabled! 🎉', {
            body: "You'll now receive workout reminders",
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'test-notification',
            requireInteraction: false
          });
          console.log('[NotificationService] Test notification shown via service worker');
        } catch (swError) {
          console.log('[NotificationService] SW notification failed, using fallback:', swError);
          // Fallback to regular Notification API
          new Notification("Push notifications enabled!", {
            body: "You'll now receive workout reminders",
            icon: '/pwa-192x192.png'
          });
        }
      } else {
        // Fallback for browsers without service worker
        new Notification("Push notifications enabled!", {
          body: "You'll now receive workout reminders",
          icon: '/pwa-192x192.png'
        });
      }
      
      // Start the web-based reminder checker
      this.startReminderChecker();
      
      // Schedule initial daily reminder
      await this.scheduleWebDailyReminder();
      
      return true;
    }

    // Mobile platform handling (iOS/Android via Capacitor)
    try {
      console.log('[NotificationService] Native: Enabling push notifications...');
      
      const granted = await this.requestPermissions();
      console.log('[NotificationService] Native: Permission granted:', granted);
      
      if (!granted) {
        console.log('[NotificationService] Native: Permission not granted, cannot enable');
        return false;
      }
      
      // Register notification listeners
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('[NotificationService] Notification received:', notification);
      });
      
      await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('[NotificationService] Notification action performed:', action);
      });
      
      // Send immediate test notification
      console.log('[NotificationService] Native: Sending test notification...');
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Notifications Enabled! 🎉',
            body: 'You will now receive workout reminders',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#3b82f6',
          },
        ],
      });
      console.log('[NotificationService] Native: Test notification scheduled');
      
      // Schedule daily workout reminder at 7:00 PM
      await this.scheduleDailyWorkoutReminder();
      console.log('[NotificationService] Native: Daily reminder scheduled');
      
      return true;
    } catch (error) {
      console.error('[NotificationService] Error enabling push notifications:', error);
      return false;
    }
  }

  // Web-specific: Schedule daily reminder using localStorage and interval checker
  private static async scheduleWebDailyReminder(): Promise<void> {
    const reminderData = {
      time: '19:00', // 7:00 PM
      enabled: true,
      nextReminderDate: this.getNextReminderDate('19:00').toISOString()
    };
    localStorage.setItem('daily-workout-reminder', JSON.stringify(reminderData));
    console.log('[NotificationService] Web daily reminder scheduled for:', reminderData.nextReminderDate);
  }

  private static getNextReminderDate(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= new Date()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    return reminderTime;
  }

  static async disablePushNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Web: Cancel reminders and clear intervals
      localStorage.removeItem('custom-workout-reminder');
      localStorage.removeItem('daily-workout-reminder');
      if (window.workoutReminderInterval) {
        clearInterval(window.workoutReminderInterval);
        window.workoutReminderInterval = null;
      }
      console.log('[NotificationService] Notifications turned off');
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
        console.error('[NotificationService] Error canceling notifications:', error);
      }
    }
  }

  static async scheduleDailyWorkoutReminder(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[NotificationService] Web: Scheduling daily reminder via interval checker');
      await this.scheduleWebDailyReminder();
      this.startReminderChecker();
      return true;
    }
    
    try {
      console.log('[NotificationService] Scheduling daily workout reminder...');
      
      // Cancel any existing daily reminder first
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
      } catch (e) {
        console.log('[NotificationService] No existing reminder to cancel');
      }
      
      // Schedule daily notification at 7:00 PM
      const reminderTime = this.getNextReminderDate('19:00');
      
      console.log('[NotificationService] Reminder scheduled for:', reminderTime.toLocaleString());

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Time to workout! 💪',
            body: 'Your daily workout reminder - tap to start your session!',
            id: 1001,
            schedule: {
              at: reminderTime,
              repeats: true,
              every: 'day',
              allowWhileIdle: true,
            },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#3b82f6',
          },
        ],
      });

      const pending = await LocalNotifications.getPending();
      console.log('[NotificationService] Pending notifications:', pending.notifications.length);
      
      return true;
    } catch (error) {
      console.error('[NotificationService] Error scheduling daily workout reminder:', error);
      return false;
    }
  }

  static async sendTestNotification(): Promise<boolean> {
    console.log('[NotificationService] Sending test notification...');
    
    if (!Capacitor.isNativePlatform()) {
      if ('Notification' in window && Notification.permission === 'granted') {
        // Try service worker first
        const registration = this.swRegistration || await this.registerPushServiceWorker();
        
        if (registration) {
          try {
            await registration.showNotification('Test Notification 🔔', {
              body: 'This is a test notification from Planik!',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: 'test'
            });
            return true;
          } catch (e) {
            console.log('[NotificationService] SW notification failed, using fallback');
          }
        }
        
        // Fallback
        new Notification('Test Notification 🔔', {
          body: 'This is a test notification from Planik!',
          icon: '/pwa-192x192.png'
        });
        return true;
      }
      return false;
    }
    
    try {
      const granted = await this.requestPermissions();
      if (!granted) {
        console.log('[NotificationService] Cannot send test - no permission');
        return false;
      }
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Test Notification 🔔',
            body: 'This is a test notification from Planik!',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#3b82f6',
          },
        ],
      });
      
      console.log('[NotificationService] Test notification scheduled');
      return true;
    } catch (error) {
      console.error('[NotificationService] Error sending test notification:', error);
      return false;
    }
  }

  static async scheduleNotification(options: NotificationOptions): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web, use service worker or browser notifications
        if ('Notification' in window && Notification.permission === 'granted') {
          const registration = this.swRegistration || await this.registerPushServiceWorker();
          
          if (registration && options.schedule) {
            // Schedule via service worker message
            const sw = registration.active;
            if (sw) {
              sw.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                notification: {
                  title: options.title,
                  body: options.body,
                  scheduledTime: options.schedule.at.getTime(),
                  tag: `scheduled-${options.id || Date.now()}`
                }
              });
              return true;
            }
          }
          
          // Immediate notification fallback
          if (registration) {
            await registration.showNotification(options.title, {
              body: options.body,
              icon: '/pwa-192x192.png'
            });
          } else {
            new Notification(options.title, {
              body: options.body,
              icon: '/pwa-192x192.png'
            });
          }
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
      console.error('[NotificationService] Error scheduling notification:', error);
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
    const reminderTime = this.getNextReminderDate(time);

    if (!Capacitor.isNativePlatform()) {
      // For web, store in localStorage and use interval checker
      const reminderData = {
        time: time,
        enabled: true,
        nextReminderDate: reminderTime.toISOString()
      };
      localStorage.setItem('custom-workout-reminder', JSON.stringify(reminderData));
      
      this.startReminderChecker();
      
      console.log(`[NotificationService] Custom reminder scheduled for ${reminderTime.toLocaleString()}`);
      return true;
    }

    // For mobile platforms, use LocalNotifications
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1002 }] });
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Workout Time! 💪',
            body: 'Your scheduled workout reminder',
            id: 1002,
            schedule: {
              at: reminderTime,
              repeats: true,
              every: 'day',
              allowWhileIdle: true
            },
            sound: 'default',
          },
        ],
      });
      
      console.log(`[NotificationService] Custom reminder scheduled for ${reminderTime.toLocaleString()}`);
      return true;
    } catch (error) {
      console.error('[NotificationService] Error scheduling custom workout reminder:', error);
      return false;
    }
  }

  static startReminderChecker(): void {
    // Clear any existing interval
    if (window.workoutReminderInterval) {
      clearInterval(window.workoutReminderInterval);
    }

    // Check every minute for pending reminders
    window.workoutReminderInterval = setInterval(() => {
      this.checkPendingReminders();
    }, 60000);
    
    // Also check immediately
    this.checkPendingReminders();
    
    console.log('[NotificationService] Reminder checker started');
  }

  static async checkPendingReminders(): Promise<void> {
    if (Capacitor.isNativePlatform()) return;

    const now = new Date();
    
    // Check custom reminder
    await this.checkAndFireReminder('custom-workout-reminder', 'Workout Time! 💪', 'Your scheduled workout reminder');
    
    // Check daily reminder
    await this.checkAndFireReminder('daily-workout-reminder', 'Time to workout! 💪', 'Your daily workout reminder - tap to start your session!');
  }

  private static async checkAndFireReminder(storageKey: string, title: string, body: string): Promise<void> {
    const reminderData = localStorage.getItem(storageKey);
    if (!reminderData) return;

    try {
      const reminder = JSON.parse(reminderData);
      if (!reminder.enabled) return;

      const now = new Date();
      const reminderTime = new Date(reminder.nextReminderDate);
      
      // Check if it's time for the reminder (within 1 minute window)
      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
      if (timeDiff <= 60000 && now >= reminderTime) {
        // Show notification
        if (Notification.permission === 'granted') {
          const registration = this.swRegistration || await this.registerPushServiceWorker();
          
          if (registration) {
            try {
              await registration.showNotification(title, {
                body: body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: storageKey,
                requireInteraction: true
              });
            } catch (e) {
              new Notification(title, { body, icon: '/pwa-192x192.png' });
            }
          } else {
            new Notification(title, { body, icon: '/pwa-192x192.png' });
          }
        }
        
        // Schedule next reminder for tomorrow
        const nextReminder = new Date(reminderTime);
        nextReminder.setDate(nextReminder.getDate() + 1);
        reminder.nextReminderDate = nextReminder.toISOString();
        localStorage.setItem(storageKey, JSON.stringify(reminder));
        
        console.log(`[NotificationService] ${storageKey} sent! Next: ${nextReminder.toLocaleString()}`);
      }
    } catch (error) {
      console.error('[NotificationService] Error checking pending reminders:', error);
    }
  }

  static cancelCustomWorkoutReminder(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      localStorage.removeItem('custom-workout-reminder');
      return Promise.resolve(true);
    }

    return LocalNotifications.cancel({ notifications: [{ id: 1002 }] })
      .then(() => true)
      .catch((error) => {
        console.error('[NotificationService] Error canceling custom workout reminder:', error);
        return false;
      });
  }

  static async getNotificationPermissionStatus(): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      // iOS Safari (not PWA) doesn't support notifications at all
      if (isIOS() && !isIOSPWA()) {
        return 'ios-safari';
      }
      if ('Notification' in window) {
        return Notification.permission;
      }
      return 'unsupported';
    }
    
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      return permStatus.display;
    } catch (error) {
      console.error('[NotificationService] Error checking notification permissions:', error);
      return 'denied';
    }
  }

  // Get info about the current platform capabilities
  static getCapabilities(): {
    platform: string;
    isIOS: boolean;
    isIOSPWA: boolean;
    isPushSupported: boolean;
    isNative: boolean;
  } {
    return {
      platform: Capacitor.getPlatform(),
      isIOS: isIOS(),
      isIOSPWA: isIOSPWA(),
      isPushSupported: isPushSupported(),
      isNative: Capacitor.isNativePlatform()
    };
  }
}
