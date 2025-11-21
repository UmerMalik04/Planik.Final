import { useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { offlineStorage } from '@/services/OfflineStorage';
import { toast } from '@/hooks/use-toast';

export const useOfflineSync = () => {
  const isOnline = useOnlineStatus();
  const { workoutPlans, workoutSessions, personalRecords, initializeUserData } = useWorkoutStore();

  // Save to IndexedDB when data changes
  const saveToOfflineStorage = useCallback(async () => {
    try {
      await Promise.all([
        offlineStorage.saveWorkoutPlans(workoutPlans),
        offlineStorage.saveWorkoutSessions(workoutSessions),
        offlineStorage.savePersonalRecords(personalRecords),
      ]);
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, [workoutPlans, workoutSessions, personalRecords]);

  // Sync when coming back online
  const syncWithServer = useCallback(async () => {
    if (isOnline) {
      try {
        await initializeUserData();
        toast({
          title: "Synced",
          description: "Your workout data has been synced with the server.",
        });
      } catch (error) {
        console.error('Failed to sync with server:', error);
        toast({
          title: "Sync Failed",
          description: "Unable to sync with server. Using offline data.",
          variant: "destructive",
        });
      }
    }
  }, [isOnline, initializeUserData]);

  // Save to offline storage whenever data changes
  useEffect(() => {
    if (workoutPlans.length > 0 || workoutSessions.length > 0 || personalRecords.length > 0) {
      saveToOfflineStorage();
    }
  }, [saveToOfflineStorage]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncWithServer();
    }
  }, [isOnline, syncWithServer]);

  return {
    isOnline,
    saveToOfflineStorage,
    syncWithServer,
  };
};
