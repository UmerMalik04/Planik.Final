/**
 * useOfflineSync — keeps IndexedDB in step with the Zustand workout stores
 * and forces a server pull the instant the device reconnects.
 *
 * How it works:
 *   1. Whenever workoutPlans / workoutSessions / personalRecords change in
 *      memory, mirror the latest snapshot into IndexedDB (so the app can
 *      keep working with no network).
 *   2. Track the previous online status. The moment we go offline → online
 *      again, call `initializeUserData(true)` to re-pull from Supabase in
 *      case the user made changes on another device while we were offline.
 *
 * Why a `useRef` for the syncing flag? Refs survive re-renders but don't
 * trigger them — perfect for "is a sync in flight right now?" guards where
 * we don't want a render loop.
 */
import { useEffect, useCallback, useRef, useState } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { offlineStorage } from '@/services/OfflineStorage';
import { syncQueue } from '@/services/SyncQueue';
import { toast } from '@/hooks/use-toast';

export const useOfflineSync = () => {
  const isOnline = useOnlineStatus();
  const { workoutPlans, workoutSessions, personalRecords, initializeUserData } = useWorkoutStore();
  // Prevent overlapping syncs (e.g. flaky network toggling on/off rapidly).
  const isSyncing = useRef(false);
  // Tracks "was the previous render offline?" so we can detect the rising
  // edge of reconnection rather than firing on every render.
  const wasOffline = useRef(false);
  // Number of writes still sitting in the IndexedDB outbox.
  const [pendingWrites, setPendingWrites] = useState(0);

  /** Mirror the current in-memory store snapshot into IndexedDB. */
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

  /**
   * Push then pull. Order matters: local writes must be replayed *before* we
   * re-read from Supabase, otherwise the fresh server snapshot would clobber
   * the optimistic rows that haven't been uploaded yet.
   */
  const syncWithServer = useCallback(async () => {
    if (!isOnline || isSyncing.current) return;
    isSyncing.current = true;
    try {
      const { failed } = await syncQueue.replay();
      if (failed > 0) {
        toast({
          title: 'Some changes could not be saved',
          description: "They're stored on this device and will retry.",
          variant: 'destructive',
        });
      }
      await initializeUserData(true); // `true` = force fresh fetch
    } catch (error) {
      console.error('Failed to sync with server:', error);
      toast({
        title: "Sync Failed",
        description: "Using offline data.",
        variant: "destructive",
      });
    } finally {
      isSyncing.current = false;
    }
  }, [isOnline, initializeUserData]);

  // Whenever the store changes (and isn't empty), persist to IndexedDB.
  useEffect(() => {
    if (workoutPlans.length > 0 || workoutSessions.length > 0 || personalRecords.length > 0) {
      saveToOfflineStorage();
    }
  }, [saveToOfflineStorage]);

  // Subscribe to the outbox depth, and drain anything left over from a
  // previous session (app killed while offline) on start-up.
  useEffect(() => {
    const unsubscribe = syncQueue.subscribe(setPendingWrites);
    syncQueue.refreshPending().then(() => {
      if (navigator.onLine) syncQueue.replay();
    });
    return unsubscribe;
  }, []);

  // Detect the offline → online rising edge and trigger a push + pull.
  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      syncWithServer();
    }
  }, [isOnline, syncWithServer]);

  return {
    isOnline,
    pendingWrites,
    saveToOfflineStorage,
    syncWithServer,
  };
};

