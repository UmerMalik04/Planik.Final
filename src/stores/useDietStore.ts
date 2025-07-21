import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  date: string;
  quantity: number;
  unit: string;
}

export interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  foods: FoodItem[];
}

interface DietStore {
  dailyNutrition: DailyNutrition[];
  addFood: (food: Omit<FoodItem, 'id'>) => void;
  removeFood: (foodId: string, date: string) => void;
  getDailyNutrition: (date: string) => DailyNutrition;
  scanFood: (imageData: string) => Promise<FoodItem | null>;
}

export const useDietStore = create<DietStore>()(
  persist(
    (set, get) => ({
      dailyNutrition: [],

      addFood: (food) => {
        const foodWithId: FoodItem = {
          ...food,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        };

        set((state) => {
          const existingDayIndex = state.dailyNutrition.findIndex(
            (day) => day.date === food.date
          );

          if (existingDayIndex >= 0) {
            const updatedDay = { ...state.dailyNutrition[existingDayIndex] };
            updatedDay.foods.push(foodWithId);
            updatedDay.totalCalories += food.calories;
            updatedDay.totalProtein += food.protein;
            updatedDay.totalCarbs += food.carbs;
            updatedDay.totalFat += food.fat;
            updatedDay.totalFiber += food.fiber;
            updatedDay.totalSugar += food.sugar;

            const newDailyNutrition = [...state.dailyNutrition];
            newDailyNutrition[existingDayIndex] = updatedDay;

            return { dailyNutrition: newDailyNutrition };
          } else {
            const newDay: DailyNutrition = {
              date: food.date,
              totalCalories: food.calories,
              totalProtein: food.protein,
              totalCarbs: food.carbs,
              totalFat: food.fat,
              totalFiber: food.fiber,
              totalSugar: food.sugar,
              foods: [foodWithId],
            };

            return {
              dailyNutrition: [...state.dailyNutrition, newDay],
            };
          }
        });
      },

      removeFood: (foodId, date) => {
        set((state) => {
          const dayIndex = state.dailyNutrition.findIndex((day) => day.date === date);
          if (dayIndex >= 0) {
            const updatedDay = { ...state.dailyNutrition[dayIndex] };
            const foodIndex = updatedDay.foods.findIndex((food) => food.id === foodId);
            
            if (foodIndex >= 0) {
              const removedFood = updatedDay.foods[foodIndex];
              updatedDay.foods.splice(foodIndex, 1);
              updatedDay.totalCalories -= removedFood.calories;
              updatedDay.totalProtein -= removedFood.protein;
              updatedDay.totalCarbs -= removedFood.carbs;
              updatedDay.totalFat -= removedFood.fat;
              updatedDay.totalFiber -= removedFood.fiber;
              updatedDay.totalSugar -= removedFood.sugar;

              const newDailyNutrition = [...state.dailyNutrition];
              newDailyNutrition[dayIndex] = updatedDay;

              return { dailyNutrition: newDailyNutrition };
            }
          }
          return state;
        });
      },

      getDailyNutrition: (date) => {
        const state = get();
        const dayData = state.dailyNutrition.find((day) => day.date === date);
        return dayData || {
          date,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          totalSugar: 0,
          foods: [],
        };
      },

      scanFood: async (imageData) => {
        // This would integrate with a food recognition API
        // For now, return mock data
        try {
          // Mock food recognition response
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
          
          return {
            id: '',
            name: 'Scanned Apple',
            calories: 95,
            protein: 0.5,
            carbs: 25,
            fat: 0.3,
            fiber: 4,
            sugar: 19,
            date: new Date().toISOString().split('T')[0],
            quantity: 1,
            unit: 'medium apple'
          };
        } catch (error) {
          console.error('Food scanning failed:', error);
          return null;
        }
      },
    }),
    {
      name: 'diet-storage',
    }
  )
);