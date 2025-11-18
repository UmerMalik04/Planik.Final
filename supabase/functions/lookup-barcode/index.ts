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

    // Extract nutrition data (per 100g)
    const foodData = {
      name: product.product_name || product.product_name_en || "Unknown Product",
      barcode: barcode,
      calories: Math.round(nutriments.energy_100g || nutriments["energy-kcal_100g"] || 0),
      protein: parseFloat((nutriments.proteins_100g || 0).toFixed(1)),
      carbs: parseFloat((nutriments.carbohydrates_100g || 0).toFixed(1)),
      fat: parseFloat((nutriments.fat_100g || 0).toFixed(1)),
      fiber: parseFloat((nutriments.fiber_100g || 0).toFixed(1)),
      sugar: parseFloat((nutriments.sugars_100g || 0).toFixed(1)),
      servingSize: product.serving_size || "100g",
      brand: product.brands || "",
      imageUrl: product.image_url || product.image_front_url || null,
      confidence: 1.0
    };

    console.log("Product found:", foodData.name);

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
