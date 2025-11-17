export interface Exercise {
  name: string;
  muscle_groups: string[];
  thumbnail: string;
  video_or_animation: string;
  instructions: string[];
  last_used: string;
  step_images?: string[]; // 3-step instructional images
}

export const exercisesData: Exercise[] = [
  {
    "name": "Abdominal Crunch",
    "muscle_groups": ["Abs"],
    "thumbnail": "/assets/abdominal-crunch-thumbnail.png",
    "video_or_animation": "/assets/abdominal-crunch.gif",
    "instructions": [
      "Lie on your back with knees bent, feet flat on the floor, hip-width apart.",
      "Place hands behind head or across chest.",
      "Engage core, lift shoulders off the ground, keeping neck relaxed.",
      "Lower back down with control.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-20"
  },
  {
    "name": "Leg Raises",
    "muscle_groups": ["Abs"],
    "thumbnail": "/assets/leg-raises-thumbnail.png",
    "video_or_animation": "/assets/leg-raises.gif",
    "instructions": [
      "Lie flat on your back, hands under hips or by sides.",
      "Keep legs straight and lift them to a 90-degree angle.",
      "Slowly lower legs back down without touching the floor.",
      "Engage core throughout.",
      "Repeat for 10-15 reps."
    ],
    "last_used": "2025-08-18"
  },
  {
    "name": "Leg Sits",
    "muscle_groups": ["Abs"],
    "thumbnail": "/assets/leg-sits-thumbnail.png",
    "video_or_animation": "assets/animations/leg_sits_lottie.json",
    "instructions": [
      "Sit on the floor, knees bent, feet flat.",
      "Lean back slightly, engage core, and lift feet off the ground.",
      "Hold legs at a 45-degree angle for 20-30 seconds.",
      "Rest and repeat for 3-4 sets."
    ],
    "last_used": "2025-08-15"
  },
  {
    "name": "Wall Leg Sits",
    "muscle_groups": ["Abs", "Legs"],
    "thumbnail": "/assets/wall-leg-sits-thumbnail.png",
    "video_or_animation": "assets/animations/wall_leg_sits.mp4",
    "instructions": [
      "Stand with back against a wall, feet 2 feet away.",
      "Slide down until thighs are parallel to the ground, knees at 90 degrees.",
      "Engage core and hold for 30-60 seconds.",
      "Stand up to rest, repeat for 3-4 sets."
    ],
    "last_used": "2025-08-21"
  },
  {
    "name": "Pull-Up",
    "muscle_groups": ["Back", "Biceps"],
    "thumbnail": "/assets/pull-up-thumbnail.png",
    "video_or_animation": "/assets/pull-up.gif",
    "instructions": [
      "Grip a pull-up bar, palms facing away, hands shoulder-width apart.",
      "Hang with arms extended, core engaged.",
      "Pull body up until chin is above bar.",
      "Lower back down with control.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-25"
  },
  {
    "name": "Barbell Row",
    "muscle_groups": ["Back"],
    "thumbnail": "/assets/barbell-row-thumbnail.png",
    "video_or_animation": "assets/animations/barbell_row_lottie.json",
    "instructions": [
      "Stand with feet shoulder-width apart, holding a barbell with an overhand grip.",
      "Bend knees slightly, hinge at hips, keep back straight.",
      "Pull barbell to lower chest, squeezing shoulder blades.",
      "Lower barbell back down.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-23"
  },
  {
    "name": "Lat Pulldown",
    "muscle_groups": ["Back"],
    "thumbnail": "/assets/lat-pulldown-thumbnail.png",
    "video_or_animation": "assets/animations/lat_pulldown.mp4",
    "instructions": [
      "Sit at a lat pulldown machine, grip bar wider than shoulder-width.",
      "Pull bar down to upper chest, keeping torso upright.",
      "Slowly return bar to starting position.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-19"
  },
  {
    "name": "T-Bar Row",
    "muscle_groups": ["Back"],
    "thumbnail": "/assets/t-bar-row-thumbnail.png",
    "video_or_animation": "assets/animations/t_bar_row_lottie.json",
    "instructions": [
      "Stand over a T-bar row machine, feet shoulder-width apart.",
      "Grip handles, bend knees slightly, hinge at hips.",
      "Pull bar to chest, squeezing shoulder blades.",
      "Lower bar with control.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-17"
  },
  {
    "name": "Deadlift",
    "muscle_groups": ["Back", "Legs"],
    "thumbnail": "/assets/deadlift-thumbnail.png",
    "video_or_animation": "assets/animations/deadlift.mp4",
    "instructions": [
      "Stand with feet hip-width apart, barbell over mid-foot.",
      "Grip bar, bend knees, keep back straight.",
      "Lift bar by extending hips and knees, keeping bar close to body.",
      "Lower bar back to ground with control.",
      "Repeat for 6-10 reps."
    ],
    "last_used": "2025-08-24"
  },
  {
    "name": "Dumbbell Row",
    "muscle_groups": ["Back"],
    "thumbnail": "/assets/dumbbell-row-thumbnail.png",
    "video_or_animation": "assets/animations/dumbbell_row_lottie.json",
    "instructions": [
      "Place one knee and hand on a bench, holding a dumbbell in the other hand.",
      "Keep back flat, pull dumbbell to hip, squeezing shoulder blade.",
      "Lower dumbbell back down.",
      "Repeat for 10-12 reps per side."
    ],
    "last_used": "2025-08-20"
  },
  {
    "name": "Face Pulls",
    "muscle_groups": ["Back", "Shoulders"],
    "thumbnail": "/assets/face-pulls-thumbnail.png",
    "video_or_animation": "assets/animations/face_pulls.mp4",
    "instructions": [
      "Set a cable machine with a rope attachment at face height.",
      "Grip rope with both hands, step back, and pull toward face.",
      "Aim for ears, squeezing rear delts.",
      "Return to starting position.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-16"
  },
  {
    "name": "Cable Row",
    "muscle_groups": ["Back"],
    "thumbnail": "/assets/cable-row-thumbnail.png",
    "video_or_animation": "assets/animations/cable_row_lottie.json",
    "instructions": [
      "Sit at a cable row machine, feet braced, grip handle.",
      "Pull handle to lower chest, keeping back straight.",
      "Squeeze shoulder blades together.",
      "Return to starting position.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-21"
  },
  {
    "name": "Barbell Curl",
    "muscle_groups": ["Biceps"],
    "thumbnail": "/assets/barbell-curl-thumbnail.png",
    "video_or_animation": "assets/animations/barbell_curl.mp4",
    "instructions": [
      "Stand with feet shoulder-width apart, holding a barbell with an underhand grip.",
      "Keep elbows close to body, curl bar to shoulders.",
      "Lower bar back down with control.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-22"
  },
  {
    "name": "Dumbbell Curl",
    "muscle_groups": ["Biceps"],
    "thumbnail": "/assets/dumbbell-curl-thumbnail.png",
    "video_or_animation": "assets/animations/dumbbell_curl_lottie.json",
    "instructions": [
      "Stand with feet shoulder-width apart, dumbbell in each hand, palms up.",
      "Curl dumbbells to shoulders, keeping elbows stationary.",
      "Lower dumbbells slowly.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-19"
  },
  {
    "name": "Hammer Curl",
    "muscle_groups": ["Biceps"],
    "thumbnail": "/assets/hammer-curl-thumbnail.png",
    "video_or_animation": "assets/animations/hammer_curl.mp4",
    "instructions": [
      "Hold dumbbells with palms facing inward, feet shoulder-width apart.",
      "Curl dumbbells to shoulders, keeping thumbs up.",
      "Lower back down with control.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-18"
  },
  {
    "name": "Preacher Curl",
    "muscle_groups": ["Biceps"],
    "thumbnail": "/assets/preacher-curl-thumbnail.png",
    "video_or_animation": "assets/animations/preacher_curl_lottie.json",
    "instructions": [
      "Sit at a preacher bench, hold an EZ-bar or dumbbells.",
      "Rest arms on pad, curl weight toward shoulders.",
      "Lower weight back down slowly.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-20"
  },
  {
    "name": "Concentration Curl",
    "muscle_groups": ["Biceps"],
    "thumbnail": "/assets/concentration-curl-thumbnail.png",
    "video_or_animation": "assets/animations/concentration_curl.mp4",
    "instructions": [
      "Sit on a bench, hold a dumbbell, rest elbow on inner thigh.",
      "Curl dumbbell toward shoulder, keeping elbow stationary.",
      "Lower back down with control.",
      "Repeat for 10-12 reps per arm."
    ],
    "last_used": "2025-08-17"
  },
  {
    "name": "Cable Curl",
    "muscle_groups": ["Biceps"],
    "thumbnail": "/assets/cable-curl-thumbnail.png",
    "video_or_animation": "assets/animations/cable_curl_lottie.json",
    "instructions": [
      "Stand at a cable machine with a low pulley, grip handle.",
      "Curl handle toward shoulders, keeping elbows close to body.",
      "Lower handle back down slowly.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-23"
  },
  {
    "name": "Incline Dumbbell Curl",
    "muscle_groups": ["Biceps"],
    "thumbnail": "/assets/incline-dumbbell-curl-thumbnail.png",
    "video_or_animation": "assets/animations/incline_dumbbell_curl.mp4",
    "instructions": [
      "Sit on an incline bench, dumbbells in each hand, palms up.",
      "Curl dumbbells to shoulders, keeping elbows back.",
      "Lower dumbbells slowly.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-21"
  },
  {
    "name": "EZ-Bar Curl",
    "muscle_groups": ["Biceps"],
    "thumbnail": "/assets/ez-bar-curl-thumbnail.png",
    "video_or_animation": "assets/animations/ez_bar_curl_lottie.json",
    "instructions": [
      "Stand with feet shoulder-width apart, grip an EZ-bar.",
      "Curl bar to shoulders, keeping elbows close to body.",
      "Lower bar back down with control.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-24"
  },
  {
    "name": "Running (Treadmill or Outdoor)",
    "muscle_groups": ["Cardio", "Legs"],
    "thumbnail": "/assets/running-thumbnail.png",
    "video_or_animation": "assets/animations/running.mp4",
    "instructions": [
      "Set treadmill to desired speed or choose a flat outdoor path.",
      "Maintain upright posture, slight forward lean.",
      "Stride naturally, landing mid-foot.",
      "Run for 20-30 minutes, adjust speed as needed.",
      "Cool down with a 5-minute walk."
    ],
    "last_used": "2025-08-27"
  },
  {
    "name": "Jump Rope",
    "muscle_groups": ["Cardio"],
    "thumbnail": "/assets/jump-rope-thumbnail.png",
    "video_or_animation": "assets/animations/jump_rope_lottie.json",
    "instructions": [
      "Hold jump rope handles, stand with feet together.",
      "Swing rope over head, jump as it passes under feet.",
      "Keep jumps low and controlled, landing softly.",
      "Continue for 1-2 minutes, rest, repeat for 3-5 sets."
    ],
    "last_used": "2025-08-25"
  },
  {
    "name": "Cycling (Stationary or Outdoor)",
    "muscle_groups": ["Cardio", "Legs"],
    "thumbnail": "/assets/cycling-thumbnail.png",
    "video_or_animation": "assets/animations/cycling.mp4",
    "instructions": [
      "Adjust bike seat to hip height.",
      "Pedal at a steady pace, keeping core engaged.",
      "Maintain smooth, circular pedaling motion.",
      "Cycle for 20-30 minutes, adjust resistance as needed."
    ],
    "last_used": "2025-08-22"
  },
  {
    "name": "Rowing Machine",
    "muscle_groups": ["Cardio", "Back"],
    "thumbnail": "/assets/rowing-machine-thumbnail.png",
    "video_or_animation": "assets/animations/rowing_machine_lottie.json",
    "instructions": [
      "Sit on rowing machine, feet strapped in, grip handle.",
      "Push with legs, lean back slightly, pull handle to chest.",
      "Return to starting position in reverse order.",
      "Row for 15-20 minutes, maintain steady rhythm."
    ],
    "last_used": "2025-08-20"
  },
  {
    "name": "Stair Climber",
    "muscle_groups": ["Cardio", "Legs"],
    "thumbnail": "/assets/stair-climber-thumbnail.png",
    "video_or_animation": "assets/animations/stair_climber.mp4",
    "instructions": [
      "Step onto stair climber, hold rails lightly for balance.",
      "Climb at a steady pace, stepping fully on each stair.",
      "Keep posture upright, engage core.",
      "Continue for 15-20 minutes."
    ],
    "last_used": "2025-08-19"
  },
  {
    "name": "High Knees",
    "muscle_groups": ["Cardio", "Abs"],
    "thumbnail": "/assets/high-knees-thumbnail.png",
    "video_or_animation": "assets/animations/high_knees_lottie.json",
    "instructions": [
      "Stand with feet hip-width apart.",
      "Run in place, lifting knees to hip height.",
      "Pump arms for balance, keep core tight.",
      "Continue for 30-60 seconds, rest, repeat for 3-5 sets."
    ],
    "last_used": "2025-08-18"
  },
  {
    "name": "Burpees",
    "muscle_groups": ["Cardio", "Chest", "Legs"],
    "thumbnail": "/assets/burpees-thumbnail.png",
    "video_or_animation": "assets/animations/burpees.mp4",
    "instructions": [
      "Stand, then squat and place hands on floor.",
      "Jump feet back to plank position.",
      "Perform a push-up, then jump feet back to hands.",
      "Jump up explosively, reaching overhead.",
      "Repeat for 10-15 reps."
    ],
    "last_used": "2025-08-21"
  },
  {
    "name": "Jumping Jacks",
    "muscle_groups": ["Cardio"],
    "thumbnail": "/assets/jumping-jacks-thumbnail.png",
    "video_or_animation": "assets/animations/jumping_jacks_lottie.json",
    "instructions": [
      "Stand with feet together, arms at sides.",
      "Jump, spreading legs and raising arms overhead.",
      "Jump back to starting position.",
      "Continue for 30-60 seconds, rest, repeat for 3-5 sets."
    ],
    "last_used": "2025-08-23"
  },
  {
    "name": "Barbell Bench Press",
    "muscle_groups": ["Chest", "Triceps", "Shoulders"],
    "thumbnail": "/assets/barbell-bench-press-thumbnail.png",
    "video_or_animation": "assets/animations/barbell_bench_press.mp4",
    "instructions": [
      "Lie on a flat bench, feet flat on the floor.",
      "Grip barbell slightly wider than shoulder-width.",
      "Lower bar to mid-chest, elbows at 45 degrees.",
      "Push bar back up to starting position.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-26"
  },
  {
    "name": "Dumbbell Bench Press",
    "muscle_groups": ["Chest", "Triceps"],
    "thumbnail": "/assets/dumbbell-bench-press-thumbnail.png",
    "video_or_animation": "assets/animations/dumbbell_bench_press_lottie.json",
    "instructions": [
      "Lie on a flat bench, dumbbells in each hand at chest level.",
      "Push dumbbells up until arms are extended.",
      "Lower dumbbells back to chest with control.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-24"
  },
  {
    "name": "Incline Bench Press",
    "muscle_groups": ["Chest", "Triceps"],
    "thumbnail": "/assets/incline-bench-press-thumbnail.png",
    "video_or_animation": "assets/animations/incline_bench_press.mp4",
    "instructions": [
      "Lie on an incline bench, grip barbell wider than shoulder-width.",
      "Lower bar to upper chest, elbows at 45 degrees.",
      "Push bar back up to starting position.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-22"
  },
  {
    "name": "Decline Bench Press",
    "muscle_groups": ["Chest", "Triceps"],
    "thumbnail": "/assets/decline-bench-press-thumbnail.png",
    "video_or_animation": "assets/animations/decline_bench_press_lottie.json",
    "instructions": [
      "Lie on a decline bench, grip barbell wider than shoulder-width.",
      "Lower bar to lower chest, elbows at 45 degrees.",
      "Push bar back up to starting position.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-20"
  },
  {
    "name": "Chest Fly (Machine or Dumbbell)",
    "muscle_groups": ["Chest"],
    "thumbnail": "/assets/chest-fly-thumbnail.png",
    "video_or_animation": "assets/animations/chest_fly.mp4",
    "instructions": [
      "Sit at a chest fly machine or lie on a bench with dumbbells.",
      "Extend arms wide, palms facing up (dumbbells) or gripping handles.",
      "Bring arms together in a hugging motion, squeezing chest.",
      "Return to starting position.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-19"
  },
  {
    "name": "Push-Ups",
    "muscle_groups": ["Chest", "Triceps"],
    "thumbnail": "/assets/push-ups-thumbnail.png",
    "video_or_animation": "assets/animations/push_ups_lottie.json",
    "instructions": [
      "Start in a plank position, hands shoulder-width apart.",
      "Lower body until chest nearly touches floor, elbows at 45 degrees.",
      "Push back up to starting position.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-25"
  },
  {
    "name": "Cable Crossover",
    "muscle_groups": ["Chest"],
    "thumbnail": "/assets/cable-crossover-thumbnail.png",
    "video_or_animation": "assets/animations/cable_crossover.mp4",
    "instructions": [
      "Stand between two cable machines, pulleys set high.",
      "Grip handles, step forward, arms slightly bent.",
      "Pull handles down and together, squeezing chest.",
      "Return to starting position.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-21"
  },
  {
    "name": "Pec Deck Machine",
    "muscle_groups": ["Chest"],
    "thumbnail": "/assets/pec-deck-thumbnail.png",
    "video_or_animation": "assets/animations/pec_deck_lottie.json",
    "instructions": [
      "Sit at a pec deck machine, adjust seat height.",
      "Grip handles or place forearms on pads.",
      "Bring arms together, squeezing chest.",
      "Return to starting position.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-23"
  },
  {
    "name": "Barbell Squat",
    "muscle_groups": ["Legs", "Glutes"],
    "thumbnail": "/assets/barbell-squat-thumbnail.png",
    "video_or_animation": "assets/animations/barbell_squat.mp4",
    "instructions": [
      "Stand with feet shoulder-width apart, barbell on upper back.",
      "Keep chest up, core engaged.",
      "Squat down until thighs are parallel to ground.",
      "Push through heels to stand.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-26"
  },
  {
    "name": "Leg Press",
    "muscle_groups": ["Legs"],
    "thumbnail": "/assets/leg-press-thumbnail.png",
    "video_or_animation": "assets/animations/leg_press_lottie.json",
    "instructions": [
      "Sit in a leg press machine, feet shoulder-width on platform.",
      "Push platform away, extending legs without locking knees.",
      "Lower platform back until knees are at 90 degrees.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-24"
  },
  {
    "name": "Romanian Deadlift",
    "muscle_groups": ["Legs", "Back"],
    "thumbnail": "/assets/romanian-deadlift-thumbnail.png",
    "video_or_animation": "assets/animations/romanian_deadlift.mp4",
    "instructions": [
      "Hold a barbell, feet hip-width apart.",
      "Hinge at hips, lower bar toward floor, keeping back straight.",
      "Feel stretch in hamstrings, then return to standing.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-22"
  },
  {
    "name": "Walking Lunges",
    "muscle_groups": ["Legs", "Glutes"],
    "thumbnail": "/assets/walking-lunges-thumbnail.png",
    "video_or_animation": "assets/animations/walking_lunges_lottie.json",
    "instructions": [
      "Stand with feet together, optional dumbbells in hands.",
      "Step forward, lunge until front knee is at 90 degrees.",
      "Push off back foot to step forward into next lunge.",
      "Repeat for 12-16 steps."
    ],
    "last_used": "2025-08-20"
  },
  {
    "name": "Leg Curl (Machine)",
    "muscle_groups": ["Legs"],
    "thumbnail": "/assets/leg-curl-thumbnail.png",
    "video_or_animation": "assets/animations/leg_curl.mp4",
    "instructions": [
      "Lie face-down on a leg curl machine, adjust pad to ankles.",
      "Curl legs up toward glutes, contracting hamstrings.",
      "Lower legs back down with control.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-19"
  },
  {
    "name": "Leg Extension (Machine)",
    "muscle_groups": ["Legs"],
    "thumbnail": "/assets/leg-extension-thumbnail.png",
    "video_or_animation": "assets/animations/leg_extension_lottie.json",
    "instructions": [
      "Sit on a leg extension machine, adjust pad to shins.",
      "Extend legs until straight, contracting quads.",
      "Lower legs back down with control.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-21"
  },
  {
    "name": "Calf Raises",
    "muscle_groups": ["Legs"],
    "thumbnail": "/assets/calf-raises-thumbnail.png",
    "video_or_animation": "assets/animations/calf_raises.mp4",
    "instructions": [
      "Stand with feet hip-width apart, optional weight in hands.",
      "Raise heels off ground, standing on toes.",
      "Lower heels back down slowly.",
      "Repeat for 15-20 reps."
    ],
    "last_used": "2025-08-23"
  },
  {
    "name": "Bulgarian Split Squat",
    "muscle_groups": ["Legs", "Glutes"],
    "thumbnail": "/assets/bulgarian-split-squat-thumbnail.png",
    "video_or_animation": "assets/animations/bulgarian_split_squat_lottie.json",
    "instructions": [
      "Stand 2 feet in front of a bench, one foot resting on it.",
      "Lower into a lunge, front knee at 90 degrees.",
      "Push through front heel to stand.",
      "Repeat for 10-12 reps per leg."
    ],
    "last_used": "2025-08-25"
  },
  {
    "name": "Overhead Press (Barbell or Dumbbell)",
    "muscle_groups": ["Shoulders", "Triceps"],
    "thumbnail": "/assets/overhead-press-thumbnail.png",
    "video_or_animation": "assets/animations/overhead_press.mp4",
    "instructions": [
      "Stand or sit, hold barbell/dumbbells at shoulder height, palms forward.",
      "Press weight overhead until arms are extended.",
      "Lower back to shoulders with control.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-26"
  },
  {
    "name": "Arnold Press",
    "muscle_groups": ["Shoulders"],
    "thumbnail": "/assets/arnold-press-thumbnail.png",
    "video_or_animation": "assets/animations/arnold_press_lottie.json",
    "instructions": [
      "Sit or stand, hold dumbbells at shoulder height, palms facing you.",
      "Press dumbbells up while rotating palms outward.",
      "Lower dumbbells, rotating palms back in.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-24"
  },
  {
    "name": "Lateral Raises",
    "muscle_groups": ["Shoulders"],
    "thumbnail": "/assets/lateral-raises-thumbnail.png",
    "video_or_animation": "assets/animations/lateral_raises.mp4",
    "instructions": [
      "Stand with feet hip-width apart, dumbbells at sides.",
      "Raise arms to shoulder height, elbows slightly bent.",
      "Lower arms back down with control.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-22"
  },
  {
    "name": "Front Raises",
    "muscle_groups": ["Shoulders"],
    "thumbnail": "/assets/front-raises-thumbnail.png",
    "video_or_animation": "assets/animations/front_raises_lottie.json",
    "instructions": [
      "Stand with feet hip-width apart, dumbbells in hands, palms down.",
      "Raise arms to shoulder height in front of you.",
      "Lower arms back down slowly.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-20"
  },
  {
    "name": "Rear Delt Fly",
    "muscle_groups": ["Shoulders"],
    "thumbnail": "/assets/rear-delt-fly-thumbnail.png",
    "video_or_animation": "assets/animations/rear_delt_fly.mp4",
    "instructions": [
      "Bend forward at hips, dumbbells in hands, palms facing in.",
      "Raise arms out to sides, squeezing rear delts.",
      "Lower arms back down with control.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-19"
  },
  {
    "name": "Upright Row",
    "muscle_groups": ["Shoulders", "Back"],
    "thumbnail": "/assets/upright-row-thumbnail.png",
    "video_or_animation": "assets/animations/upright_row_lottie.json",
    "instructions": [
      "Stand with feet shoulder-width apart, hold barbell with overhand grip.",
      "Pull barbell up to chest, elbows pointing outward.",
      "Lower barbell back down slowly.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-21"
  },
  {
    "name": "Shoulder Press Machine",
    "muscle_groups": ["Shoulders"],
    "thumbnail": "/assets/shoulder-press-machine-thumbnail.png",
    "video_or_animation": "assets/animations/shoulder_press_machine.mp4",
    "instructions": [
      "Sit on a shoulder press machine, adjust seat height.",
      "Grip handles, press upward until arms are extended.",
      "Lower handles back down with control.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-23"
  },
  {
    "name": "Face Pulls",
    "muscle_groups": ["Shoulders", "Back"],
    "thumbnail": "/assets/face-pulls-thumbnail.png",
    "video_or_animation": "assets/animations/face_pulls.mp4",
    "instructions": [
      "Set a cable machine with a rope attachment at face height.",
      "Grip rope, step back, pull toward face, aiming for ears.",
      "Squeeze rear delts, return to start.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-25"
  },
  {
    "name": "Tricep Pushdown (Cable)",
    "muscle_groups": ["Triceps"],
    "thumbnail": "/assets/tricep-pushdown-thumbnail.png",
    "video_or_animation": "assets/animations/tricep_pushdown_lottie.json",
    "instructions": [
      "Stand at a cable machine with a high pulley, grip bar or rope.",
      "Push bar down until arms are extended, elbows close to body.",
      "Return to starting position with control.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-26"
  },
  {
    "name": "Skull Crushers (EZ-Bar or Dumbbell)",
    "muscle_groups": ["Triceps"],
    "thumbnail": "/assets/skull-crushers-thumbnail.png",
    "video_or_animation": "assets/animations/skull_crushers.mp4",
    "instructions": [
      "Lie on a bench, hold EZ-bar or dumbbells above chest.",
      "Lower weight toward forehead, bending elbows.",
      "Extend arms back to starting position.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-24"
  },
  {
    "name": "Overhead Tricep Extension",
    "muscle_groups": ["Triceps"],
    "thumbnail": "/assets/overhead-tricep-extension-thumbnail.png",
    "video_or_animation": "assets/animations/overhead_tricep_extension_lottie.json",
    "instructions": [
      "Stand or sit, hold a dumbbell overhead with both hands.",
      "Lower dumbbell behind head, bending elbows.",
      "Extend arms back to starting position.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-22"
  },
  {
    "name": "Dips (Parallel Bars or Bench)",
    "muscle_groups": ["Triceps", "Chest"],
    "thumbnail": "/assets/dips-thumbnail.png",
    "video_or_animation": "assets/animations/dips.mp4",
    "instructions": [
      "On parallel bars or a bench, grip handles or edge.",
      "Lower body until elbows are at 90 degrees.",
      "Push back up to starting position.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-20"
  },
  {
    "name": "Close-Grip Bench Press",
    "muscle_groups": ["Triceps", "Chest"],
    "thumbnail": "/assets/close-grip-bench-press-thumbnail.png",
    "video_or_animation": "assets/animations/close_grip_bench_press_lottie.json",
    "instructions": [
      "Lie on a bench, grip barbell with hands closer than shoulder-width.",
      "Lower bar to chest, keeping elbows close to body.",
      "Push bar back up to starting position.",
      "Repeat for 8-12 reps."
    ],
    "last_used": "2025-08-19"
  },
  {
    "name": "Tricep Kickbacks",
    "muscle_groups": ["Triceps"],
    "thumbnail": "/assets/tricep-kickbacks-thumbnail.png",
    "video_or_animation": "assets/animations/tricep_kickbacks.mp4",
    "instructions": [
      "Bend forward at hips, hold dumbbells, elbows bent at 90 degrees.",
      "Extend arms back, straightening elbows.",
      "Return to starting position.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-21"
  },
  {
    "name": "Rope Pushdowns",
    "muscle_groups": ["Triceps"],
    "thumbnail": "/assets/rope-pushdowns-thumbnail.png",
    "video_or_animation": "assets/animations/rope_pushdowns_lottie.json",
    "instructions": [
      "Stand at a cable machine with a rope attachment, high pulley.",
      "Pull rope down, splitting ends outward at bottom.",
      "Return to starting position with control.",
      "Repeat for 10-12 reps."
    ],
    "last_used": "2025-08-23"
  },
  {
    "name": "Diamond Push-Ups",
    "muscle_groups": ["Triceps", "Chest"],
    "thumbnail": "/assets/diamond-push-ups-thumbnail.png",
    "video_or_animation": "assets/animations/diamond_push_ups.mp4",
    "instructions": [
      "Start in a plank, hands close together forming a diamond shape.",
      "Lower body until chest nearly touches hands.",
      "Push back up to starting position.",
      "Repeat for 12-15 reps."
    ],
    "last_used": "2025-08-25"
  }
];