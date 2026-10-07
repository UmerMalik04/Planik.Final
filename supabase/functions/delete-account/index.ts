import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * delete-account edge function.
 *
 * Apple Guideline 5.1.1(v) requires apps with account creation to offer
 * in-app account deletion that actually removes the user and personal data.
 *
 * This function:
 *  1. Verifies the caller's JWT.
 *  2. Deletes all user-owned rows from public tables.
 *  3. Deletes the auth user via the Admin API (service_role key).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the user's JWT so only the authenticated owner can delete themselves
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const verifyClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await verifyClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Admin client for destructive operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete user data from all public tables
    const tables = [
      'completed_exercises',
      'daily_steps',
      'exercises',
      'food_items',
      'personal_records',
      'user_goals',
      'user_preferences',
      'user_profiles',
      'user_settings',
      'user_stats',
      'water_intake',
      'workout_plans',
      'workout_sessions',
      'workout_types',
    ];

    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
      }
    }

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Delete account error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
