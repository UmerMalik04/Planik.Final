/**
 * MCP tool — get_daily_steps
 * Returns the user's daily step counts over a recent window.
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
  name: "get_daily_steps",
  title: "Get daily steps",
  description: "Return the signed-in user's daily step counts for the last N days.",
  inputSchema: {
    days: z.number().int().min(1).max(90).optional().describe("Number of days to return (default 7)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const since = new Date(Date.now() - (days ?? 7) * 86400_000).toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("daily_steps")
      .select("date, steps")
      .gte("date", since)
      .order("date", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { days: data ?? [] },
    };
  },
});
