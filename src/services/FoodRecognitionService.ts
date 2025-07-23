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

// Comprehensive nutritional database for foods (per 100g)
const FOOD_NUTRITION_DB: { [key: string]: Omit<FoodRecognitionResult, 'name' | 'confidence'> } = {
  // Fruits
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12 },
  'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9 },
  'lemon': { calories: 29, protein: 1.1, carbs: 9, fat: 0.3, fiber: 2.8, sugar: 2.5 },
  'strawberry': { calories: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2, sugar: 4.9 },
  'blueberry': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, sugar: 10 },
  'grapes': { calories: 62, protein: 0.6, carbs: 16, fat: 0.2, fiber: 0.9, sugar: 16 },
  'pineapple': { calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4, sugar: 10 },
  'mango': { calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugar: 14 },
  'watermelon': { calories: 30, protein: 0.6, carbs: 8, fat: 0.2, fiber: 0.4, sugar: 6 },

  // Vegetables
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.5 },
  'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6 },
  'bell pepper': { calories: 31, protein: 1, carbs: 7, fat: 0.3, fiber: 2.5, sugar: 4.2 },
  'cucumber': { calories: 16, protein: 0.7, carbs: 4, fat: 0.1, fiber: 0.5, sugar: 1.7 },
  'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, sugar: 0.8 },
  'onion': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1, fiber: 1.7, sugar: 4.2 },
  'garlic': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sugar: 1 },
  'mushroom': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, sugar: 2 },

  // Proteins - Meat
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 },
  'fried chicken': { calories: 320, protein: 19, carbs: 8, fat: 24, fiber: 0.5, sugar: 0.2 },
  'chicken thigh': { calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0, sugar: 0 },
  'beef': { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sugar: 0 },
  'pork': { calories: 242, protein: 27, carbs: 0, fat: 14, fiber: 0, sugar: 0 },
  'bacon': { calories: 541, protein: 37, carbs: 1.4, fat: 42, fiber: 0, sugar: 0 },
  'sausage': { calories: 301, protein: 12, carbs: 4, fat: 27, fiber: 0, sugar: 1 },
  'turkey': { calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, sugar: 0 },
  'ham': { calories: 145, protein: 21, carbs: 1.5, fat: 5.5, fiber: 0, sugar: 1.4 },

  // Proteins - Seafood
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0 },
  'tuna': { calories: 132, protein: 28, carbs: 0, fat: 1, fiber: 0, sugar: 0 },
  'shrimp': { calories: 99, protein: 18, carbs: 0.9, fat: 1.4, fiber: 0, sugar: 0 },
  'cod': { calories: 82, protein: 18, carbs: 0, fat: 0.7, fiber: 0, sugar: 0 },
  'fish': { calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0, sugar: 0 },

  // Dairy & Eggs
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1 },
  'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5 },
  'cheese': { calories: 113, protein: 7, carbs: 1, fat: 9, fiber: 0, sugar: 1 },
  'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2 },
  'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sugar: 0.1 },
  'cream cheese': { calories: 342, protein: 6, carbs: 4, fat: 34, fiber: 0, sugar: 3 },

  // Grains & Starches
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1 },
  'brown rice': { calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0.4 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.6 },
  'spaghetti': { calories: 158, protein: 6, carbs: 31, fat: 0.9, fiber: 1.8, sugar: 0.6 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5 },
  'white bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5 },
  'whole wheat bread': { calories: 247, protein: 13, carbs: 41, fat: 4.2, fiber: 6, sugar: 6 },
  'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10, sugar: 1 },
  'quinoa': { calories: 120, protein: 4.4, carbs: 22, fat: 1.9, fiber: 2.8, sugar: 0.9 },

  // Potatoes & Tubers
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugar: 0.8 },
  'french fries': { calories: 365, protein: 4, carbs: 63, fat: 11, fiber: 4, sugar: 0.3 },
  'mashed potato': { calories: 87, protein: 1.6, carbs: 18, fat: 1.2, fiber: 1.5, sugar: 1.6 },
  'baked potato': { calories: 93, protein: 2.5, carbs: 21, fat: 0.1, fiber: 2.1, sugar: 1.2 },
  'sweet potato': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2 },

  // Nuts & Seeds
  'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sugar: 4.4 },
  'walnuts': { calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 7, sugar: 2.6 },
  'peanuts': { calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5, sugar: 4.7 },
  'nuts': { calories: 607, protein: 20, carbs: 16, fat: 54, fiber: 8, sugar: 4 },
  'seeds': { calories: 559, protein: 19, carbs: 20, fat: 49, fiber: 12, sugar: 2 },

  // Prepared Foods & Meals
  'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2.3, sugar: 3.6 },
  'burger': { calories: 540, protein: 25, carbs: 40, fat: 31, fiber: 3, sugar: 6 },
  'sandwich': { calories: 200, protein: 10, carbs: 25, fat: 8, fiber: 2, sugar: 3 },
  'salad': { calories: 20, protein: 1.5, carbs: 4, fat: 0.2, fiber: 2, sugar: 2 },
  'soup': { calories: 50, protein: 3, carbs: 8, fat: 1, fiber: 1.5, sugar: 3 },
  'stir fry': { calories: 150, protein: 8, carbs: 15, fat: 7, fiber: 3, sugar: 5 },
  'fried rice': { calories: 163, protein: 5.5, carbs: 20, fat: 6.9, fiber: 0.8, sugar: 1.1 },
  'noodles': { calories: 138, protein: 4.5, carbs: 25, fat: 2.1, fiber: 1.2, sugar: 0.6 },

  // Snacks & Others
  'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0.7 },
  'ice cream': { calories: 207, protein: 3.5, carbs: 24, fat: 11, fiber: 0.7, sugar: 21 },
  'chocolate': { calories: 546, protein: 4.9, carbs: 61, fat: 31, fiber: 7, sugar: 48 },
  'cake': { calories: 257, protein: 4, carbs: 46, fat: 7, fiber: 1.4, sugar: 35 },
  'cookies': { calories: 502, protein: 5.9, carbs: 64, fat: 25, fiber: 2.4, sugar: 39 }
};

