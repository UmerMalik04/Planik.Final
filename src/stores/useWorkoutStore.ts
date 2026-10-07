import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { offlineStorage } from "@/services/OfflineStorage";
import { syncQueue, newId } from "@/services/SyncQueue";

export interface Exercise {
  id: string;
  name: string;
  weight?: number;
  reps: number;
  sets: number;
  notes?: string;
  date?: string;
  planId: string;
  hasWarmup?: boolean;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  date: string;
  exercises: CompletedExercise[];
  notes?: string;
  duration?: number;
  totalVolume?: number;
}

export interface SetData {
  weight: number;
  reps: number;
  dropSetWeight?: number;
  dropSetReps?: number;
  type: 'normal' | 'dropset';
}

export interface CompletedExercise {
  id: string;
  name: string;
  weight: number;
  reps: number;
  sets: number;
  date: string;
  previousWeight?: number;
  previousReps?: number;
  setData?: SetData[];
  previousSetData?: SetData[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  type: string;
  description?: string;
  exercises: Exercise[];
  restTimer?: number;
}

export interface WorkoutType {
  name: string;
  color: string;
}

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

interface WorkoutStore {
  workoutPlans: WorkoutPlan[];
  exercises: Exercise[];
  workoutSessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  currentStreak: number;
  lastWorkoutDate: string | null;
  workoutTypes: WorkoutType[];
  progressKg: number;
  lastWeekProgress: number;
  currentWorkoutSession: WorkoutSession | null;
  
