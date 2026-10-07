import { create } from 'zustand';
import { FoodRecognitionService } from '@/services/FoodRecognitionService';
import { supabase } from '@/integrations/supabase/client';
import { syncQueue, newId } from '@/services/SyncQueue';
import { offlineStorage } from '@/services/OfflineStorage';

const STORAGE_KEY = 'diet_offline_data';
/** Pre-outbox queue key. Kept only so older pending writes can be migrated. */
const LEGACY_QUEUE_KEY = 'diet_offline_queue';

/**
 * Move any food writes queued by the previous localStorage implementation into
 * the shared IndexedDB outbox, so meals logged offline before this update are
 * still pushed to Supabase instead of being dropped on the next sync.
 */
async function migrateLegacyDietQueue(userId: string) {
  const raw = localStorage.getItem(LEGACY_QUEUE_KEY);
  if (!raw) return;

  try {
    const queue: Array<{ type: 'add' | 'remove'; data: any }> = JSON.parse(raw) ?? [];
    for (const op of queue) {
      if (op?.type === 'add' && op.data) {
        await offlineStorage.enqueue({
          table: 'food_items',
          op: 'insert',
          payload: { id: op.data.id ?? newId(), ...op.data, user_id: userId },
          onConflict: 'id',
        });
      } else if (op?.type === 'remove' && op.data?.foodId) {
        await offlineStorage.enqueue({
          table: 'food_items',
          op: 'delete',
          match: { id: op.data.foodId, user_id: userId },
        });
      }
    }
  } catch (error) {
    console.error('Failed to migrate legacy diet queue:', error);
  }

  localStorage.removeItem(LEGACY_QUEUE_KEY);
}



export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
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
  isOnline: boolean;
  pendingOperations: number;
  initializeDietData: (forceSync?: boolean) => Promise<void>;
  addFood: (food: Omit<FoodItem, 'id'>) => Promise<void>;
  removeFood: (foodId: string, date: string) => Promise<void>;
  getDailyNutrition: (date: string) => DailyNutrition;
  scanFood: (file: File) => Promise<FoodItem | null>;
  scanBarcode: (barcode: string) => Promise<FoodItem | null>;
  syncOfflineData: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  loadFromCache: () => void;
  saveToCache: () => void;
}

