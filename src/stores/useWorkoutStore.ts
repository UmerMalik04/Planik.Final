import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addWorkoutPlan: (plan: Omit<WorkoutPlan, "id">) => void;
  updateWorkoutPlan: (id: string, plan: Partial<WorkoutPlan>) => void;
  deleteWorkoutPlan: (id: string) => void;
  addExercise: (planId: string, exercise: Omit<Exercise, "id" | "planId">) => void;
  updateExercise: (exerciseId: string, exercise: Partial<Exercise>) => void;
  deleteExercise: (exerciseId: string) => void;
  startWorkout: (planId: string) => WorkoutSession;
  completeWorkout: (sessionId: string, exercises: CompletedExercise[]) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => WorkoutSession | null;
  addExerciseToCurrentWorkout: (exercise: Omit<Exercise, "id" | "planId">) => void;
  updatePersonalRecord: (exerciseName: string, weight: number, reps: number) => void;
  getPersonalRecord: (exerciseName: string) => PersonalRecord | undefined;
  getExerciseHistory: (exerciseName: string) => CompletedExercise[];
  getWorkoutFrequency: (workoutType: string) => number;
  getWorkoutProgress: (workoutType: string) => 'increase' | 'decrease' | 'same' | 'none';
  updateStreak: () => void;
  addWorkoutType: (type: WorkoutType) => void;
  deleteWorkoutType: (name: string) => void;
  calculateProgress: () => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
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

      addWorkoutPlan: (plan) => {
        const id = Date.now().toString();
        set((state) => ({
          workoutPlans: [...state.workoutPlans, { ...plan, id }],
        }));
      },

      updateWorkoutPlan: (id, updates) => {
        set((state) => ({
          workoutPlans: state.workoutPlans.map((plan) =>
            plan.id === id ? { ...plan, ...updates } : plan
          ),
        }));
      },

      deleteWorkoutPlan: (id) => {
        set((state) => ({
          workoutPlans: state.workoutPlans.filter((plan) => plan.id !== id),
        }));
      },

      addExercise: (planId, exercise) => {
        const id = Date.now().toString();
        const newExercise = { ...exercise, id, planId };
        
        set((state) => {
          const updatedExercises = [...state.exercises, newExercise];
          const updatedPlans = state.workoutPlans.map((plan) =>
            plan.id === planId
              ? { ...plan, exercises: [...plan.exercises, newExercise] }
              : plan
          );

          return {
            exercises: updatedExercises,
            workoutPlans: updatedPlans,
          };
        });
      },

      startWorkout: (planId) => {
        const sessionId = Date.now().toString();
        const session: WorkoutSession = {
          id: sessionId,
          planId,
          date: new Date().toISOString(),
          exercises: []
        };

        set((state) => ({
          workoutSessions: [...state.workoutSessions, session],
          currentWorkoutSession: session
        }));

        return session;
      },

      pauseWorkout: () => {
        // Keep current session but don't clear it
      },

      resumeWorkout: () => {
        return get().currentWorkoutSession;
      },

      addExerciseToCurrentWorkout: (exercise) => {
        const id = Date.now().toString();
        const { currentWorkoutSession } = get();
        if (!currentWorkoutSession) return;

        const newExercise = { ...exercise, id, planId: currentWorkoutSession.planId };
        
        set((state) => {
          const updatedPlans = state.workoutPlans.map((plan) =>
            plan.id === currentWorkoutSession.planId
              ? { ...plan, exercises: [...plan.exercises, newExercise] }
              : plan
          );

          return {
            workoutPlans: updatedPlans,
          };
        });
      },

      completeWorkout: (sessionId, exercises) => {
        set((state) => {
          const updatedSessions = state.workoutSessions.map(session =>
            session.id === sessionId ? { ...session, exercises } : session
          );

          return { 
            workoutSessions: updatedSessions,
            currentWorkoutSession: null // Clear current session when completed
          };
        });

        // Update personal records
        exercises.forEach(exercise => {
          const currentPR = get().getPersonalRecord(exercise.name);
          const score = exercise.weight * exercise.reps * exercise.sets;
          const currentScore = currentPR ? currentPR.weight * currentPR.reps : 0;

          if (score > currentScore) {
            get().updatePersonalRecord(exercise.name, exercise.weight, exercise.reps);
          }
        });

        // Update streak
        get().updateStreak();
        get().calculateProgress();
      },

      updateExercise: (exerciseId, updates) => {
        set((state) => {
          const updatedExercises = state.exercises.map((exercise) =>
            exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
          );
          
          const updatedPlans = state.workoutPlans.map((plan) => ({
            ...plan,
            exercises: plan.exercises.map((exercise) =>
              exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
            ),
          }));

          return {
            exercises: updatedExercises,
            workoutPlans: updatedPlans,
          };
        });
      },

      deleteExercise: (exerciseId) => {
        set((state) => ({
          exercises: state.exercises.filter((exercise) => exercise.id !== exerciseId),
          workoutPlans: state.workoutPlans.map((plan) => ({
            ...plan,
            exercises: plan.exercises.filter((exercise) => exercise.id !== exerciseId),
          })),
        }));
      },

      updatePersonalRecord: (exerciseName, weight, reps) => {
        set((state) => {
          const existingIndex = state.personalRecords.findIndex(
            (pr) => pr.exerciseName === exerciseName
          );
          
          const newRecord: PersonalRecord = {
            exerciseName,
            weight,
            reps,
            date: new Date().toISOString(),
          };

          if (existingIndex >= 0) {
            const updated = [...state.personalRecords];
            updated[existingIndex] = newRecord;
            return { personalRecords: updated };
          } else {
            return {
              personalRecords: [...state.personalRecords, newRecord],
            };
          }
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
          sum + session.exercises.reduce((exerciseSum, exercise) => 
            exerciseSum + (exercise.weight * exercise.reps * exercise.sets), 0
          ), 0
        );
        
        const lastWeekWeight = lastWeekSessions.reduce((sum, session) =>
          sum + session.exercises.reduce((exerciseSum, exercise) => 
            exerciseSum + (exercise.weight * exercise.reps * exercise.sets), 0
          ), 0
        );
        
        if (lastWeekWeight === 0 && thisWeekWeight === 0) return 'none';
        if (lastWeekWeight === 0) return 'increase';
        
        const difference = thisWeekWeight - lastWeekWeight;
        const percentChange = (difference / lastWeekWeight) * 100;
        
        if (percentChange > 5) return 'increase';
        if (percentChange < -5) return 'decrease';
        return 'same';
      },

      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = get().lastWorkoutDate;
        
        if (!lastDate) {
          set({ currentStreak: 1, lastWorkoutDate: today });
          return;
        }

        const lastWorkout = new Date(lastDate);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastWorkout.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          set((state) => ({ 
            currentStreak: state.currentStreak + 1, 
            lastWorkoutDate: today 
          }));
        } else if (diffDays === 0) {
          // Same day - don't change streak but update date
          set({ lastWorkoutDate: today });
        } else {
          // Streak broken
          set({ currentStreak: 1, lastWorkoutDate: today });
        }
      },

      addWorkoutType: (type: WorkoutType) => {
        set((state) => ({
          workoutTypes: [...state.workoutTypes, type]
        }));
      },

      deleteWorkoutType: (name: string) => {
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
    }),
    {
      name: "planik-workout-store",
    }
  )
);