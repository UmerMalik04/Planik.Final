/**
 * MCP tool — list_personal_records
 * Returns the user's PRs (heaviest weight × reps per exercise).
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
  name: "list_personal_records",
  title: "List personal records",
  description: "List the signed-in user's personal records (best weight × reps per exercise).",
  inputSchema: {
    exercise: z.string().trim().min(1).optional().describe("Filter by exercise name (case-insensitive)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ exercise }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("personal_records")
      .select("exercise_name, weight, reps, date")
      .order("date", { ascending: false });
    if (exercise) query = query.ilike("exercise_name", `%${exercise}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { records: data ?? [] },
    };
  },
});