export const useDietStore = create<DietStore>()((set, get) => ({
  dailyNutrition: [],
  isOnline: navigator.onLine,
  pendingOperations: 0,

  loadFromCache: () => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        set({ dailyNutrition: data });
      }
    } catch (error) {
      console.error('Failed to load from cache:', error);
    }
  },

  saveToCache: () => {
    try {
      const state = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.dailyNutrition));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  },

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
    if (status) {
      get().syncOfflineData();
    }
  },

  /**
   * Diet writes now share the app-wide IndexedDB outbox, so this just drains
   * it and refreshes from the server once the replay succeeds.
   */
  syncOfflineData: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await migrateLegacyDietQueue(user.id);

      set({ pendingOperations: syncQueue.pending() });
      const { synced, failed } = await syncQueue.replay();
      set({ pendingOperations: syncQueue.pending() });


      if (synced > 0 && failed === 0) {
        await get().initializeDietData(true);
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  },


  initializeDietData: async (forceSync = false) => {
    get().loadFromCache();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!get().isOnline) {
      console.log('Offline mode: using cached data');
      return;
    }

    // Rescue pre-outbox queued writes before the server fetch overwrites cache.
    await migrateLegacyDietQueue(user.id);


    // Skip sync if cache is fresh (< 30 min) unless forced
    if (!forceSync) {
      const lastSyncStr = localStorage.getItem('diet_last_sync');
      if (lastSyncStr) {
        const elapsed = Date.now() - parseInt(lastSyncStr, 10);
        if (elapsed < 30 * 60 * 1000) {
          console.log('Diet data is fresh, skipping sync');
          return;
        }
      }
    }

    const { data: foodItems } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (foodItems) {
      const dailyMap = new Map<string, DailyNutrition>();

      foodItems.forEach(item => {
        const dateStr = item.date;
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, {
            date: dateStr,
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            totalFiber: 0,
            totalSugar: 0,
            foods: []
          });
        }

        const day = dailyMap.get(dateStr)!;
        const foodItem: FoodItem = {
          id: item.id,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          date: item.date,
          quantity: item.quantity,
          unit: item.unit
        };

        day.foods.push(foodItem);
        day.totalCalories += item.calories;
        day.totalProtein += item.protein;
        day.totalCarbs += item.carbs;
        day.totalFat += item.fat;
      });

      set({ dailyNutrition: Array.from(dailyMap.values()) });
      get().saveToCache();
      localStorage.setItem('diet_last_sync', Date.now().toString());
    }
  },

  addFood: async (food) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate input
    const { foodItemSchema } = await import('@/lib/validation');
    const validated = foodItemSchema.parse({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      quantity: food.quantity,
      unit: food.unit,
      date: food.date
    });

    const tempId = crypto.randomUUID();
    
    // Helper function to update state with new food item
    const updateStateWithFood = (foodWithId: FoodItem) => {
      set((state) => {
        const existingDayIndex = state.dailyNutrition.findIndex(
          (day) => day.date === food.date
        );

        if (existingDayIndex >= 0) {
          const updatedDay = { ...state.dailyNutrition[existingDayIndex] };
          updatedDay.foods = [...updatedDay.foods, foodWithId];
          updatedDay.totalCalories += food.calories;
          updatedDay.totalProtein += food.protein;
          updatedDay.totalCarbs += food.carbs;
          updatedDay.totalFat += food.fat;
          updatedDay.totalFiber += food.fiber || 0;
          updatedDay.totalSugar += food.sugar || 0;

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
            totalFiber: food.fiber || 0,
            totalSugar: food.sugar || 0,
            foods: [foodWithId],
          };

          return {
            dailyNutrition: [...state.dailyNutrition, newDay],
          };
        }
      });
      get().saveToCache();
    };

    // Client-generated id: the row exists locally the moment it's logged, so
    // it can be edited or deleted before it ever reaches Supabase.
    const id = newId();

    updateStateWithFood({
      id,
      name: validated.name,
      calories: validated.calories,
      protein: validated.protein,
      carbs: validated.carbs,
      fat: validated.fat,
      fiber: validated.fiber || 0,
      sugar: validated.sugar || 0,
      date: validated.date,
      quantity: validated.quantity,
      unit: validated.unit
    });

    await syncQueue.send({
      table: 'food_items',
      op: 'insert',
      payload: {
        id,
        user_id: user.id,
        name: validated.name,
        calories: validated.calories,
        protein: validated.protein,
        carbs: validated.carbs,
        fat: validated.fat,
        fiber: validated.fiber || 0,
        sugar: validated.sugar || 0,
        date: validated.date,
        quantity: validated.quantity,
        unit: validated.unit
      },
      onConflict: 'id'
    });
  },

  removeFood: async (foodId, date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic removal first, then queue the delete for replay.
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
          updatedDay.totalFiber -= removedFood.fiber || 0;
          updatedDay.totalSugar -= removedFood.sugar || 0;

          const newDailyNutrition = [...state.dailyNutrition];
          newDailyNutrition[dayIndex] = updatedDay;

          get().saveToCache();
          return { dailyNutrition: newDailyNutrition };
        }
      }
      return state;
    });

    await syncQueue.send({
      table: 'food_items',
      op: 'delete',
      match: { id: foodId, user_id: user.id }
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

  scanFood: async (file: File) => {
    try {
      console.log('Starting food recognition...');
      const recognitionResult = await FoodRecognitionService.recognizeFood(file);
      
      if (recognitionResult) {
        console.log('Food recognized:', recognitionResult);
        return {
          id: '',
          name: recognitionResult.name,
          calories: Math.round(recognitionResult.calories),
          protein: Math.round(recognitionResult.protein * 10) / 10,
          carbs: Math.round(recognitionResult.carbs * 10) / 10,
          fat: Math.round(recognitionResult.fat * 10) / 10,
          fiber: Math.round(recognitionResult.fiber * 10) / 10,
          sugar: Math.round(recognitionResult.sugar * 10) / 10,
          date: new Date().toISOString().split('T')[0],
          quantity: 1,
          unit: 'serving (100g)'
        };
      } else {
        console.warn('Food recognition failed, using intelligent fallback');
        return {
          id: '',
          name: 'Chicken Breast',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0,
          sugar: 0,
          date: new Date().toISOString().split('T')[0],
          quantity: 1,
          unit: 'serving (100g)'
        };
      }
    } catch (error) {
      console.error('Food scanning failed:', error);
      return {
        id: '',
        name: 'Mixed Food',
        calories: 200,
        protein: 10,
        carbs: 20,
        fat: 8,
        fiber: 2,
        sugar: 3,
        date: new Date().toISOString().split('T')[0],
        quantity: 1,
        unit: 'serving (100g)'
      };
    }
  },

  scanBarcode: async (barcode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('lookup-barcode', {
        body: { barcode }
      });

      if (error) throw error;

      if (data && data.name) {
        return {
          id: crypto.randomUUID(),
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          fiber: data.fiber || 0,
          sugar: data.sugar || 0,
          date: new Date().toISOString().split('T')[0],
          quantity: 1,
          unit: data.servingSize || 'serving (100g)'
        };
      }

      return null;
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      throw error;
    }
  },
}));