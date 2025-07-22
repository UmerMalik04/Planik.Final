import { pipeline } from '@huggingface/transformers';

interface FoodRecognitionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  confidence: number;
}

// Nutritional database for common foods (per 100g)
const FOOD_NUTRITION_DB: { [key: string]: Omit<FoodRecognitionResult, 'name' | 'confidence'> } = {
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12 },
  'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.5 },
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5 },
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1 },
  'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5 },
  'cheese': { calories: 113, protein: 7, carbs: 1, fat: 9, fiber: 0, sugar: 1 },
  'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.6 },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugar: 0.8 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6 },
  'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4 },
  'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0.7 },
  'nuts': { calories: 607, protein: 20, carbs: 16, fat: 54, fiber: 8, sugar: 4 },
  'fish': { calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0, sugar: 0 }
};

export class FoodRecognitionService {
  private static classifier: any = null;

  private static async initializeClassifier() {
    if (!this.classifier) {
      console.log('Initializing food recognition model...');
      try {
        this.classifier = await pipeline(
          'image-classification',
          'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k',
          { device: 'webgpu' }
        );
        console.log('Food recognition model initialized');
      } catch (error) {
        console.warn('WebGPU not available, falling back to CPU');
        this.classifier = await pipeline(
          'image-classification',
          'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k'
        );
      }
    }
    return this.classifier;
  }

  private static mapImageClassToFood(classification: string): string {
    const lowerClass = classification.toLowerCase();
    
    // Map common image classifications to food items
    const mappings: { [key: string]: string } = {
      'granny smith': 'apple',
      'orange': 'orange',
      'lemon': 'orange',
      'banana': 'banana',
      'broccoli': 'broccoli',
      'corn': 'rice',
      'bagel': 'bread',
      'pizza': 'bread',
      'french loaf': 'bread',
      'pretzel': 'bread',
      'carbonara': 'pasta',
      'mushroom': 'broccoli',
      'bell pepper': 'tomato',
      'cucumber': 'carrot',
      'meat loaf': 'chicken breast',
      'fried egg': 'egg',
      'scrambled eggs': 'egg',
      'consomme': 'chicken breast',
      'guacamole': 'avocado',
      'burrito': 'rice',
      'taco': 'rice',
      'hot dog': 'chicken breast',
      'cheeseburger': 'chicken breast',
      'mashed potato': 'potato',
      'french fries': 'potato',
      'baked potato': 'potato',
      'ice cream': 'milk',
      'chocolate sauce': 'nuts',
      'peanut butter': 'nuts'
    };

    // Look for direct matches first
    for (const [pattern, food] of Object.entries(mappings)) {
      if (lowerClass.includes(pattern)) {
        return food;
      }
    }

    // Look for partial matches in our nutrition database
    for (const foodKey of Object.keys(FOOD_NUTRITION_DB)) {
      if (lowerClass.includes(foodKey) || foodKey.includes(lowerClass.split(' ')[0])) {
        return foodKey;
      }
    }

    // Default fallback based on common food words
    if (lowerClass.includes('meat') || lowerClass.includes('chicken') || lowerClass.includes('beef')) {
      return 'chicken breast';
    }
    if (lowerClass.includes('fish') || lowerClass.includes('salmon') || lowerClass.includes('tuna')) {
      return 'fish';
    }
    if (lowerClass.includes('fruit')) {
      return 'apple';
    }
    if (lowerClass.includes('vegetable') || lowerClass.includes('green')) {
      return 'broccoli';
    }

    // Ultimate fallback
    return 'apple';
  }

  public static async recognizeFood(imageData: string): Promise<FoodRecognitionResult | null> {
    try {
      console.log('Starting food recognition...');
      const classifier = await this.initializeClassifier();
      
      // Convert base64 to image URL if needed
      const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
      
      console.log('Classifying image...');
      const results = await classifier(imageUrl);
      
      if (!results || results.length === 0) {
        console.error('No classification results received');
        return null;
      }

      console.log('Classification results:', results);
      
      // Get the top result
      const topResult = results[0];
      const mappedFood = this.mapImageClassToFood(topResult.label);
      const nutritionData = FOOD_NUTRITION_DB[mappedFood] || FOOD_NUTRITION_DB['apple'];

      const recognitionResult: FoodRecognitionResult = {
        name: this.formatFoodName(mappedFood),
        confidence: topResult.score,
        ...nutritionData
      };

      console.log('Food recognition result:', recognitionResult);
      return recognitionResult;
      
    } catch (error) {
      console.error('Error in food recognition:', error);
      return null;
    }
  }

  private static formatFoodName(foodKey: string): string {
    return foodKey
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}