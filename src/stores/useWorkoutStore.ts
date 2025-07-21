import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Exercise {
  id: string;
  name: string;
  weight: number;
  reps: number;
  date: string;
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
  personalRecords: PersonalRecord[];
  currentStreak: number;
  lastWorkoutDate: string | null;
  workoutTypes: WorkoutType[];
  progressPercentage: number;
  lastWeekProgress: number;
  
  // Actions
  addWorkoutPlan: (plan: Omit<WorkoutPlan, "id">) => void;
  updateWorkoutPlan: (id: string, plan: Partial<WorkoutPlan>) => void;
  deleteWorkoutPlan: (id: string) => void;
  addExercise: (planId: string, exercise: Omit<Exercise, "id">) => void;
  updateExercise: (exerciseId: string, exercise: Partial<Exercise>) => void;
  deleteExercise: (exerciseId: string) => void;
  updatePersonalRecord: (exerciseName: string, weight: number, reps: number) => void;
  getPersonalRecord: (exerciseName: string) => PersonalRecord | undefined;
  getExerciseHistory: (exerciseName: string) => Exercise[];
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
      personalRecords: [],
      currentStreak: 0,
      lastWorkoutDate: null,
      workoutTypes: [
        { name: "Push Day", color: "bg-red-100 border-red-300 text-red-800" },
        { name: "Pull Day", color: "bg-blue-100 border-blue-300 text-blue-800" },
        { name: "Leg Day", color: "bg-green-100 border-green-300 text-green-800" },
        { name: "Arm Day", color: "bg-purple-100 border-purple-300 text-purple-800" }
      ],
      progressPercentage: 0,
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
        const newExercise = { ...exercise, id };
        
        set((state) => {
          const updatedExercises = [...state.exercises, newExercise];
          const updatedPlans = state.workoutPlans.map((plan) =>
            plan.id === planId
              ? { ...plan, exercises: [...plan.exercises, newExercise] }
              : plan
          );

          // Update personal record if this is a new best
          const currentPR = get().getPersonalRecord(exercise.name);
          const score = exercise.weight * exercise.reps;
          const currentScore = currentPR ? currentPR.weight * currentPR.reps : 0;

          if (score > currentScore) {
            get().updatePersonalRecord(exercise.name, exercise.weight, exercise.reps);
          }

          return {
            exercises: updatedExercises,
            workoutPlans: updatedPlans,
          };
        });

        // Update streak
        get().updateStreak();
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
        return get().exercises
          .filter((exercise) => exercise.name === exerciseName)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        const { exercises } = get();
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const thisWeekExercises = exercises.filter(
          exercise => new Date(exercise.date) >= oneWeekAgo
        );
        const lastWeekExercises = exercises.filter(
          exercise => new Date(exercise.date) >= twoWeeksAgo && new Date(exercise.date) < oneWeekAgo
        );
        
        const thisWeekTotal = thisWeekExercises.reduce((sum, e) => sum + (e.weight * e.reps), 0);
        const lastWeekTotal = lastWeekExercises.reduce((sum, e) => sum + (e.weight * e.reps), 0);
        
        let percentage = 0;
        if (lastWeekTotal > 0) {
          percentage = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
        } else if (thisWeekTotal > 0) {
          percentage = 100;
        }
        
        set({ progressPercentage: percentage, lastWeekProgress: lastWeekTotal });
      }
    }),
    {
      name: "planik-workout-store",
    }
  )
);