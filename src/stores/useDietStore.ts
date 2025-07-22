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
        try {
          // Use a food recognition API (example with Edamam or similar service)
          // For demonstration, we'll implement a more realistic food recognition
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Extract base64 data if it includes data URL prefix
          const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
          
          // Simulate various food recognition results based on common foods
          const foodDatabase = [
            { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4, sugar: 19, unit: 'medium apple' },
            { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3, sugar: 14, unit: 'medium banana' },
            { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, unit: '100g serving' },
            { name: 'Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, unit: '100g cooked' },
            { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.5, unit: '100g serving' },
            { name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 12, fiber: 0, sugar: 0, unit: '100g fillet' },
            { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0.7, unit: 'half avocado' },
            { name: 'Egg', calories: 70, protein: 6, carbs: 0.6, fat: 5, fiber: 0, sugar: 0.6, unit: 'large egg' },
            { name: 'Bread', calories: 79, protein: 2.7, carbs: 15, fat: 1, fiber: 0.8, sugar: 1.4, unit: '1 slice' },
            { name: 'Pasta', calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.8, unit: '100g cooked' }
          ];
          
          // Randomly select a food item to simulate recognition
          const randomFood = foodDatabase[Math.floor(Math.random() * foodDatabase.length)];
          
          return {
            id: '',
            name: randomFood.name,
            calories: randomFood.calories,
            protein: randomFood.protein,
            carbs: randomFood.carbs,
            fat: randomFood.fat,
            fiber: randomFood.fiber,
            sugar: randomFood.sugar,
            date: new Date().toISOString().split('T')[0],
            quantity: 1,
            unit: randomFood.unit
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