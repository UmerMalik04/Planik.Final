/**
 * MCP tool — log_water
 * Inserts a water intake entry for the signed-in user (today by default).
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
  name: "log_water",
  title: "Log water intake",
  description: "Record a water intake amount (in millilitres) for the signed-in user.",
  inputSchema: {
    amount_ml: z.number().int().min(1).max(5000).describe("Amount of water in millilitres."),
    date: z.string().optional().describe("Date (yyyy-MM-dd). Defaults to today."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ amount_ml, date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const row = {
      user_id: ctx.getUserId(),
      amount_ml,
      ...(date ? { date } : {}),
    };
    const { data, error } = await supabaseForUser(ctx)
      .from("water_intake")
      .insert(row)
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Logged ${amount_ml} ml of water.` }],
      structuredContent: { entry: data },
    };
  },
});