  // Actions
  initializeUserData: (forceSync?: boolean) => Promise<void>;
  addWorkoutPlan: (plan: Omit<WorkoutPlan, "id">) => Promise<void>;
  updateWorkoutPlan: (id: string, plan: Partial<WorkoutPlan>) => Promise<void>;
  deleteWorkoutPlan: (id: string) => Promise<void>;
  addExercise: (planId: string, exercise: Omit<Exercise, "id" | "planId">) => Promise<void>;
  updateExercise: (exerciseId: string, exercise: Partial<Exercise>) => Promise<void>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  startWorkout: (planId: string) => Promise<WorkoutSession>;
  completeWorkout: (sessionId: string, exercises: CompletedExercise[]) => Promise<void>;
  pauseWorkout: () => void;
  resumeWorkout: () => WorkoutSession | null;
  addExerciseToCurrentWorkout: (exercise: Omit<Exercise, "id" | "planId">) => Promise<void>;
  updatePersonalRecord: (exerciseName: string, weight: number, reps: number) => Promise<void>;
  deletePersonalRecord: (exerciseName: string, reps: number) => Promise<void>;
  getPersonalRecord: (exerciseName: string) => PersonalRecord | undefined;
  getExerciseHistory: (exerciseName: string) => CompletedExercise[];
  getWorkoutFrequency: (workoutType: string) => number;
  getWorkoutProgress: (workoutType: string) => 'increase' | 'decrease' | 'same' | 'none';
  updateStreak: () => Promise<void>;
  addWorkoutType: (type: WorkoutType) => Promise<void>;
  deleteWorkoutType: (name: string) => Promise<void>;
  calculateProgress: () => void;
}

export const useWorkoutStore = create<WorkoutStore>()((set, get) => ({
  workoutPlans: [],
  exercises: [],
  workoutSessions: [],
  personalRecords: [],
  currentStreak: 0,
  lastWorkoutDate: null,
  currentWorkoutSession: null,
  workoutTypes: [
    { name: "Push Day", color: "bg-white border-red-500 text-red-600" },
    { name: "Pull Day", color: "bg-white border-blue-500 text-blue-600" },
    { name: "Leg Day", color: "bg-white border-yellow-500 text-yellow-600" },
    { name: "Arm Day", color: "bg-white border-green-500 text-green-600" }
  ],
  progressKg: 0,
  lastWeekProgress: 0,

  initializeUserData: async (forceSync = false) => {
    // Always load from offline storage first for instant UI
    try {
      const [cachedPlans, cachedSessions, cachedRecords] = await Promise.all([
        offlineStorage.getWorkoutPlans(),
        offlineStorage.getWorkoutSessions(),
        offlineStorage.getPersonalRecords(),
      ]);
      
      if (cachedPlans.length > 0 || cachedSessions.length > 0 || cachedRecords.length > 0) {
        set({ 
          workoutPlans: cachedPlans,
          workoutSessions: cachedSessions,
          personalRecords: cachedRecords,
        });
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if we need to sync (skip if data is fresh and not forced)
    if (!forceSync) {
      const lastSync = await offlineStorage.getLastSync();
      const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
      if (lastSync && (Date.now() - lastSync) < SYNC_INTERVAL) {
        console.log('Workout data is fresh, skipping Supabase sync');
        return;
      }
    }

    try {
      // Background sync from Supabase
      const { data: plans } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id);

      if (plans) {
        const plansWithExercises = await Promise.all(
          plans.map(async (plan) => {
            const { data: exercises } = await supabase
              .from('exercises')
              .select('*')
              .eq('plan_id', plan.id);

            return {
              id: plan.id,
              name: plan.name,
              type: plan.type || plan.name,
              description: undefined,
              restTimer: undefined,
              exercises: exercises?.map(e => ({
                id: e.id,
                name: e.name,
                weight: e.weight || undefined,
                reps: e.reps || 10,
                sets: e.sets || 3,
                notes: undefined,
                planId: plan.id,
                hasWarmup: e.has_warmup || false,
              })) || [],
            };
          })
        );

        set({ workoutPlans: plansWithExercises });
      }

      // Load sessions
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (sessions) {
        const sessionsWithExercises = await Promise.all(
          sessions.map(async (session) => {
            const { data: completedExercises } = await supabase
              .from('completed_exercises')
              .select('*')
              .eq('session_id', session.id);

            return {
              id: session.id,
              planId: session.plan_id,
              date: session.date,
              exercises: completedExercises?.map(e => ({
                id: e.id,
                name: e.name,
                weight: Number(e.weight),
                reps: e.reps,
                sets: e.sets,
                date: e.date
              })) || []
            };
          })
        );

        set({ workoutSessions: sessionsWithExercises });
      }

      // Load personal records
      const { data: prs } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id);

      if (prs) {
        set({
          personalRecords: prs.map(pr => ({
            exerciseName: pr.exercise_name,
            weight: pr.weight,
            reps: pr.reps,
            date: pr.date
          }))
        });
      }

      // Save to offline storage after successful load
      const state = get();
      await offlineStorage.saveWorkoutPlans(state.workoutPlans);
      await offlineStorage.saveWorkoutSessions(state.workoutSessions);
      await offlineStorage.savePersonalRecords(state.personalRecords);
      
    } catch (error) {
      console.error('Failed to load from Supabase, using offline data:', error);
      
      // Load from offline storage as fallback
      try {
        const [plans, sessions, records] = await Promise.all([
          offlineStorage.getWorkoutPlans(),
          offlineStorage.getWorkoutSessions(),
          offlineStorage.getPersonalRecords(),
        ]);
        
        set({ 
          workoutPlans: plans,
          workoutSessions: sessions,
          personalRecords: records,
        });
      } catch (offlineError) {
        console.error('Failed to load offline data:', offlineError);
      }
    }
  },

  /**
   * From here down, every mutation follows the offline-first pattern:
   *   1. generate the row id on the client (`newId()`)
   *   2. update Zustand state optimistically so the UI never waits
   *   3. hand the write to `syncQueue`, which sends it now if we're online
   *      and otherwise queues it in IndexedDB for replay on reconnect.
   * RLS still applies on replay — `user_id` is always the signed-in user.
   */
  addWorkoutPlan: async (plan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate input
    const { workoutPlanSchema } = await import('@/lib/validation');
    workoutPlanSchema.parse({
      name: plan.name,
      type: plan.type,
      description: plan.description,
      restTimer: plan.restTimer
    });

    const id = newId();

    set((state) => ({
      workoutPlans: [...state.workoutPlans, { ...plan, id }]
    }));

    await syncQueue.send({
      table: 'workout_plans',
      op: 'insert',
      payload: {
        id,
        user_id: user.id,
        name: plan.name,
        type: plan.type
      },
      onConflict: 'id'
    });
  },

  updateWorkoutPlan: async (id, updates) => {
    set((state) => ({
      workoutPlans: state.workoutPlans.map((plan) =>
        plan.id === id ? { ...plan, ...updates } : plan
      )
    }));

    await syncQueue.send({
      table: 'workout_plans',
      op: 'update',
      payload: {
        name: updates.name,
        type: updates.type,
        updated_at: new Date().toISOString()
      },
      match: { id },
      timestampColumn: 'updated_at'
    });
  },

  deleteWorkoutPlan: async (id) => {
    set((state) => ({
      workoutPlans: state.workoutPlans.filter((plan) => plan.id !== id)
    }));

    await syncQueue.send({ table: 'workout_plans', op: 'delete', match: { id } });
  },

  addExercise: async (planId, exercise) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate input
    const { exerciseSchema } = await import('@/lib/validation');
    const validated = exerciseSchema.parse({
      name: exercise.name,
      weight: exercise.weight,
      reps: exercise.reps,
      sets: exercise.sets,
      notes: exercise.notes
    });

    const id = newId();
    const newExercise = {
      id,
      name: validated.name,
      weight: validated.weight,
      reps: validated.reps,
      sets: validated.sets,
      planId,
      hasWarmup: exercise.hasWarmup ?? false
    };

    set((state) => ({
      workoutPlans: state.workoutPlans.map((plan) =>
        plan.id === planId
          ? { ...plan, exercises: [...plan.exercises, newExercise] }
          : plan
      )
    }));

    await syncQueue.send({
      table: 'exercises',
      op: 'insert',
      payload: {
        id,
        user_id: user.id,
        plan_id: planId,
        name: validated.name,
        weight: validated.weight,
        reps: validated.reps,
        sets: validated.sets,
        has_warmup: exercise.hasWarmup ?? false
      },
      onConflict: 'id'
    });
  },

  startWorkout: async (planId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: '', planId, date: new Date().toISOString(), exercises: [] };

    // Client-side id means a workout can start (and be logged against) with no
    // network at all — the session row is created locally and replayed later.
    const id = newId();
    const session: WorkoutSession = {
      id,
      planId,
      date: new Date().toISOString(),
      exercises: []
    };

    set((state) => ({
      workoutSessions: [...state.workoutSessions, session],
      currentWorkoutSession: session
    }));

    await syncQueue.send({
      table: 'workout_sessions',
      op: 'insert',
      payload: {
        id,
        user_id: user.id,
        plan_id: planId,
        date: session.date
      },
      onConflict: 'id'
    });

    return session;
  },

  pauseWorkout: () => {
    // Keep current session but don't clear it
  },

  resumeWorkout: () => {
    return get().currentWorkoutSession;
  },

  addExerciseToCurrentWorkout: async (exercise) => {
    const { currentWorkoutSession } = get();
    if (!currentWorkoutSession) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const id = newId();

    set((state) => ({
      workoutPlans: state.workoutPlans.map((plan) =>
        plan.id === currentWorkoutSession.planId
          ? {
              ...plan,
              exercises: [
                ...plan.exercises,
                {
                  id,
                  name: exercise.name,
                  weight: exercise.weight,
                  reps: exercise.reps,
                  sets: exercise.sets,
                  planId: currentWorkoutSession.planId,
                  hasWarmup: exercise.hasWarmup ?? false
                }
              ]
            }
          : plan
      )
    }));

    await syncQueue.send({
      table: 'exercises',
      op: 'insert',
      payload: {
        id,
        user_id: user.id,
        plan_id: currentWorkoutSession.planId,
        name: exercise.name,
        weight: exercise.weight,
        reps: exercise.reps,
        sets: exercise.sets,
        has_warmup: exercise.hasWarmup ?? false
      },
      onConflict: 'id'
    });
  },

  completeWorkout: async (sessionId, exercises) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const date = new Date().toISOString();

    // Build the completed rows locally so the history screen is correct even
    // if none of this has reached Supabase yet.
    const completedRows = exercises.map((exercise) => ({
      id: newId(),
      user_id: user.id,
      session_id: sessionId,
      name: exercise.name,
      weight: exercise.weight,
      reps: exercise.reps,
      sets: exercise.sets,
      date
    }));

    set((state) => ({
      workoutSessions: state.workoutSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              exercises: completedRows.map((row) => ({
                id: row.id,
                name: row.name,
                weight: Number(row.weight),
                reps: row.reps,
                sets: row.sets,
                date: row.date
              }))
            }
          : session
      ),
      currentWorkoutSession: null
    }));

    // Queued one row at a time so a single bad row can't block the rest, and
    // so replay order stays after the session insert above.
    for (const row of completedRows) {
      await syncQueue.send({
        table: 'completed_exercises',
        op: 'insert',
        payload: row,
        onConflict: 'id'
      });
    }

    // Update personal records (compare estimated 1RM-style score consistently)
    for (const exercise of exercises) {
      const currentPR = get().getPersonalRecord(exercise.name);
      const score = exercise.weight * exercise.reps;
      const currentScore = currentPR ? currentPR.weight * currentPR.reps : 0;

      if (score > currentScore) {
        await get().updatePersonalRecord(exercise.name, exercise.weight, exercise.reps);
      }
    }

    await get().updateStreak();
    get().calculateProgress();
  },

  updateExercise: async (exerciseId, updates) => {
    set((state) => ({
      workoutPlans: state.workoutPlans.map((plan) => ({
        ...plan,
        exercises: plan.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
        )
      }))
    }));

    await syncQueue.send({
      table: 'exercises',
      op: 'update',
      payload: {
        name: updates.name,
        weight: updates.weight,
        reps: updates.reps,
        sets: updates.sets,
        has_warmup: updates.hasWarmup
      },
      match: { id: exerciseId }
    });
  },

  deleteExercise: async (exerciseId) => {
    set((state) => ({
      workoutPlans: state.workoutPlans.map((plan) => ({
        ...plan,
        exercises: plan.exercises.filter((exercise) => exercise.id !== exerciseId)
      }))
    }));

    await syncQueue.send({ table: 'exercises', op: 'delete', match: { id: exerciseId } });
  },

  updatePersonalRecord: async (exerciseName, weight, reps) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const date = new Date().toISOString();

    // Validate input
    const { personalRecordSchema } = await import('@/lib/validation');
    personalRecordSchema.parse({ exerciseName, weight, reps, date });

    set((state) => {
      const newRecord: PersonalRecord = { exerciseName, weight, reps, date };
      const existingIndex = state.personalRecords.findIndex(
        (pr) => pr.exerciseName === exerciseName
      );

      if (existingIndex >= 0) {
        const updated = [...state.personalRecords];
        updated[existingIndex] = newRecord;
        return { personalRecords: updated };
      }
      return { personalRecords: [...state.personalRecords, newRecord] };
    });

    await syncQueue.send({
      table: 'personal_records',
      op: 'insert',
      payload: {
        user_id: user.id,
        exercise_name: exerciseName,
        weight,
        reps,
        date
      },
      // One PR row per (user, exercise) — upserting on that pair keeps replay
      // idempotent without needing a client-side id.
      onConflict: 'user_id,exercise_name'
    });
  },

  deletePersonalRecord: async (exerciseName, reps) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set((state) => ({
      personalRecords: state.personalRecords.filter(
        record => !(record.exerciseName === exerciseName && record.reps === reps)
      )
    }));

    await syncQueue.send({
      table: 'personal_records',
      op: 'delete',
      match: { user_id: user.id, exercise_name: exerciseName }
    });
  },


  getPersonalRecord: (exerciseName) => {
    return get().personalRecords.find((pr) => pr.exerciseName === exerciseName);
  },

  getExerciseHistory: (exerciseName) => {
    const { workoutSessions } = get();
    const allExercises: CompletedExercise[] = [];

    workoutSessions.forEach(session => {
      session.exercises
        .filter(exercise => exercise.name === exerciseName)
        .forEach(exercise => allExercises.push(exercise));
    });

    return allExercises.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getWorkoutFrequency: (workoutType) => {
    const { workoutSessions, workoutPlans } = get();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const planIds = workoutPlans
      .filter(plan => plan.type === workoutType)
      .map(plan => plan.id);

    return workoutSessions.filter(session =>
      planIds.includes(session.planId) &&
      new Date(session.date) >= oneMonthAgo
    ).length;
  },

  getWorkoutProgress: (workoutType) => {
    const { workoutSessions, workoutPlans } = get();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const planIds = workoutPlans
      .filter(plan => plan.type === workoutType)
      .map(plan => plan.id);

    const thisWeekSessions = workoutSessions.filter(session =>
      planIds.includes(session.planId) &&
      new Date(session.date) >= oneWeekAgo
    );

    const lastWeekSessions = workoutSessions.filter(session =>
      planIds.includes(session.planId) &&
      new Date(session.date) >= twoWeeksAgo &&
      new Date(session.date) < oneWeekAgo
    );

    const thisWeekWeight = thisWeekSessions.reduce((sum, session) =>
      sum + session.exercises.reduce((exerciseSum, exercise) => {
        if (exercise.setData && exercise.setData.length > 0) {
          return exerciseSum + exercise.setData.reduce((setSum, set) =>
            setSum + (set.weight * set.reps), 0);
        }
        return exerciseSum + (exercise.weight * exercise.reps * exercise.sets);
      }, 0), 0
    );

    const lastWeekWeight = lastWeekSessions.reduce((sum, session) =>
      sum + session.exercises.reduce((exerciseSum, exercise) => {
        if (exercise.setData && exercise.setData.length > 0) {
          return exerciseSum + exercise.setData.reduce((setSum, set) =>
            setSum + (set.weight * set.reps), 0);
        }
        return exerciseSum + (exercise.weight * exercise.reps * exercise.sets);
      }, 0), 0
    );

    if (lastWeekWeight === 0 && thisWeekWeight === 0) return 'none';
    if (lastWeekWeight === 0) return 'increase';

    const difference = thisWeekWeight - lastWeekWeight;
    const percentChange = (difference / lastWeekWeight) * 100;

    if (percentChange > 2) return 'increase';
    if (percentChange < -2) return 'decrease';
    return 'same';
  },

  updateStreak: async () => {
    // This feature requires a user_stats table which doesn't exist yet
    // Can be implemented later if needed
  },

  addWorkoutType: async (type: WorkoutType) => {
    // This feature requires a workout_types table which doesn't exist yet
    set((state) => ({
      workoutTypes: [...state.workoutTypes, type]
    }));
  },

  deleteWorkoutType: async (name: string) => {
    // This feature requires a workout_types table which doesn't exist yet
    set((state) => ({
      workoutTypes: state.workoutTypes.filter(type => type.name !== name),
      workoutPlans: state.workoutPlans.filter(plan => plan.type !== name)
    }));
  },

  calculateProgress: () => {
    const { workoutSessions } = get();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = workoutSessions.filter(
      session => new Date(session.date) >= oneWeekAgo
    );
    const lastWeekSessions = workoutSessions.filter(
      session => new Date(session.date) >= twoWeeksAgo && new Date(session.date) < oneWeekAgo
    );

    const thisWeekTotal = thisWeekSessions.reduce((sum, session) =>
      sum + session.exercises.reduce((exerciseSum, exercise) =>
        exerciseSum + (exercise.weight * exercise.reps * exercise.sets), 0
      ), 0
    );

    const lastWeekTotal = lastWeekSessions.reduce((sum, session) =>
      sum + session.exercises.reduce((exerciseSum, exercise) =>
        exerciseSum + (exercise.weight * exercise.reps * exercise.sets), 0
      ), 0
    );

    const differenceKg = thisWeekTotal - lastWeekTotal;

    set({ progressKg: differenceKg, lastWeekProgress: lastWeekTotal });
  }
}));
