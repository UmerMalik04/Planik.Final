INSERT INTO public.daily_steps (user_id, date, steps)
SELECT
  '17cbc035-77a1-4efb-985b-e0edae0762d8'::uuid,
  (CURRENT_DATE - (n || ' days')::interval)::date,
  (5000 + floor(random() * 8000))::int
FROM generate_series(0, 13) n
ON CONFLICT (user_id, date) DO UPDATE SET steps = EXCLUDED.steps;

WITH new_plan AS (
  INSERT INTO public.workout_plans (user_id, name, type, sets)
  VALUES ('17cbc035-77a1-4efb-985b-e0edae0762d8'::uuid, 'Push Day', 'Push Day', 4)
  RETURNING id
)
INSERT INTO public.exercises (user_id, plan_id, name, reps, sets, weight)
SELECT '17cbc035-77a1-4efb-985b-e0edae0762d8'::uuid, new_plan.id, e.name, e.reps, e.sets, e.weight
FROM new_plan,
     (VALUES ('Bench Press', 8, 4, 60), ('Overhead Press', 10, 3, 35)) AS e(name, reps, sets, weight);

INSERT INTO public.food_items (user_id, date, name, calories, protein, carbs, fat, fiber, sugar, quantity, unit)
VALUES ('17cbc035-77a1-4efb-985b-e0edae0762d8'::uuid, CURRENT_DATE, 'Chicken & Rice Bowl', 620, 45, 70, 14, 4, 3, 1, 'bowl');