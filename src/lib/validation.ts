import { z } from 'zod';

// Auth validation schemas
export const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(128, { message: "Password must be less than 128 characters" }),
  confirmPassword: z.string(),
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say'], { message: "Please select a gender" }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(1, { message: "Password is required" })
});

// Diet validation schemas
export const foodItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Food name is required" }).max(200, { message: "Food name must be less than 200 characters" }),
  calories: z.number().int().min(0, { message: "Calories must be a positive number" }).max(10000, { message: "Calories must be less than 10,000" }),
  protein: z.number().min(0, { message: "Protein must be positive" }).max(1000, { message: "Protein must be less than 1,000g" }),
  carbs: z.number().min(0, { message: "Carbs must be positive" }).max(1000, { message: "Carbs must be less than 1,000g" }),
  fat: z.number().min(0, { message: "Fat must be positive" }).max(1000, { message: "Fat must be less than 1,000g" }),
  fiber: z.number().min(0).max(500).optional(),
  sugar: z.number().min(0).max(500).optional(),
  quantity: z.number().min(0.1, { message: "Quantity must be at least 0.1" }).max(10000, { message: "Quantity must be less than 10,000" }),
  unit: z.string().trim().min(1, { message: "Unit is required" }).max(50, { message: "Unit must be less than 50 characters" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format" })
});

// Workout validation schemas
export const exerciseSchema = z.object({
  name: z.string().trim().min(1, { message: "Exercise name is required" }).max(200, { message: "Exercise name must be less than 200 characters" }),
  weight: z.number().min(0, { message: "Weight must be positive" }).max(2000, { message: "Weight must be less than 2,000kg" }).optional(),
  reps: z.number().int().min(1, { message: "Reps must be at least 1" }).max(1000, { message: "Reps must be less than 1,000" }),
  sets: z.number().int().min(1, { message: "Sets must be at least 1" }).max(100, { message: "Sets must be less than 100" }),
  notes: z.string().max(1000, { message: "Notes must be less than 1,000 characters" }).optional()
});

export const workoutPlanSchema = z.object({
  name: z.string().trim().min(1, { message: "Plan name is required" }).max(200, { message: "Plan name must be less than 200 characters" }),
  type: z.string().trim().min(1, { message: "Type is required" }).max(100, { message: "Type must be less than 100 characters" }),
  description: z.string().max(1000, { message: "Description must be less than 1,000 characters" }).optional(),
  restTimer: z.number().int().min(0).max(600).optional()
});

export const personalRecordSchema = z.object({
  exerciseName: z.string().trim().min(1).max(200),
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(1).max(1000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
});

// Water intake validation
export const waterIntakeSchema = z.object({
  amount_ml: z.number().int().min(1, { message: "Amount must be at least 1ml" }).max(10000, { message: "Amount must be less than 10,000ml" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// User goals validation
export const userGoalsSchema = z.object({
  target_weight: z.number().min(20, { message: "Target weight must be at least 20kg" }).max(500, { message: "Target weight must be less than 500kg" }).optional(),
  daily_calorie_target: z.number().int().min(500).max(10000).optional(),
  daily_protein_target: z.number().int().min(10).max(1000).optional(),
  daily_water_target: z.number().int().min(100).max(10000).optional(),
  weekly_workout_frequency: z.number().int().min(0).max(21).optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});
