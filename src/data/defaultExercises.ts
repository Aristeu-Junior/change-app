import { ExerciseTemplate } from '../types';

export const DEFAULT_EXERCISES: ExerciseTemplate[] = [
  // CHEST
  {
    id: 'bench-press-barbell',
    title: 'Bench Press (Barbell)',
    primary_muscle_group: 'chest',
    secondary_muscle_groups: ['triceps', 'shoulders'],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Lie flat on the bench with eyes under the bar. Grip with thumbs around bar, retract scapulae, lower bar to mid-chest, and press explosively.'
  },
  {
    id: 'incline-dumbbell-press',
    title: 'Incline Dumbbell Press',
    primary_muscle_group: 'chest',
    secondary_muscle_groups: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    type: 'weight_reps',
    instructions: 'Set bench to 30-45 degrees. Press dumbbells upward with elbows at ~45 degrees, contracting the upper chest.'
  },
  {
    id: 'cable-crossover',
    title: 'Cable Fly / Crossover',
    primary_muscle_group: 'chest',
    secondary_muscle_groups: ['shoulders'],
    equipment: 'cable',
    type: 'weight_reps',
    instructions: 'Set pulleys at shoulder or high level. Bring hands together with slight elbow bend, squeezing chest at peak contraction.'
  },
  {
    id: 'chest-dip',
    title: 'Chest Dip',
    primary_muscle_group: 'chest',
    secondary_muscle_groups: ['triceps', 'shoulders'],
    equipment: 'bodyweight',
    type: 'bodyweight_reps',
    instructions: 'Lean forward ~30 degrees, flare elbows slightly, lower until 90 degree arm angle, and push up focusing on lower chest.'
  },
  {
    id: 'pec-deck-fly',
    title: 'Pec Deck Machine',
    primary_muscle_group: 'chest',
    secondary_muscle_groups: ['shoulders'],
    equipment: 'machine',
    type: 'weight_reps',
    instructions: 'Adjust seat height so arms are parallel to floor. Bring pads together with controlled tempo.'
  },
  {
    id: 'push-up',
    title: 'Push Up',
    primary_muscle_group: 'chest',
    secondary_muscle_groups: ['triceps', 'abdominals'],
    equipment: 'bodyweight',
    type: 'bodyweight_reps'
  },

  // BACK
  {
    id: 'deadlift-barbell',
    title: 'Deadlift (Barbell)',
    primary_muscle_group: 'back',
    secondary_muscle_groups: ['hamstrings', 'glutes', 'traps', 'forearms'],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Bar over mid-foot, grip outside shins, chest proud, drive floor away with legs and lock out hips.'
  },
  {
    id: 'lat-pulldown',
    title: 'Lat Pulldown (Cable)',
    primary_muscle_group: 'lats',
    secondary_muscle_groups: ['biceps', 'upper_back'],
    equipment: 'cable',
    type: 'weight_reps',
    instructions: 'Grip slightly wider than shoulders, lean slightly back, pull bar towards upper chest leading with elbows.'
  },
  {
    id: 'barbell-row',
    title: 'Bent Over Row (Barbell)',
    primary_muscle_group: 'upper_back',
    secondary_muscle_groups: ['lats', 'biceps', 'lower_back'],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Hinge at hips to 45 degrees, keep neutral spine, pull bar to lower rib cage squeezing shoulder blades.'
  },
  {
    id: 'pull-up',
    title: 'Pull Up',
    primary_muscle_group: 'lats',
    secondary_muscle_groups: ['biceps', 'upper_back'],
    equipment: 'bodyweight',
    type: 'bodyweight_reps',
    instructions: 'Overhand grip, hang fully stretched, drive elbows down to ribs until chin clears bar.'
  },
  {
    id: 'seated-cable-row',
    title: 'Seated Cable Row',
    primary_muscle_group: 'upper_back',
    secondary_muscle_groups: ['lats', 'biceps'],
    equipment: 'cable',
    type: 'weight_reps',
    instructions: 'Keep back upright, pull close grip handle to naval, retracting shoulder blades fully.'
  },
  {
    id: 'dumbbell-single-arm-row',
    title: 'Dumbbell Row (Single Arm)',
    primary_muscle_group: 'lats',
    secondary_muscle_groups: ['upper_back', 'biceps'],
    equipment: 'dumbbell',
    type: 'weight_reps'
  },
  {
    id: 'face-pull',
    title: 'Face Pull',
    primary_muscle_group: 'upper_back',
    secondary_muscle_groups: ['shoulders', 'traps'],
    equipment: 'cable',
    type: 'weight_reps',
    instructions: 'Use rope attachment, pull towards eye level while rotating hands outward to engage rear delts.'
  },

  // SHOULDERS
  {
    id: 'overhead-press-barbell',
    title: 'Overhead Press (Barbell)',
    primary_muscle_group: 'shoulders',
    secondary_muscle_groups: ['triceps', 'upper_back', 'abdominals'],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Grip just outside shoulders, brace core and glutes, press bar vertically overhead locking arms.'
  },
  {
    id: 'dumbbell-shoulder-press',
    title: 'Dumbbell Shoulder Press',
    primary_muscle_group: 'shoulders',
    secondary_muscle_groups: ['triceps'],
    equipment: 'dumbbell',
    type: 'weight_reps'
  },
  {
    id: 'lateral-raise-dumbbell',
    title: 'Lateral Raise (Dumbbell)',
    primary_muscle_group: 'shoulders',
    secondary_muscle_groups: ['traps'],
    equipment: 'dumbbell',
    type: 'weight_reps',
    instructions: 'Lead with elbows, raise dumbbells to shoulder level with slight forward tilt like pouring water.'
  },
  {
    id: 'cable-lateral-raise',
    title: 'Lateral Raise (Cable)',
    primary_muscle_group: 'shoulders',
    secondary_muscle_groups: [],
    equipment: 'cable',
    type: 'weight_reps'
  },
  {
    id: 'reverse-pec-deck',
    title: 'Reverse Pec Deck (Rear Delt Fly)',
    primary_muscle_group: 'shoulders',
    secondary_muscle_groups: ['upper_back'],
    equipment: 'machine',
    type: 'weight_reps'
  },

  // ARMS - BICEPS
  {
    id: 'barbell-curl',
    title: 'Barbell Bicep Curl',
    primary_muscle_group: 'biceps',
    secondary_muscle_groups: ['forearms'],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Keep elbows pinned to sides, curl bar smoothly without swinging torso, squeeze at top.'
  },
  {
    id: 'dumbbell-hammer-curl',
    title: 'Hammer Curl (Dumbbell)',
    primary_muscle_group: 'biceps',
    secondary_muscle_groups: ['forearms'],
    equipment: 'dumbbell',
    type: 'weight_reps',
    instructions: 'Palms facing each other throughout the lift to target brachialis and forearm.'
  },
  {
    id: 'incline-dumbbell-curl',
    title: 'Incline Dumbbell Curl',
    primary_muscle_group: 'biceps',
    secondary_muscle_groups: [],
    equipment: 'dumbbell',
    type: 'weight_reps'
  },
  {
    id: 'preacher-curl',
    title: 'Preacher Curl (EZ Bar / Machine)',
    primary_muscle_group: 'biceps',
    secondary_muscle_groups: [],
    equipment: 'barbell',
    type: 'weight_reps'
  },

  // ARMS - TRICEPS
  {
    id: 'triceps-rope-pushdown',
    title: 'Triceps Pushdown (Rope)',
    primary_muscle_group: 'triceps',
    secondary_muscle_groups: [],
    equipment: 'cable',
    type: 'weight_reps',
    instructions: 'Lock elbows at ribs, push rope down and spread hands apart at bottom contraction.'
  },
  {
    id: 'skull-crusher-barbell',
    title: 'Skull Crusher (Lying Triceps Extension)',
    primary_muscle_group: 'triceps',
    secondary_muscle_groups: [],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Lie on bench, lower bar toward forehead or just behind crown, press back up.'
  },
  {
    id: 'overhead-triceps-extension-cable',
    title: 'Overhead Triceps Extension (Cable)',
    primary_muscle_group: 'triceps',
    secondary_muscle_groups: [],
    equipment: 'cable',
    type: 'weight_reps'
  },

  // LEGS - QUADS
  {
    id: 'squat-barbell',
    title: 'Squat (Barbell)',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: ['glutes', 'hamstrings', 'lower_back', 'abdominals'],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Bar resting on upper traps or rear delts. Descend below parallel keeping chest proud, drive up through midfoot.'
  },
  {
    id: 'leg-press',
    title: 'Leg Press',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: ['glutes', 'calves'],
    equipment: 'machine',
    type: 'weight_reps',
    instructions: 'Feet shoulder-width on platform. Lower sled until knees hit 90 degrees, press without locking knees.'
  },
  {
    id: 'leg-extension',
    title: 'Leg Extension',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: [],
    equipment: 'machine',
    type: 'weight_reps',
    instructions: 'Extend legs to full lockout, pause 1 second at top squeeze, control negative.'
  },
  {
    id: 'bulgarian-split-squat',
    title: 'Bulgarian Split Squat',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: ['glutes', 'hamstrings'],
    equipment: 'dumbbell',
    type: 'weight_reps'
  },
  {
    id: 'hack-squat',
    title: 'Hack Squat Machine',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: ['glutes'],
    equipment: 'machine',
    type: 'weight_reps'
  },

  // LEGS - HAMSTRINGS & GLUTES
  {
    id: 'romanian-deadlift',
    title: 'Romanian Deadlift (Barbell / Dumbbell)',
    primary_muscle_group: 'hamstrings',
    secondary_muscle_groups: ['glutes', 'lower_back'],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Slight knee bend, push hips far back until deep hamstring stretch, drive hips forward to lockout.'
  },
  {
    id: 'lying-leg-curl',
    title: 'Lying Leg Curl',
    primary_muscle_group: 'hamstrings',
    secondary_muscle_groups: ['calves'],
    equipment: 'machine',
    type: 'weight_reps',
    instructions: 'Pad just below calves, curl weight toward glutes keeping hips flat against pad.'
  },
  {
    id: 'hip-thrust-barbell',
    title: 'Hip Thrust (Barbell)',
    primary_muscle_group: 'glutes',
    secondary_muscle_groups: ['hamstrings', 'quadriceps'],
    equipment: 'barbell',
    type: 'weight_reps',
    instructions: 'Upper back against bench, barbell padded across hips, drive hips up until thighs and torso align.'
  },

  // CALVES
  {
    id: 'standing-calf-raise',
    title: 'Standing Calf Raise',
    primary_muscle_group: 'calves',
    secondary_muscle_groups: [],
    equipment: 'machine',
    type: 'weight_reps',
    instructions: 'Balls of feet on edge, lower heels for full deep stretch, rise onto toes and squeeze.'
  },
  {
    id: 'seated-calf-raise',
    title: 'Seated Calf Raise',
    primary_muscle_group: 'calves',
    secondary_muscle_groups: [],
    equipment: 'machine',
    type: 'weight_reps'
  },

  // CORE / ABS
  {
    id: 'cable-woodchopper',
    title: 'Cable Woodchopper',
    primary_muscle_group: 'abdominals',
    secondary_muscle_groups: ['shoulders'],
    equipment: 'cable',
    type: 'weight_reps'
  },
  {
    id: 'hanging-leg-raise',
    title: 'Hanging Leg Raise',
    primary_muscle_group: 'abdominals',
    secondary_muscle_groups: ['forearms'],
    equipment: 'bodyweight',
    type: 'bodyweight_reps',
    instructions: 'Hang from pull-up bar, raise straight legs to parallel or chest level without swinging.'
  },
  {
    id: 'plank',
    title: 'Plank',
    primary_muscle_group: 'abdominals',
    secondary_muscle_groups: ['shoulders', 'lower_back'],
    equipment: 'bodyweight',
    type: 'duration'
  },
  {
    id: 'ab-wheel-rollout',
    title: 'Ab Wheel Rollout',
    primary_muscle_group: 'abdominals',
    secondary_muscle_groups: ['lats', 'shoulders'],
    equipment: 'other',
    type: 'bodyweight_reps'
  },

  // CARDIO
  {
    id: 'treadmill-running',
    title: 'Treadmill Running',
    primary_muscle_group: 'cardio',
    secondary_muscle_groups: ['calves', 'quadriceps'],
    equipment: 'machine',
    type: 'distance_duration'
  },
  {
    id: 'stationary-bike',
    title: 'Stationary Bike',
    primary_muscle_group: 'cardio',
    secondary_muscle_groups: ['quadriceps'],
    equipment: 'machine',
    type: 'distance_duration'
  },
  {
    id: 'stair-climber',
    title: 'Stair Climber',
    primary_muscle_group: 'cardio',
    secondary_muscle_groups: ['calves', 'glutes', 'quadriceps'],
    equipment: 'machine',
    type: 'duration'
  }
];
