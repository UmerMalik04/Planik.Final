/**
 * MCP tool — log_food
 * Inserts a food item entry into the user's diet log.
 */
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "log_food",
  title: "Log food item",
  description: "Add a food item with macros to the signed-in user's diet log.",
  inputSchema: {
    name: z.string().trim().min(1),
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().min(0).optional(),
    sugar: z.number().min(0).optional(),
    quantity: z.number().min(0).optional().describe("Quantity (default 1)."),
    unit: z.string().optional().describe("Unit label (default 'serving')."),
    date: z.string().optional().describe("Date yyyy-MM-dd. Defaults to today."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ name, calories, protein, carbs, fat, fiber, sugar, quantity, unit, date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("food_items")
      .insert({
        user_id: ctx.getUserId(),
        name,
        calories,
        protein,
        carbs,
        fat,
        fiber: fiber ?? 0,
        sugar: sugar ?? 0,
        quantity: quantity ?? 1,
        unit: unit ?? "serving",
        date: date ?? today,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Logged "${name}" (${calories} kcal).` }],
      structuredContent: { entry: data },
    };
  },
});
