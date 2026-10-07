import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const DEMO_EMAIL = 'planik123@demo.com'
    const DEMO_PASSWORD = 'planik123'

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === DEMO_EMAIL)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log('Demo user already exists:', userId)
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Demo User' }
      })
      if (createError) throw createError
      userId = newUser.user.id
      console.log('Created demo user:', userId)
    }

    // Check if data already seeded
    const { data: existingPlans } = await supabaseAdmin
      .from('workout_plans')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existingPlans && existingPlans.length > 0) {
      return new Response(JSON.stringify({ 
        message: 'Demo account already seeded',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Create workout plans
    const plans = [
      { name: 'Push Day', type: 'Push', sets: 4, user_id: userId },
      { name: 'Pull Day', type: 'Pull', sets: 4, user_id: userId },
      { name: 'Leg Day', type: 'Legs', sets: 4, user_id: userId },
    ]
    const { data: createdPlans, error: planError } = await supabaseAdmin
      .from('workout_plans')
      .insert(plans)
      .select()
    if (planError) throw planError

    const pushPlan = createdPlans[0]
    const pullPlan = createdPlans[1]
    const legPlan = createdPlans[2]

    // Create exercises for each plan
    const exercises = [
      // Push Day
      { name: 'Barbell Bench Press', sets: 4, reps: 8, weight: 80, plan_id: pushPlan.id, user_id: userId },
      { name: 'Overhead Shoulder Press', sets: 3, reps: 10, weight: 40, plan_id: pushPlan.id, user_id: userId },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 30, plan_id: pushPlan.id, user_id: userId },
      { name: 'Lateral Raises', sets: 3, reps: 15, weight: 10, plan_id: pushPlan.id, user_id: userId },
      { name: 'Triceps Rope Pushdown', sets: 3, reps: 12, weight: 25, plan_id: pushPlan.id, user_id: userId },
      // Pull Day
      { name: 'Pull-Ups', sets: 4, reps: 8, weight: 0, plan_id: pullPlan.id, user_id: userId },
      { name: 'Barbell Row', sets: 4, reps: 8, weight: 70, plan_id: pullPlan.id, user_id: userId },
      { name: 'Seated Cable Row', sets: 3, reps: 10, weight: 55, plan_id: pullPlan.id, user_id: userId },
      { name: 'Face Pulls', sets: 3, reps: 15, weight: 15, plan_id: pullPlan.id, user_id: userId },
      { name: 'Barbell Curl', sets: 3, reps: 10, weight: 30, plan_id: pullPlan.id, user_id: userId },
      // Leg Day
      { name: 'Back Squat', sets: 4, reps: 8, weight: 100, plan_id: legPlan.id, user_id: userId },
      { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 80, plan_id: legPlan.id, user_id: userId },
      { name: 'Leg Press', sets: 3, reps: 12, weight: 150, plan_id: legPlan.id, user_id: userId },
      { name: 'Leg Curls', sets: 3, reps: 12, weight: 40, plan_id: legPlan.id, user_id: userId },
      { name: 'Calf Raises', sets: 4, reps: 15, weight: 60, plan_id: legPlan.id, user_id: userId },
    ]
    const { error: exError } = await supabaseAdmin.from('exercises').insert(exercises)
    if (exError) throw exError

    // Create past workout sessions (last 2 weeks)
    const now = new Date()
    const sessions = [
      { plan_id: pushPlan.id, user_id: userId, date: new Date(now.getTime() - 1 * 86400000).toISOString(), is_active: false },
      { plan_id: pullPlan.id, user_id: userId, date: new Date(now.getTime() - 3 * 86400000).toISOString(), is_active: false },
      { plan_id: legPlan.id, user_id: userId, date: new Date(now.getTime() - 5 * 86400000).toISOString(), is_active: false },
      { plan_id: pushPlan.id, user_id: userId, date: new Date(now.getTime() - 7 * 86400000).toISOString(), is_active: false },
      { plan_id: pullPlan.id, user_id: userId, date: new Date(now.getTime() - 9 * 86400000).toISOString(), is_active: false },
    ]
    const { data: createdSessions, error: sessError } = await supabaseAdmin
      .from('workout_sessions')
      .insert(sessions)
      .select()
    if (sessError) throw sessError

    // Create completed exercises for sessions
    const completedExercises = [
      // Session 1 - Push
      { name: 'Barbell Bench Press', sets: 4, reps: 8, weight: 80, session_id: createdSessions[0].id, user_id: userId, date: createdSessions[0].date },
      { name: 'Overhead Shoulder Press', sets: 3, reps: 10, weight: 40, session_id: createdSessions[0].id, user_id: userId, date: createdSessions[0].date },
      { name: 'Triceps Rope Pushdown', sets: 3, reps: 12, weight: 25, session_id: createdSessions[0].id, user_id: userId, date: createdSessions[0].date },
      // Session 2 - Pull
      { name: 'Pull-Ups', sets: 4, reps: 8, weight: 0, session_id: createdSessions[1].id, user_id: userId, date: createdSessions[1].date },
      { name: 'Barbell Row', sets: 4, reps: 8, weight: 70, session_id: createdSessions[1].id, user_id: userId, date: createdSessions[1].date },
      { name: 'Barbell Curl', sets: 3, reps: 10, weight: 30, session_id: createdSessions[1].id, user_id: userId, date: createdSessions[1].date },
      // Session 3 - Legs
      { name: 'Back Squat', sets: 4, reps: 8, weight: 100, session_id: createdSessions[2].id, user_id: userId, date: createdSessions[2].date },
      { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 80, session_id: createdSessions[2].id, user_id: userId, date: createdSessions[2].date },
      { name: 'Leg Press', sets: 3, reps: 12, weight: 150, session_id: createdSessions[2].id, user_id: userId, date: createdSessions[2].date },
      // Session 4 - Push (previous week)
      { name: 'Barbell Bench Press', sets: 4, reps: 8, weight: 75, session_id: createdSessions[3].id, user_id: userId, date: createdSessions[3].date, previous_weight: 70, previous_reps: 8 },
      { name: 'Overhead Shoulder Press', sets: 3, reps: 10, weight: 37.5, session_id: createdSessions[3].id, user_id: userId, date: createdSessions[3].date },
      // Session 5 - Pull (previous week)
      { name: 'Pull-Ups', sets: 4, reps: 7, weight: 0, session_id: createdSessions[4].id, user_id: userId, date: createdSessions[4].date },
      { name: 'Barbell Row', sets: 4, reps: 8, weight: 65, session_id: createdSessions[4].id, user_id: userId, date: createdSessions[4].date },
    ]
    const { error: compError } = await supabaseAdmin.from('completed_exercises').insert(completedExercises)
    if (compError) throw compError

    // Personal records
    const prs = [
      { exercise_name: 'Barbell Bench Press', weight: 85, reps: 5, user_id: userId },
      { exercise_name: 'Back Squat', weight: 110, reps: 5, user_id: userId },
      { exercise_name: 'Barbell Row', weight: 75, reps: 8, user_id: userId },
      { exercise_name: 'Romanian Deadlift', weight: 90, reps: 8, user_id: userId },
    ]
    const { error: prError } = await supabaseAdmin.from('personal_records').insert(prs)
    if (prError) throw prError

    // User profile
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      user_id: userId, display_name: 'Demo User'
    })
    if (profileError) throw profileError

    // User settings
    const { error: settingsError } = await supabaseAdmin.from('user_settings').insert({
      user_id: userId, theme: 'dark', theme_color: '#e11d48'
    })
    if (settingsError) throw settingsError

    // User stats
    const { error: statsError } = await supabaseAdmin.from('user_stats').insert({
      user_id: userId, current_streak: 3, progress_kg: 45, last_workout_date: new Date(now.getTime() - 86400000).toISOString().split('T')[0]
    })
    if (statsError) throw statsError

    return new Response(JSON.stringify({
      message: 'Demo account created and seeded successfully!',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      userId
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
