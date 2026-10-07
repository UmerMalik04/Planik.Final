/**
 * MCP server definition for Planik.
 * Exposes read + write tools scoped to the signed-in user via Supabase RLS.
 *
 * The Vite plugin bundles this file into supabase/functions/mcp/index.ts.
 * Keep this module import-safe: no env reads, I/O, or throws at top level.
 */
import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listWorkoutPlans from "./tools/list-workout-plans";
import listPersonalRecords from "./tools/list-personal-records";
import listRecentWorkouts from "./tools/list-recent-workouts";
import logWater from "./tools/log-water";
import logFood from "./tools/log-food";
import getDailySteps from "./tools/get-daily-steps";

// Build the OAuth issuer from the Supabase project ref (inlined by Vite at build
// time — stays import-safe). SUPABASE_URL is the Lovable proxy on Cloud apps
// and would be rejected by mcp-js's discovery check, so it must NOT be used.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "planik-mcp",
  title: "Planik",
  version: "0.1.0",
  instructions:
    "Tools for the Planik fitness app. Read the signed-in user's workout plans, personal records, recent workouts, and daily steps; log water intake and food items to their diary. All data is scoped to the authenticated user via Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listWorkoutPlans,
    listPersonalRecords,
    listRecentWorkouts,
    logWater,
    logFood,
    getDailySteps,
  ],
});
