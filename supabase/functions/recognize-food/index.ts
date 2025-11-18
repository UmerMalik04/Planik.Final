import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://twtvzmyvhthvhvulaxfc.supabase.co",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const recognizeFoodSchema = z.object({
  imageBase64: z.string()
    .min(1, { message: "Image data cannot be empty" })
    .max(10485760, { message: "Image size must be less than 10MB (base64)" })
    .refine(
      (val) => val.startsWith('data:image/'),
      { message: "Invalid image format. Must be a valid data URL" }
    )
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize inputs
    const validation = recognizeFoodSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input",
          details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { imageBase64 } = validation.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing food image with AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "You are a food recognition expert. Identify this food item from ANY cuisine worldwide (Asian, African, Middle Eastern, European, Latin American, etc.). Recognize snacks, packaged foods, traditional dishes, street food, home-cooked meals, and restaurant dishes. For packaged items like crisps/chips, identify the brand and type if visible. Give nutrition values per 100g. Reply ONLY with valid JSON (no markdown): {\"name\":\"specific food name\",\"calories\":150,\"protein\":5,\"carbs\":20,\"fat\":8,\"fiber\":2,\"sugar\":1,\"confidence\":0.9}. Use specific names like 'Salt & Vinegar Crisps', 'Jollof Rice', 'Pad Thai', 'Shawarma', 'Biryani' not generic terms like 'chips' or 'food'."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", aiResponse);

    // Parse the JSON response from AI
    let foodData;
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      foodData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a generic fallback
      foodData = {
        name: "Food Item",
        calories: 150,
        protein: 8,
        carbs: 20,
        fat: 5,
        fiber: 3,
        sugar: 6,
        confidence: 0.3
      };
    }

    return new Response(JSON.stringify(foodData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in recognize-food function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: {
          name: "Food Item",
          calories: 150,
          protein: 8,
          carbs: 20,
          fat: 5,
          fiber: 3,
          sugar: 6,
          confidence: 0.3
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
