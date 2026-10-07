import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();
    
    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "Barcode is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Looking up barcode:", barcode);

    // Call OpenFoodFacts API (free and comprehensive)
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 0 || !data.product) {
      return new Response(
        JSON.stringify({
          error: "Product not found",
          barcode: barcode
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    console.log("Raw product data:", {
      name: product.product_name,
      serving_size: product.serving_size,
      serving_quantity: product.serving_quantity,
      nutrition_data_per: product.nutrition_data_per,
      nutriments_serving: {
        energy: nutriments["energy-kcal_serving"],
        protein: nutriments.proteins_serving,
        carbs: nutriments.carbohydrates_serving,
        fat: nutriments.fat_serving
      },
      nutriments_100g: {
        energy: nutriments["energy-kcal_100g"],
        protein: nutriments.proteins_100g,
        carbs: nutriments.carbohydrates_100g,
        fat: nutriments.fat_100g
      }
    });

    // Determine serving size in grams
    let servingGrams = 100; // default fallback
    let servingDescription = "100g";
    
    // Try to get actual serving size from product data
    if (product.serving_quantity && product.serving_quantity > 0) {
      servingGrams = product.serving_quantity;
      servingDescription = product.serving_size || `${servingGrams}g`;
    } else if (product.serving_size) {
      // Try to parse serving size string (e.g., "20g", "1 bar (40g)")
      const gramsMatch = product.serving_size.match(/(\d+(?:\.\d+)?)\s*g/i);
      if (gramsMatch) {
        servingGrams = parseFloat(gramsMatch[1]);
        servingDescription = product.serving_size;
      }
    }

    // Use per-serving data if available (more accurate), otherwise calculate from per 100g
    let calories: number;
    let protein: number;
    let carbs: number;
    let fat: number;
    let fiber: number;
    let sugar: number;

    // Check if per-serving data is available
    const hasServingData = nutriments["energy-kcal_serving"] !== undefined || 
                           nutriments.proteins_serving !== undefined;

    if (hasServingData) {
      // Use per-serving data directly (most accurate)
      calories = Math.round(nutriments["energy-kcal_serving"] || nutriments.energy_serving || 0);
      protein = parseFloat((nutriments.proteins_serving || 0).toFixed(1));
      carbs = parseFloat((nutriments.carbohydrates_serving || 0).toFixed(1));
      fat = parseFloat((nutriments.fat_serving || 0).toFixed(1));
      fiber = parseFloat((nutriments.fiber_serving || 0).toFixed(1));
      sugar = parseFloat((nutriments.sugars_serving || 0).toFixed(1));
      
      console.log("Using per-serving data from API");
    } else {
      // Calculate from per 100g data
      const multiplier = servingGrams / 100;
      
      const caloriesPer100g = nutriments["energy-kcal_100g"] || nutriments.energy_100g || 0;
      const proteinPer100g = nutriments.proteins_100g || 0;
      const carbsPer100g = nutriments.carbohydrates_100g || 0;
      const fatPer100g = nutriments.fat_100g || 0;
      const fiberPer100g = nutriments.fiber_100g || 0;
      const sugarPer100g = nutriments.sugars_100g || 0;

      calories = Math.round(caloriesPer100g * multiplier);
      protein = parseFloat((proteinPer100g * multiplier).toFixed(1));
      carbs = parseFloat((carbsPer100g * multiplier).toFixed(1));
      fat = parseFloat((fatPer100g * multiplier).toFixed(1));
      fiber = parseFloat((fiberPer100g * multiplier).toFixed(1));
      sugar = parseFloat((sugarPer100g * multiplier).toFixed(1));
      
      console.log(`Calculated from per 100g data with multiplier ${multiplier}`);
    }

    // Clean up serving description to match diet scanner format: "serving (100g)"
    // Remove any leading numbers and normalize the format
    let cleanServingDescription = servingDescription;
    
    // Extract just the grams value for a clean format
    const gramsMatch = servingDescription.match(/(\d+(?:\.\d+)?)\s*g/i);
    if (gramsMatch) {
      cleanServingDescription = `${Math.round(parseFloat(gramsMatch[1]))}g`;
    }
    
    // Build the food data for 1 serving
    const foodData = {
      name: product.product_name || product.product_name_en || "Unknown Product",
      barcode: barcode,
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      fiber: fiber,
      sugar: sugar,
      servingSize: `serving (${cleanServingDescription})`,
      servingGrams: servingGrams,
      brand: product.brands || "",
      imageUrl: product.image_url || product.image_front_url || null,
      confidence: 1.0
    };

    console.log("Product found:", foodData.name, "- Serving:", foodData.servingSize, "- Calories:", foodData.calories);

    return new Response(JSON.stringify(foodData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in lookup-barcode function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
