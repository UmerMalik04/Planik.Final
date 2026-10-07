-- Seed step history (14 days)
INSERT INTO public.daily_steps (user_id, date, steps)
SELECT
  '2e7e26d9-925a-4c37-b439-6ed7eea336db'::uuid,
  (CURRENT_DATE - (n || ' days')::interval)::date,
  (5000 + floor(random() * 8000))::int
FROM generate_series(0, 13) n
ON CONFLICT (user_id, date) DO UPDATE SET steps = EXCLUDED.steps;

-- Seed a workout plan + two exercises
WITH new_plan AS (
  INSERT INTO public.workout_plans (user_id, name, type, sets)
  VALUES ('2e7e26d9-925a-4c37-b439-6ed7eea336db'::uuid, 'Push Day', 'Push Day', 4)
  RETURNING id
)
INSERT INTO public.exercises (user_id, plan_id, name, reps, sets, weight)
SELECT '2e7e26d9-925a-4c37-b439-6ed7eea336db'::uuid, new_plan.id, e.name, e.reps, e.sets, e.weight
FROM new_plan,
     (VALUES ('Bench Press', 8, 4, 60), ('Overhead Press', 10, 3, 35)) AS e(name, reps, sets, weight);

-- Seed today's food entry
INSERT INTO public.food_items (user_id, date, name, calories, protein, carbs, fat, fiber, sugar, quantity, unit)
VALUES ('2e7e26d9-925a-4c37-b439-6ed7eea336db'::uuid, CURRENT_DATE, 'Chicken & Rice Bowl', 620, 45, 70, 14, 4, 3, 1, 'bowl');