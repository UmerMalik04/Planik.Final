import { supabase } from '@/integrations/supabase/client';

export interface FoodItem {
  name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export class FoodRecognitionService {
  private static SPOONACULAR_API_BASE = 'https://api.spoonacular.com';
  
  static async getApiKey(): Promise<string | null> {
    // For now, just use localStorage - can be enhanced with Supabase secrets later
    return localStorage.getItem('spoonacular_api_key');
  }

  static async recognizeFood(imageFile: File): Promise<FoodItem> {
    try {
      console.log('Starting food recognition with AI...');
      
      // Check file size (limit to 2MB for faster processing)
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      if (imageFile.size > MAX_SIZE) {
        console.log('Compressing large image...');
        imageFile = await this.compressImage(imageFile, MAX_SIZE);
      }
      
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Call the edge function for AI recognition with authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to use food recognition');
      }

      console.log('Sending request to AI...');
      const { data, error } = await supabase.functions.invoke('recognize-food', {
        body: { imageBase64: base64Image }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('AI Response:', data);
      
      // Return the data or fallback
      if (data && data.name && data.calories) {
        return {
          name: data.name,
          confidence: data.confidence || 0.5,
          calories: data.calories,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          fiber: data.fiber || 0,
          sugar: data.sugar || 0
        };
      }
      
      return data.fallback || this.getFallbackFood();
    } catch (error) {
      console.error('Error recognizing food:', error);
      return this.getFallbackFood();
    }
  }

  private static async compressImage(file: File, maxSize: number): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (max 800px width/height)
          const maxDim = 800;
          if (width > height && width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  static async recognizeWithSpoonacular(imageFile: File, apiKey: string): Promise<FoodItem> {
    const base64Image = await this.fileToBase64(imageFile);
    
    const response = await fetch(`${this.SPOONACULAR_API_BASE}/food/images/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Image.split(',')[1],
        apiKey: apiKey
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.category && result.probability > 0.4) {
      const nutritionInfo = await this.getNutritionInfo(result.category, apiKey);
      
      return {
        name: this.formatFoodName(result.category),
        confidence: result.probability,
        calories: nutritionInfo.calories || 150,
        protein: nutritionInfo.protein || 8,
        carbs: nutritionInfo.carbs || 20,
        fat: nutritionInfo.fat || 5,
        fiber: nutritionInfo.fiber || 3,
        sugar: nutritionInfo.sugar || 5
      };
    }
    
    throw new Error('Low confidence result');
  }

  static async getNutritionInfo(foodName: string, apiKey: string): Promise<Partial<FoodItem>> {
    try {
      const response = await fetch(
        `${this.SPOONACULAR_API_BASE}/food/ingredients/search?query=${encodeURIComponent(foodName)}&number=1&apiKey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Nutrition API request failed: ${response.status}`);
      }
      
      const searchResult = await response.json();
      
      if (searchResult.results && searchResult.results.length > 0) {
        const ingredient = searchResult.results[0];
        
        // Get detailed nutrition info
        const nutritionResponse = await fetch(
          `${this.SPOONACULAR_API_BASE}/food/ingredients/${ingredient.id}/information?amount=100&unit=grams&apiKey=${apiKey}`
        );
        
        if (nutritionResponse.ok) {
          const nutritionData = await nutritionResponse.json();
          const nutrients = nutritionData.nutrition?.nutrients || [];
          
          return {
            calories: this.findNutrient(nutrients, 'Calories') || 100,
            protein: this.findNutrient(nutrients, 'Protein') || 5,
            carbs: this.findNutrient(nutrients, 'Carbohydrates') || 15,
            fat: this.findNutrient(nutrients, 'Fat') || 3,
            fiber: this.findNutrient(nutrients, 'Fiber') || 2,
            sugar: this.findNutrient(nutrients, 'Sugar') || 5
          };
        }
      }
      
      return this.getDefaultNutrition();
    } catch (error) {
      console.error('Error getting nutrition info:', error);
      return this.getDefaultNutrition();
    }
  }

  static findNutrient(nutrients: any[], name: string): number {
    const nutrient = nutrients.find((n: any) => 
      n.name.toLowerCase().includes(name.toLowerCase())
    );
    return nutrient ? Math.round(nutrient.amount) : 0;
  }

  static formatFoodName(category: string): string {
    // Convert API category to readable name
    const categoryMap: Record<string, string> = {
      'fruit': 'Fresh Fruit',
      'vegetable': 'Fresh Vegetable', 
      'meat': 'Meat',
      'dairy': 'Dairy Product',
      'grain': 'Grain',
      'snack': 'Snack',
      'dessert': 'Dessert',
      'beverage': 'Beverage',
      'seafood': 'Seafood',
      'pasta': 'Pasta',
      'pizza': 'Pizza',
      'salad': 'Salad',
      'soup': 'Soup',
      'sandwich': 'Sandwich',
      'breakfast': 'Breakfast Food',
      'fast food': 'Fast Food',
      'bread': 'Bread',
      'cheese': 'Cheese',
      'egg': 'Egg',
      'nuts': 'Nuts',
      'rice': 'Rice',
      'chicken': 'Chicken',
      'beef': 'Beef',
      'pork': 'Pork',
      'fish': 'Fish'
    };

    return categoryMap[category.toLowerCase()] || 
           category.charAt(0).toUpperCase() + category.slice(1);
  }

  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static getDefaultNutrition(): Partial<FoodItem> {
    return {
      calories: 120,
      protein: 6,
      carbs: 18,
      fat: 4,
      fiber: 2,
      sugar: 8
    };
  }

  static async analyzeImageVisually(imageFile: File): Promise<FoodItem> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 100;
        canvas.height = 100;
        ctx?.drawImage(img, 0, 0, 100, 100);
        
        const imageData = ctx?.getImageData(0, 0, 100, 100);
        if (!imageData) {
          resolve(this.getFallbackFood());
          return;
        }
        
        const colors = this.analyzeColors(imageData);
        const foodResult = this.identifyFoodByColors(colors);
        
        console.log('Visual analysis result:', foodResult);
        resolve(foodResult);
      };
      
      img.onerror = () => {
        resolve(this.getFallbackFood());
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  static analyzeColors(imageData: ImageData): { red: number; green: number; blue: number; dominant: string } {
    const data = imageData.data;
    let totalR = 0, totalG = 0, totalB = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
    }
    
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    
    let dominant = 'unknown';
    if (avgR > avgG && avgR > avgB) dominant = 'red';
    else if (avgG > avgR && avgG > avgB) dominant = 'green';
    else if (avgB > avgR && avgB > avgG) dominant = 'blue';
    else if (avgR > 150 && avgG > 150 && avgB < 100) dominant = 'yellow';
    else if (avgR > 100 && avgG < 80 && avgB < 80) dominant = 'orange';
    
    return { red: avgR, green: avgG, blue: avgB, dominant };
  }

  static identifyFoodByColors(colors: { red: number; green: number; blue: number; dominant: string }): FoodItem {
    const { red, green, blue, dominant } = colors;
    
    // Red foods
    if (dominant === 'red' && red > 120 && green < 80) {
      if (red > 150 && green < 60) {
        return { name: 'Fresh Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, confidence: 0.85 };
      }
      return { name: 'Strawberry', calories: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2, sugar: 5, confidence: 0.8 };
    }
    
    // Orange/Yellow foods
    if (dominant === 'orange' || (red > 200 && green > 150 && blue < 50)) {
      if (red > 220 && green > 180 && blue < 40) {
        return { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, confidence: 0.9 };
      }
      return { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9, confidence: 0.85 };
    }
    
    // Green foods
    if (dominant === 'green' && green > 80) {
      if (green > 120 && red < 70 && blue < 70) {
        return { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.5, confidence: 0.8 };
      }
      return { name: 'Fresh Salad', calories: 20, protein: 1.5, carbs: 4, fat: 0.2, fiber: 2, sugar: 2, confidence: 0.75 };
    }
    
    // Brown/beige foods (grains, meat)
    if (red > 100 && green > 80 && blue > 60 && red < 180) {
      if (red > 140 && green > 100 && blue < 80) {
        return { name: 'Grilled Chicken', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, confidence: 0.8 };
      }
      return { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0.4, confidence: 0.75 };
    }
    
    // White/light foods
    if (red > 200 && green > 200 && blue > 200) {
      return { name: 'Bread', calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5, confidence: 0.7 };
    }
    
    // Default
    return this.getFallbackFood();
  }

  static getFallbackFood(): FoodItem {
    return {
      name: 'Food Item', 
      calories: 150, 
      protein: 8, 
      carbs: 20, 
      fat: 5, 
      fiber: 3, 
      sugar: 6, 
      confidence: 0.5
    };
  }
}