/**
 * MCP tool — list_recent_workouts
 * Returns recent workout sessions with completed exercises.
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
  name: "list_recent_workouts",
  title: "List recent workouts",
  description: "List the user's most recent completed workout sessions and their exercises.",
  inputSchema: {
    days: z.number().int().min(1).max(365).optional().describe("Look back N days (default 30)."),
    limit: z.number().int().min(1).max(50).optional().describe("Max sessions (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const since = new Date(Date.now() - (days ?? 30) * 86400_000).toISOString().slice(0, 10);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("workout_sessions")
      .select("id, date, duration_minutes, completed_exercises(name, sets, reps, weight)")
      .gte("date", since)
      .order("date", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { sessions: data ?? [] },
    };
  },
});
