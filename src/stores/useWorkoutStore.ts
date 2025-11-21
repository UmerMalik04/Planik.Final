import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

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
  initializeUserData: () => Promise<void>;
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

  initializeUserData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load workout plans
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
            .eq('workout_plan_id', plan.id)
            .order('order_index', { ascending: true });

          return {
            id: plan.id,
            name: plan.name,
            type: plan.type || plan.name,
            description: plan.description,
            restTimer: plan.rest_timer,
            exercises: exercises?.map(e => ({
              id: e.id,
              name: e.name,
              weight: e.weight || undefined,
              reps: e.reps || 10,
              sets: e.sets || 3,
              notes: e.notes || undefined,
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
              name: e.exercise_name,
              weight: Number(e.weight),
              reps: e.reps,
              sets: e.sets,
              date: e.created_at
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

    // Note: user_stats and workout_types tables don't exist yet
    // These features can be implemented later if needed
  },

  addWorkoutPlan: async (plan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate input
    const { workoutPlanSchema } = await import('@/lib/validation');
    const validated = workoutPlanSchema.parse({
      name: plan.name,
      type: plan.type,
      description: plan.description,
      restTimer: plan.restTimer
    });

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        name: plan.name,
        type: plan.type,
        rest_timer: plan.restTimer
      })
      .select()
      .single();

    if (data && !error) {
      set((state) => ({
        workoutPlans: [...state.workoutPlans, { ...plan, id: data.id }]
      }));
    }
  },

  updateWorkoutPlan: async (id, updates) => {
    const { error } = await supabase
      .from('workout_plans')
      .update({
        name: updates.name,
        type: updates.type,
        rest_timer: updates.restTimer
      })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        workoutPlans: state.workoutPlans.map((plan) =>
          plan.id === id ? { ...plan, ...updates } : plan
        )
      }));
    }
  },

  deleteWorkoutPlan: async (id) => {
    await supabase
      .from('workout_plans')
      .delete()
      .eq('id', id);

    set((state) => ({
      workoutPlans: state.workoutPlans.filter((plan) => plan.id !== id)
    }));
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

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: user.id,
        workout_plan_id: planId,
        name: validated.name,
        weight: validated.weight,
        reps: validated.reps,
        sets: validated.sets,
        notes: validated.notes,
        has_warmup: exercise.hasWarmup
      })
      .select()
      .single();

    if (data && !error) {
      const newExercise = {
        id: data.id,
        name: data.name,
        weight: data.weight,
        reps: data.reps,
        sets: data.sets,
        planId: data.workout_plan_id,
        hasWarmup: data.has_warmup
      };

      set((state) => ({
        workoutPlans: state.workoutPlans.map((plan) =>
          plan.id === planId
            ? { ...plan, exercises: [...plan.exercises, newExercise] }
            : plan
        )
      }));
    }
  },

  startWorkout: async (planId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: '', planId, date: new Date().toISOString(), exercises: [] };

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        plan_id: planId
      })
      .select()
      .single();

    if (data && !error) {
      const session: WorkoutSession = {
        id: data.id,
        planId: data.plan_id,
        date: data.date,
        exercises: []
      };

      set((state) => ({
        workoutSessions: [...state.workoutSessions, session],
        currentWorkoutSession: session
      }));

      return session;
    }

    return { id: '', planId, date: new Date().toISOString(), exercises: [] };
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

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: user.id,
        workout_plan_id: currentWorkoutSession.planId,
        name: exercise.name,
        weight: exercise.weight,
        reps: exercise.reps,
        sets: exercise.sets,
        has_warmup: exercise.hasWarmup
      })
      .select()
      .single();

    if (data && !error) {
      set((state) => ({
        workoutPlans: state.workoutPlans.map((plan) =>
          plan.id === currentWorkoutSession.planId
            ? {
                ...plan,
                exercises: [
                  ...plan.exercises,
                  {
                    id: data.id,
                    name: data.name,
                    weight: data.weight,
                    reps: data.reps,
                    sets: data.sets,
                    planId: data.workout_plan_id,
                    hasWarmup: data.has_warmup
                  }
                ]
              }
            : plan
        )
      }));
    }
  },

  completeWorkout: async (sessionId, exercises) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert completed exercises
    const completedExercisesData = exercises.map(exercise => ({
      user_id: user.id,
      session_id: sessionId,
      exercise_name: exercise.name,
      weight: exercise.weight,
      reps: exercise.reps,
      sets: exercise.sets
    }));

    if (completedExercisesData.length > 0) {
      await supabase
        .from('completed_exercises')
        .insert(completedExercisesData);
    }

    // Reload the session with completed exercises from database
    const { data: completedExercises } = await supabase
      .from('completed_exercises')
      .select('*')
      .eq('session_id', sessionId);

    const exercisesFromDb = completedExercises?.map(e => ({
      id: e.id,
      name: e.exercise_name,
      weight: Number(e.weight),
      reps: e.reps,
      sets: e.sets,
      date: e.created_at
    })) || [];

    set((state) => {
      const updatedSessions = state.workoutSessions.map(session =>
        session.id === sessionId ? { ...session, exercises: exercisesFromDb } : session
      );

      return {
        workoutSessions: updatedSessions,
        currentWorkoutSession: null
      };
    });

    // Update personal records
    for (const exercise of exercises) {
      const currentPR = get().getPersonalRecord(exercise.name);
      const score = exercise.weight * exercise.reps * exercise.sets;
      const currentScore = currentPR ? currentPR.weight * currentPR.reps : 0;

      if (score > currentScore) {
        await get().updatePersonalRecord(exercise.name, exercise.weight, exercise.reps);
      }
    }

    await get().updateStreak();
    get().calculateProgress();
  },

  updateExercise: async (exerciseId, updates) => {
    const { error } = await supabase
      .from('exercises')
      .update({
        name: updates.name,
        weight: updates.weight,
        reps: updates.reps,
        sets: updates.sets,
        has_warmup: updates.hasWarmup
      })
      .eq('id', exerciseId);

    if (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }

    set((state) => ({
      workoutPlans: state.workoutPlans.map((plan) => ({
        ...plan,
        exercises: plan.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
        )
      }))
    }));
  },

  deleteExercise: async (exerciseId) => {
    await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId);

    set((state) => ({
      workoutPlans: state.workoutPlans.map((plan) => ({
        ...plan,
        exercises: plan.exercises.filter((exercise) => exercise.id !== exerciseId)
      }))
    }));
  },

  updatePersonalRecord: async (exerciseName, weight, reps) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate input
    const { personalRecordSchema } = await import('@/lib/validation');
    personalRecordSchema.parse({
      exerciseName,
      weight,
      reps,
      date: new Date().toISOString()
    });

    await supabase
      .from('personal_records')
      .upsert({
        user_id: user.id,
        exercise_name: exerciseName,
        weight,
        reps,
        date: new Date().toISOString()
      });

    set((state) => {
      const existingIndex = state.personalRecords.findIndex(
        (pr) => pr.exerciseName === exerciseName
      );

      const newRecord: PersonalRecord = {
        exerciseName,
        weight,
        reps,
        date: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        const updated = [...state.personalRecords];
        updated[existingIndex] = newRecord;
        return { personalRecords: updated };
      } else {
        return {
          personalRecords: [...state.personalRecords, newRecord]
        };
      }
    });
  },

  deletePersonalRecord: async (exerciseName, reps) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('personal_records')
      .delete()
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName);

    set((state) => ({
      personalRecords: state.personalRecords.filter(
        record => !(record.exerciseName === exerciseName && record.reps === reps)
      )
    }));
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