export class FoodRecognitionService {
  private static classifier: any = null;

  private static async initializeClassifier() {
    if (!this.classifier) {
      console.log('Initializing enhanced food recognition model...');
      try {
        // Try WebGPU first for better performance
        this.classifier = await pipeline(
          'image-classification',
          'google/vit-base-patch16-224',
          { device: 'webgpu' }
        );
        console.log('Food recognition model initialized with WebGPU');
      } catch (error) {
        console.warn('WebGPU not available, trying CPU with food-specific model');
        try {
          // Fallback to a food-specific model
          this.classifier = await pipeline(
            'image-classification',
            'nateraw/food',
            { device: 'cpu' }
          );
          console.log('Food-specific model initialized');
        } catch (error2) {
          console.warn('Food-specific model failed, using general model');
          this.classifier = await pipeline(
            'image-classification',
            'microsoft/resnet-50'
          );
          console.log('General classification model initialized');
        }
      }
    }
    return this.classifier;
  }

  private static mapImageClassToFood(classification: string): string {
    const lowerClass = classification.toLowerCase();
    
    // Enhanced food mappings for better recognition
    const mappings: { [key: string]: string } = {
      // Fruits
      'granny smith': 'apple',
      'apple': 'apple',
      'orange': 'orange',
      'lemon': 'lemon',
      'banana': 'banana',
      'strawberry': 'strawberry',
      'blueberry': 'blueberry',
      'grape': 'grapes',
      'pineapple': 'pineapple',
      'mango': 'mango',
      'watermelon': 'watermelon',

      // Vegetables
      'broccoli': 'broccoli',
      'carrot': 'carrot',
      'spinach': 'spinach',
      'tomato': 'tomato',
      'bell pepper': 'bell pepper',
      'cucumber': 'cucumber',
      'lettuce': 'lettuce',
      'onion': 'onion',
      'mushroom': 'mushroom',

      // Proteins
      'fried chicken': 'fried chicken',
      'chicken': 'chicken breast',
      'roasted chicken': 'fried chicken',
      'chicken wing': 'fried chicken',
      'beef': 'beef',
      'steak': 'beef',
      'pork': 'pork',
      'bacon': 'bacon',
      'sausage': 'sausage',
      'turkey': 'turkey',
      'ham': 'ham',
      'salmon': 'salmon',
      'tuna': 'tuna',
      'shrimp': 'shrimp',
      'fish': 'fish',

      // Dairy & Eggs
      'egg': 'egg',
      'fried egg': 'egg',
      'scrambled eggs': 'egg',
      'milk': 'milk',
      'cheese': 'cheese',
      'yogurt': 'yogurt',

      // Grains & Starches
      'rice': 'rice',
      'fried rice': 'fried rice',
      'pasta': 'pasta',
      'spaghetti': 'spaghetti',
      'noodles': 'noodles',
      'bread': 'bread',
      'bagel': 'bread',
      'french loaf': 'bread',
      'pretzel': 'bread',
      'oats': 'oats',
      'quinoa': 'quinoa',

      // Potatoes
      'potato': 'potato',
      'french fries': 'french fries',
      'fries': 'french fries',
      'mashed potato': 'mashed potato',
      'baked potato': 'baked potato',
      'sweet potato': 'sweet potato',

      // Prepared Foods
      'pizza': 'pizza',
      'burger': 'burger',
      'hamburger': 'burger',
      'cheeseburger': 'burger',
      'sandwich': 'sandwich',
      'salad': 'salad',
      'soup': 'soup',
      'stir fry': 'stir fry',

      // Nuts & Others
      'avocado': 'avocado',
      'guacamole': 'avocado',
      'almond': 'almonds',
      'walnut': 'walnuts',
      'peanut': 'peanuts',
      'ice cream': 'ice cream',
      'chocolate': 'chocolate',
      'cake': 'cake',
      'cookie': 'cookies'
    };

    // Look for direct matches first (case-insensitive)
    for (const [pattern, food] of Object.entries(mappings)) {
      if (lowerClass.includes(pattern.toLowerCase())) {
        return food;
      }
    }

    // Look for partial matches in our nutrition database
    for (const foodKey of Object.keys(FOOD_NUTRITION_DB)) {
      const foodWords = foodKey.split(' ');
      const classWords = lowerClass.split(' ');
      
      // Check if any word in the classification matches any word in the food key
      for (const foodWord of foodWords) {
        for (const classWord of classWords) {
          if (foodWord.includes(classWord) || classWord.includes(foodWord)) {
            if (classWord.length > 3) { // Avoid matching very short words
              return foodKey;
            }
          }
        }
      }
    }

    // Enhanced fallback logic
    if (lowerClass.includes('meat') || lowerClass.includes('chicken') || lowerClass.includes('poultry')) {
      return 'chicken breast';
    }
    if (lowerClass.includes('beef') || lowerClass.includes('steak') || lowerClass.includes('cow')) {
      return 'beef';
    }
    if (lowerClass.includes('pork') || lowerClass.includes('pig') || lowerClass.includes('ham')) {
      return 'pork';
    }
    if (lowerClass.includes('fish') || lowerClass.includes('salmon') || lowerClass.includes('tuna') || lowerClass.includes('seafood')) {
      return 'fish';
    }
    if (lowerClass.includes('fried') && lowerClass.includes('potato')) {
      return 'french fries';
    }
    if (lowerClass.includes('fried') && (lowerClass.includes('chicken') || lowerClass.includes('meat'))) {
      return 'fried chicken';
    }
    if (lowerClass.includes('pasta') || lowerClass.includes('spaghetti') || lowerClass.includes('noodle')) {
      return 'pasta';
    }
    if (lowerClass.includes('bread') || lowerClass.includes('toast') || lowerClass.includes('loaf')) {
      return 'bread';
    }
    if (lowerClass.includes('fruit') || lowerClass.includes('berry')) {
      return 'apple';
    }
    if (lowerClass.includes('vegetable') || lowerClass.includes('green') || lowerClass.includes('salad')) {
      return 'broccoli';
    }
    if (lowerClass.includes('rice') || lowerClass.includes('grain')) {
      return 'rice';
    }
    if (lowerClass.includes('potato')) {
      return 'potato';
    }
    if (lowerClass.includes('cheese') || lowerClass.includes('dairy')) {
      return 'cheese';
    }
    if (lowerClass.includes('egg')) {
      return 'egg';
    }

    // Ultimate fallback
    return 'bread';
  }

