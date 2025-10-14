import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export interface Exercise {
  id: string;
  name: string;
  weight?: number;
  reps: number;
  sets: number;
  date?: string;
  planId: string;
  hasWarmup?: boolean;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  date: string;
  exercises: CompletedExercise[];
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
  exercises: Exercise[];
  sets: number;
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
            .eq('plan_id', plan.id);

          return {
            id: plan.id,
            name: plan.name,
            type: plan.type,
            sets: plan.sets,
            exercises: exercises?.map(e => ({
              id: e.id,
              name: e.name,
              weight: e.weight,
              reps: e.reps,
              sets: e.sets,
              planId: e.plan_id,
              hasWarmup: e.has_warmup
            })) || []
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
              date: e.date,
              previousWeight: e.previous_weight ? Number(e.previous_weight) : undefined,
              previousReps: e.previous_reps || undefined,
              setData: (e.set_data as unknown) as SetData[] | undefined,
              previousSetData: (e.previous_set_data as unknown) as SetData[] | undefined
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

    // Load stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (stats) {
      set({
        currentStreak: stats.current_streak,
        lastWorkoutDate: stats.last_workout_date,
        progressKg: stats.progress_kg,
        lastWeekProgress: stats.last_week_progress
      });
    }

    // Load workout types
    const { data: types } = await supabase
      .from('workout_types')
      .select('*')
      .eq('user_id', user.id);

    if (types && types.length > 0) {
      set({ workoutTypes: types });
    }
  },

  addWorkoutPlan: async (plan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: user.id,
        name: plan.name,
        type: plan.type,
        sets: plan.sets
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
        sets: updates.sets
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
    if (!user) return;

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: user.id,
        plan_id: planId,
        name: exercise.name,
        weight: exercise.weight,
        reps: exercise.reps,
        sets: exercise.sets,
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
        planId: data.plan_id,
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
        plan_id: planId,
        is_active: true
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
        plan_id: currentWorkoutSession.planId,
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
                    planId: data.plan_id,
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
    if (!user) {
      console.error('No user found when completing workout');
      return;
    }

    console.log('Completing workout for session:', sessionId);
    console.log('Exercises to save:', exercises);

    // Update session to inactive
    const { error: updateError } = await supabase
      .from('workout_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    // Insert completed exercises
    const completedExercisesData = exercises.map(exercise => ({
      user_id: user.id,
      session_id: sessionId,
      name: exercise.name,
      weight: exercise.weight,
      reps: exercise.reps,
      sets: exercise.sets,
      previous_weight: exercise.previousWeight,
      previous_reps: exercise.previousReps,
      set_data: exercise.setData as any,
      previous_set_data: exercise.previousSetData as any,
      date: exercise.date
    }));

    console.log('Data to insert:', completedExercisesData);

    if (completedExercisesData.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('completed_exercises')
        .insert(completedExercisesData)
        .select();

      if (insertError) {
        console.error('Error inserting exercises:', insertError);
      } else {
        console.log('Successfully inserted exercises:', insertedData);
      }
    }

    // Reload the session with completed exercises from database
    const { data: completedExercises } = await supabase
      .from('completed_exercises')
      .select('*')
      .eq('session_id', sessionId);

    const exercisesFromDb = completedExercises?.map(e => ({
      id: e.id,
      name: e.name,
      weight: Number(e.weight),
      reps: e.reps,
      sets: e.sets,
      date: e.date,
      previousWeight: e.previous_weight ? Number(e.previous_weight) : undefined,
      previousReps: e.previous_reps || undefined,
      setData: (e.set_data as unknown) as SetData[] | undefined,
      previousSetData: (e.previous_set_data as unknown) as SetData[] | undefined
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
    await supabase
      .from('exercises')
      .update({
        name: updates.name,
        weight: updates.weight,
        reps: updates.reps,
        sets: updates.sets,
        has_warmup: updates.hasWarmup
      })
      .eq('id', exerciseId);

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
    if (!user) return;

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDate = get().lastWorkoutDate;

    let newStreak = 1;
    let newLastDate = today;

    if (lastDate) {
      const lastWorkout = new Date(lastDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastWorkout.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = get().currentStreak + 1;
      } else if (diffDays === 0) {
        newStreak = get().currentStreak;
      }
    }

    await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        current_streak: newStreak,
        last_workout_date: newLastDate
      });

    set({ currentStreak: newStreak, lastWorkoutDate: newLastDate });
  },

  addWorkoutType: async (type: WorkoutType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('workout_types')
      .insert({
        user_id: user.id,
        name: type.name,
        color: type.color
      });

    set((state) => ({
      workoutTypes: [...state.workoutTypes, type]
    }));
  },

  deleteWorkoutType: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('workout_types')
      .delete()
      .eq('user_id', user.id)
      .eq('name', name);

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
