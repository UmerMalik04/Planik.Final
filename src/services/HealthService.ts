/**
 * HealthService — bridges the JS app to native step data on iOS and Android.
 *
 * Two native sources are supported, both reached through the same custom
 * Capacitor plugin (`StepCounter`):
 *   - iOS:     Apple HealthKit (`HKQuantityTypeIdentifierStepCount`)
 *   - Android: Google Health Connect
 *
 * On the web we just read whatever was previously synced into Supabase
 * (`daily_steps` table) — there's no browser API that exposes lifetime step
 * counts, so the web build is read-only.
 *
 * Date handling: HealthKit/Health Connect bucket samples by *local* day. If
 * we use `toISOString()` (UTC) to key rows we can drift by a day either side
 * of midnight, which makes "today's steps" look wrong. `formatLocalDate()`
 * below intentionally uses local `getFullYear/getMonth/getDate` to keep
 * everything in the user's wall-clock day.
 *
 * Privacy: step data sits in Supabase under RLS policies that restrict every
 * row to `auth.uid()` — no other user can read or write your steps.
 */
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { readSnapshot, writeSnapshot, setWarmed, warmData, invalidateWarmed } from '@/lib/dataPrefetch';


export interface HealthData {
  steps: number;
  calories?: number;
  distance?: number;
  heartRate?: number;
}

export interface PermissionStatus {
  granted: boolean;
  reason?: string;
}

import StepCounter from '@/plugins/StepCounter';