  public static async recognizeFood(imageData: string): Promise<FoodRecognitionResult | null> {
    try {
      console.log('Starting enhanced food recognition...');
      const classifier = await this.initializeClassifier();
      
      // Convert base64 to image URL if needed
      const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
      
      console.log('Classifying image with enhanced model...');
      const results = await classifier(imageUrl, { top_k: 5 }); // Get top 5 results
      
      if (!results || results.length === 0) {
        console.error('No classification results received');
        return null;
      }

      console.log('Classification results:', results);
      
      // Try to find the best food match from top results
      let bestMatch = null;
      let bestScore = 0;
      
      for (const result of results) {
        const mappedFood = this.mapImageClassToFood(result.label);
        if (FOOD_NUTRITION_DB[mappedFood] && result.score > bestScore) {
          bestMatch = {
            food: mappedFood,
            score: result.score,
            originalLabel: result.label
          };
          bestScore = result.score;
        }
      }
      
      // Use the best match or fallback to first result
      const finalFood = bestMatch ? bestMatch.food : this.mapImageClassToFood(results[0].label);
      const finalScore = bestMatch ? bestMatch.score : results[0].score;
      const nutritionData = FOOD_NUTRITION_DB[finalFood] || FOOD_NUTRITION_DB['bread'];

      const recognitionResult: FoodRecognitionResult = {
        name: this.formatFoodName(finalFood),
        confidence: finalScore,
        ...nutritionData
      };

      console.log('Enhanced food recognition result:', recognitionResult);
      return recognitionResult;
      
    } catch (error) {
      console.error('Error in enhanced food recognition:', error);
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