/**
 * Format a Date as "YYYY-MM-DD" in the user's local timezone.
 * Avoids the UTC drift that `Date#toISOString()` introduces near midnight.
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// True when the page is being rendered inside the iOS React Native wrapper
// (we ship one for App Store distribution that hosts the web app and exposes
// extra native APIs via window.ReactNativeWebView.postMessage).
const isReactNativeWebView = (): boolean => {
  return !!(window as any).ReactNativeWebView;
};

// Lightweight UA sniff — used only as a heuristic to decide whether the
// React Native bridge is likely backed by iOS (and therefore HealthKit).
const isIOSPlatform = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

export class HealthService {
  /**
   * Treat as "native" both Capacitor (App Store / Play Store builds) AND the
   * iOS React Native WebView wrapper — both have a real HealthKit bridge.
   */
  private static isNative(): boolean {
    return Capacitor.isNativePlatform() || (isReactNativeWebView() && isIOSPlatform());
  }

  static isReactNativeEnvironment(): boolean {
    return isReactNativeWebView();
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      if (!this.isNative()) {
        console.log('HealthService: Not on native platform, skipping HealthKit');
        return false;
      }

      console.log('HealthService: Requesting HealthKit permissions...');
      
      try {
        const result = await StepCounter.requestPermissions();
        console.log('HealthService: Permission result:', JSON.stringify(result));
        return result.granted;
      } catch (pluginError) {
        console.error('HealthService: Plugin call failed:', pluginError);
        return false;
      }
    } catch (error) {
      console.error('HealthService: Error requesting health permissions:', error);
      return false;
    }
  }

  static async getStepsToday(): Promise<number> {
    try {
      if (!this.isNative()) {
        const today = formatLocalDate(new Date());
        return await this.getStepsFromDatabase(today);
      }

      try {
        const result = await StepCounter.getStepsToday();
        const today = formatLocalDate(new Date());
        if (result.steps > 0) {
          await this.saveStepsToDatabase(today, result.steps);
        }
        return result.steps;
      } catch (pluginError) {
        console.error('HealthService: Plugin getStepsToday failed:', pluginError);
        const today = formatLocalDate(new Date());
        return await this.getStepsFromDatabase(today);
      }
    } catch (error) {
      console.error('HealthService: Error getting steps today:', error);
      const today = formatLocalDate(new Date());
      return await this.getStepsFromDatabase(today);
    }
  }

  static async getStepsForDateRange(startDate: Date, endDate: Date): Promise<number> {
    try {
      const date = formatLocalDate(startDate);
      
      if (!this.isNative()) {
        return await this.getStepsFromDatabase(date);
      }

      const result = await StepCounter.getStepsForDateRange({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      if (result.steps > 0) {
        await this.saveStepsToDatabase(date, result.steps);
      }
      
      return result.steps;
    } catch (error) {
      console.error('Error getting steps for date range:', error);
      if (startDate.toDateString() === endDate.toDateString()) {
        const date = formatLocalDate(startDate);
        return await this.getStepsFromDatabase(date);
      }
      return 0;
    }
  }

  /** Cache key for a month's step map (device-local snapshot + warm cache). */
  static monthCacheKey(year: number, month: number): string {
    return `steps:${year}-${String(month + 1).padStart(2, '0')}`;
  }

  /**
   * Synchronously read the last-known step map for a month from the device
   * snapshot. Lets the calendar paint real numbers on its very first frame.
   */
  static getMonthlyStepsSnapshot(year: number, month: number): Map<string, number> | null {
    const snap = readSnapshot<Record<string, number>>(this.monthCacheKey(year, month));
    return snap ? new Map(Object.entries(snap)) : null;
  }

  /** Fetch (or reuse a warmed fetch of) a month's steps from Supabase. */
  static getMonthlySteps(year: number, month: number): Promise<Map<string, number>> {
    return warmData(this.monthCacheKey(year, month), () =>
      this.getMonthlyStepsFromDatabase(year, month)
    );
  }

  /** Warm the current month during idle time so /step-history opens instantly. */
  static prefetchCurrentMonth(): Promise<Map<string, number>> {
    const now = new Date();
    return this.getMonthlySteps(now.getFullYear(), now.getMonth());
  }

  static async getMonthlyStepsFromDatabase(year: number, month: number): Promise<Map<string, number>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Map();

      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('daily_steps')
        .select('date, steps')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        console.error('Error fetching monthly steps:', error);
        return new Map();
      }

      const stepsMap = new Map<string, number>();
      data?.forEach(record => {
        stepsMap.set(record.date, record.steps);
      });

      // Persist for instant paint next launch (device-local only).
      writeSnapshot(this.monthCacheKey(year, month), Object.fromEntries(stepsMap));

      return stepsMap;
    } catch (error) {
      console.error('Error fetching monthly steps from database:', error);
      return new Map();
    }
  }


  // Full refresh: DB + native sync + merge. Returns merged map.
  static async refreshMonth(year: number, month: number): Promise<{ stepsMap: Map<string, number>; syncedFromNative: boolean }> {
    // 1. Load from DB first — this is the source of truth we must never destroy.
    const dbSteps = await this.getMonthlyStepsFromDatabase(year, month);

    // 2. Try native sync
    let syncedFromNative = false;
    if (this.isNative()) {
      try {
        // Privacy/data-safety guard: if Health access isn't granted, HealthKit
        // happily returns 0 for every day. Writing that back would wipe real
        // history, so we skip the sync entirely unless permission is granted.
        const granted = await this.requestPermissions();
        if (granted) {
          const nativeSteps = await this.syncMonthFromHealthKit(year, month, dbSteps);
          if (nativeSteps.size > 0) {
            syncedFromNative = true;
            // Merge: native data wins, but a native 0 never overwrites a
            // previously recorded non-zero day (missing data != zero steps).
            nativeSteps.forEach((steps, date) => {
              if (steps > 0 || !(dbSteps.get(date) ?? 0)) dbSteps.set(date, steps);
            });
          }
        }
      } catch (error) {
        console.error('HealthService: Native sync failed, using DB data:', error);
      }
    }
    
    // Keep the warm cache + device snapshot in step with what we just merged,
    // so returning to this month later paints instantly.
    setWarmed(this.monthCacheKey(year, month), dbSteps);
    writeSnapshot(this.monthCacheKey(year, month), Object.fromEntries(dbSteps));

    return { stepsMap: dbSteps, syncedFromNative };

  }


  /**
   * Pull a whole month of daily step totals from the native health store.
   *
   * Fast path: `getStepsForMonth` — one bridge call backed by a single
   * `HKStatisticsCollectionQuery` (iOS) / aggregate-by-day request (Android).
   * Fallback: the original per-day `getStepsForDateRange` loop, so older
   * installed binaries that don't expose the bulk method still work.
   *
   * Zero-step days are kept (not skipped) so the calendar can legitimately
   * show "0" for a day you didn't move, instead of leaving the cell blank.
   */
  static async syncMonthFromHealthKit(
    year: number,
    month: number,
    existing?: Map<string, number>
  ): Promise<Map<string, number>> {
    if (!this.isNative()) {
      return new Map();
    }

    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      const today = new Date();
      const actualEndDate = endOfMonth > today ? today : endOfMonth;

      const days: Date[] = [];
      for (let d = new Date(startOfMonth); d <= actualEndDate; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }

      const stepsMap =
        (await this.fetchMonthInOneCall(year, month, days)) ??
        (await this.fetchMonthDayByDay(days));

      // An all-zero month means "no Health data / no access", not "you never
      // moved". Never persist that — it would erase real recorded history.
      const hasAnySteps = Array.from(stepsMap.values()).some((s) => s > 0);
      if (!hasAnySteps) {
        console.warn('HealthService: month returned no step data; skipping write');
        return new Map();
      }

      // Only write days that add information: a native 0 is never allowed to
      // overwrite a stored non-zero count.
      const writable = new Map<string, number>();
      stepsMap.forEach((steps, date) => {
        if (steps > 0 || !(existing?.get(date) ?? 0)) writable.set(date, steps);
      });

      // One round trip to Supabase for the whole month instead of ~30.
      await this.saveManyStepsToDatabase(writable);

      console.log(`HealthService: Synced ${writable.size} days from HealthKit for ${year}-${month + 1}`);
      return stepsMap;

    } catch (error) {
      console.error('Error syncing month from HealthKit:', error);
      return new Map();
    }
  }

  /** Bulk month query; returns null when the installed binary lacks the method. */
  private static async fetchMonthInOneCall(
    year: number,
    month: number,
    days: Date[]
  ): Promise<Map<string, number> | null> {
    const bulk = (StepCounter as unknown as {
      getStepsForMonth?: (options: { year: number; month: number }) =>
        Promise<{ days: { date: string; steps: number }[] }>;
    }).getStepsForMonth;

    if (typeof bulk !== 'function') return null;

    try {
      // `month` is 0-indexed in JS; the native side expects 1-12.
      const result = await bulk.call(StepCounter, { year, month: month + 1 });
      if (!result?.days) return null;

      const wanted = new Set(days.map(formatLocalDate));
      const stepsMap = new Map<string, number>();
      result.days.forEach(({ date, steps }) => {
        if (wanted.has(date)) stepsMap.set(date, Math.max(0, Math.round(steps ?? 0)));
      });
      // Fill any day the native side omitted so 0-step days are explicit.
      wanted.forEach((date) => {
        if (!stepsMap.has(date)) stepsMap.set(date, 0);
      });
      return stepsMap;
    } catch (error) {
      console.warn('HealthService: bulk month query unavailable, falling back:', error);
      return null;
    }
  }

  /** Legacy per-day path, batched so we don't flood the native bridge. */
  private static async fetchMonthDayByDay(days: Date[]): Promise<Map<string, number>> {
    const stepsMap = new Map<string, number>();
    const BATCH_SIZE = 8;

    for (let i = 0; i < days.length; i += BATCH_SIZE) {
      const batch = days.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (currentDate) => {
        const dateStr = formatLocalDate(currentDate);
        try {
          const startOfDay = new Date(currentDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(currentDate);
          endOfDay.setHours(23, 59, 59, 999);

          const result = await StepCounter.getStepsForDateRange({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
          });

          stepsMap.set(dateStr, Math.max(0, Math.round(result.steps ?? 0)));
        } catch (error) {
          console.error(`Error getting steps for ${dateStr}:`, error);
        }
      }));
    }

    return stepsMap;
  }

  /** Upsert a whole month of step rows in one request (RLS-scoped to the user). */
  static async saveManyStepsToDatabase(stepsMap: Map<string, number>): Promise<void> {
    if (stepsMap.size === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedAt = new Date().toISOString();
      const rows = Array.from(stepsMap.entries()).map(([date, steps]) => ({
        user_id: user.id,
        date,
        steps,
        updated_at: updatedAt,
      }));

      const { error } = await supabase
        .from('daily_steps')
        .upsert(rows, { onConflict: 'user_id,date' });

      if (error) console.error('Error saving monthly steps:', error);
      else rows.forEach((row) => this.invalidateMonthCache(row.date));
    } catch (error) {
      console.error('Error saving monthly steps to database:', error);
    }
  }


  static async quickSyncToday(): Promise<number> {
    if (!this.isNative()) return 0;
    
    try {
      const result = await StepCounter.getStepsToday();
      const steps = result.steps;
      
      if (steps > 0) {
        const today = formatLocalDate(new Date());
        await this.saveStepsToDatabase(today, steps);
      }
      
      return steps;
    } catch (error) {
      console.error('Error in quickSyncToday:', error);
      return 0;
    }
  }

  static async syncTodaySteps(): Promise<void> {
    try {
      if (!this.isNative()) return;
      
      const steps = await this.getStepsToday();
      if (steps > 0) {
        const today = formatLocalDate(new Date());
        await this.saveStepsToDatabase(today, steps);
      }
    } catch (error) {
      console.error('Error syncing today steps:', error);
    }
  }

  static async saveStepsToDatabase(date: string, steps: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('daily_steps')
        .upsert({
          user_id: user.id,
          date,
          steps,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });

      if (error) console.error('Error saving steps:', error);
      else this.invalidateMonthCache(date);
    } catch (error) {
      console.error('Error saving steps to database:', error);
    }
  }

  /** Drop the warm cache for the month a date belongs to (after a write). */
  private static invalidateMonthCache(date: string): void {
    const [year, month] = date.split('-').map(Number);
    if (!year || !month) return;
    invalidateWarmed(this.monthCacheKey(year, month - 1));
  }

  static async getStepsFromDatabase(date: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('daily_steps')
        .select('steps')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();

      if (error) {
        console.error('Error fetching steps:', error);
        return 0;
      }

      return data?.steps || 0;
    } catch (error) {
      console.error('Error fetching steps from database:', error);
      return 0;
    }
  }

  /** Last 7 days of steps, fetched in parallel (was 7 sequential round trips). */
  static async getWeeklySteps(): Promise<{ date: string; steps: number }[]> {
    const today = new Date();

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - index));
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      return { startOfDay, endOfDay };
    });

    return Promise.all(
      days.map(async ({ startOfDay, endOfDay }) => ({
        date: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
        steps: await this.getStepsForDateRange(startOfDay, endOfDay),
      }))
    );
  }


  static async getStepStats(): Promise<{
    longestStreak: number;
    bestMonth: { month: string; steps: number };
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { longestStreak: 0, bestMonth: { month: '', steps: 0 } };

      const { data: allSteps } = await supabase
        .from('daily_steps')
        .select('date, steps')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!allSteps || allSteps.length === 0) {
        return { longestStreak: 0, bestMonth: { month: '', steps: 0 } };
      }

      // Calculate longest streak - parse dates without timezone shift
      let longestStreak = 0;
      let currentStreak = 0;
      let previousDate: Date | null = null;

      for (const record of allSteps) {
        const parts = record.date.split('-');
        const recordDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        
        if (record.steps > 0) {
          if (previousDate) {
            const dayDiff = Math.round((recordDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff === 1) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }
          } else {
            currentStreak = 1;
          }
          
          longestStreak = Math.max(longestStreak, currentStreak);
          previousDate = recordDate;
        } else {
          currentStreak = 0;
          previousDate = null;
        }
      }

      // Calculate best month
      const monthlyTotals: { [key: string]: number } = {};
      
      for (const record of allSteps) {
        const monthKey = record.date.substring(0, 7);
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + record.steps;
      }

      let bestMonth = { month: '', steps: 0 };
      for (const [month, steps] of Object.entries(monthlyTotals)) {
        if (steps > bestMonth.steps) {
          const [year, monthNum] = month.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit' 
          });
          bestMonth = { month: monthName, steps };
        }
      }

      return { longestStreak, bestMonth };
    } catch (error) {
      console.error('Error calculating step stats:', error);
      return { longestStreak: 0, bestMonth: { month: '', steps: 0 } };
    }
  }
}
