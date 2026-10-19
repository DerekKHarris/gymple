import type { Equipment, Exercise, Muscle, Pattern } from '@/lib/types';

/**
 * Exercise library. Each plan slot names a movement pattern plus preferred exercises;
 * when the user lacks the equipment for those, any other exercise with the same
 * pattern that they can do is used instead.
 */
export const EXERCISES: Exercise[] = [
  // Squat pattern
  { id: 'back_squat', name: 'Barbell Back Squat', pattern: 'squat', primary: 'quads', equipment: ['barbell', 'rack'], load: 'barbell', compound: true, lowerBody: true, cue: 'Brace, sit between your hips, knees track over toes.' },
  { id: 'front_squat', name: 'Barbell Front Squat', pattern: 'squat', primary: 'quads', equipment: ['barbell', 'rack'], load: 'barbell', compound: true, lowerBody: true, cue: 'Elbows high, stay upright.' },
  { id: 'leg_press', name: 'Leg Press', pattern: 'squat', primary: 'quads', equipment: ['machine'], load: 'machine', compound: true, lowerBody: true },
  { id: 'hack_squat', name: 'Hack Squat', pattern: 'squat', primary: 'quads', equipment: ['machine'], load: 'machine', compound: true, lowerBody: true },
  { id: 'goblet_squat', name: 'Goblet Squat', pattern: 'squat', primary: 'quads', equipment: ['dumbbell'], load: 'dumbbell', compound: true, lowerBody: true, cue: 'Hold one dumbbell at your chest.' },
  { id: 'kb_goblet_squat', name: 'Kettlebell Goblet Squat', pattern: 'squat', primary: 'quads', equipment: ['kettlebell'], load: 'kettlebell', compound: true, lowerBody: true },
  { id: 'band_squat', name: 'Banded Squat', pattern: 'squat', primary: 'quads', equipment: ['bands'], load: 'band', compound: true, lowerBody: true },
  { id: 'bw_squat', name: 'Bodyweight Squat', pattern: 'squat', primary: 'quads', equipment: [], load: 'bodyweight', compound: true, lowerBody: true },

  // Hinge pattern
  { id: 'deadlift', name: 'Barbell Deadlift', pattern: 'hinge', primary: 'hamstrings', equipment: ['barbell'], load: 'barbell', compound: true, lowerBody: true, cue: 'Bar over mid-foot, push the floor away.' },
  { id: 'rdl', name: 'Romanian Deadlift', pattern: 'hinge', primary: 'hamstrings', equipment: ['barbell'], load: 'barbell', compound: true, lowerBody: true, cue: 'Soft knees, push hips back until hamstrings stretch.' },
  { id: 'db_rdl', name: 'Dumbbell Romanian Deadlift', pattern: 'hinge', primary: 'hamstrings', equipment: ['dumbbell'], load: 'dumbbell', compound: true, lowerBody: true },
  { id: 'kb_swing', name: 'Kettlebell Swing', pattern: 'hinge', primary: 'glutes', equipment: ['kettlebell'], load: 'kettlebell', compound: true, lowerBody: true },
  { id: 'kb_deadlift', name: 'Kettlebell Deadlift', pattern: 'hinge', primary: 'hamstrings', equipment: ['kettlebell'], load: 'kettlebell', compound: true, lowerBody: true },
  { id: 'band_good_morning', name: 'Banded Good Morning', pattern: 'hinge', primary: 'hamstrings', equipment: ['bands'], load: 'band', compound: true, lowerBody: true },
  { id: 'single_leg_rdl', name: 'Single-Leg Hip Hinge', pattern: 'hinge', primary: 'hamstrings', equipment: [], load: 'bodyweight', compound: true, lowerBody: true },

  // Lunge pattern
  { id: 'bulgarian_split_squat', name: 'Dumbbell Bulgarian Split Squat', pattern: 'lunge', primary: 'quads', equipment: ['dumbbell', 'bench'], load: 'dumbbell', compound: true, lowerBody: true },
  { id: 'db_lunge', name: 'Dumbbell Walking Lunge', pattern: 'lunge', primary: 'quads', equipment: ['dumbbell'], load: 'dumbbell', compound: true, lowerBody: true },
  { id: 'bb_lunge', name: 'Barbell Reverse Lunge', pattern: 'lunge', primary: 'quads', equipment: ['barbell', 'rack'], load: 'barbell', compound: true, lowerBody: true },
  { id: 'bw_lunge', name: 'Reverse Lunge', pattern: 'lunge', primary: 'quads', equipment: [], load: 'bodyweight', compound: true, lowerBody: true },
  { id: 'bw_split_squat', name: 'Bodyweight Split Squat', pattern: 'lunge', primary: 'quads', equipment: [], load: 'bodyweight', compound: true, lowerBody: true },

  // Hip thrust / glutes
  { id: 'hip_thrust', name: 'Barbell Hip Thrust', pattern: 'hip_thrust', primary: 'glutes', equipment: ['barbell', 'bench'], load: 'barbell', compound: true, lowerBody: true },
  { id: 'db_hip_thrust', name: 'Dumbbell Hip Thrust', pattern: 'hip_thrust', primary: 'glutes', equipment: ['dumbbell', 'bench'], load: 'dumbbell', compound: true, lowerBody: true },
  { id: 'glute_bridge', name: 'Glute Bridge', pattern: 'hip_thrust', primary: 'glutes', equipment: [], load: 'bodyweight', compound: true, lowerBody: true },
  { id: 'cable_pull_through', name: 'Cable Pull-Through', pattern: 'hip_thrust', primary: 'glutes', equipment: ['cable'], load: 'cable', compound: true, lowerBody: true },

  // Horizontal push
  { id: 'bench_press', name: 'Barbell Bench Press', pattern: 'horizontal_push', primary: 'chest', equipment: ['barbell', 'bench', 'rack'], load: 'barbell', compound: true, lowerBody: false, cue: 'Shoulder blades pinned, bar to lower chest.' },
  { id: 'db_bench_press', name: 'Dumbbell Bench Press', pattern: 'horizontal_push', primary: 'chest', equipment: ['dumbbell', 'bench'], load: 'dumbbell', compound: true, lowerBody: false },
  { id: 'machine_chest_press', name: 'Machine Chest Press', pattern: 'horizontal_push', primary: 'chest', equipment: ['machine'], load: 'machine', compound: true, lowerBody: false },
  { id: 'db_floor_press', name: 'Dumbbell Floor Press', pattern: 'horizontal_push', primary: 'chest', equipment: ['dumbbell'], load: 'dumbbell', compound: true, lowerBody: false },
  { id: 'band_chest_press', name: 'Banded Chest Press', pattern: 'horizontal_push', primary: 'chest', equipment: ['bands'], load: 'band', compound: true, lowerBody: false },
  { id: 'push_up', name: 'Push-Up', pattern: 'horizontal_push', primary: 'chest', equipment: [], load: 'bodyweight', compound: true, lowerBody: false },
  { id: 'dip', name: 'Dip', pattern: 'horizontal_push', primary: 'chest', equipment: ['pullup_bar'], load: 'bodyweight', compound: true, lowerBody: false, cue: 'Uses a dip station or parallel bars.' },

  // Incline push
  { id: 'incline_bench', name: 'Incline Barbell Bench Press', pattern: 'incline_push', primary: 'chest', equipment: ['barbell', 'bench', 'rack'], load: 'barbell', compound: true, lowerBody: false },
  { id: 'incline_db_press', name: 'Incline Dumbbell Press', pattern: 'incline_push', primary: 'chest', equipment: ['dumbbell', 'bench'], load: 'dumbbell', compound: true, lowerBody: false },
  { id: 'incline_machine_press', name: 'Incline Machine Press', pattern: 'incline_push', primary: 'chest', equipment: ['machine'], load: 'machine', compound: true, lowerBody: false },
  { id: 'decline_push_up', name: 'Feet-Elevated Push-Up', pattern: 'incline_push', primary: 'chest', equipment: [], load: 'bodyweight', compound: true, lowerBody: false },

  // Vertical push
  { id: 'ohp', name: 'Overhead Press', pattern: 'vertical_push', primary: 'shoulders', equipment: ['barbell', 'rack'], load: 'barbell', compound: true, lowerBody: false, cue: 'Squeeze glutes, press straight up past your face.' },
  { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press', pattern: 'vertical_push', primary: 'shoulders', equipment: ['dumbbell'], load: 'dumbbell', compound: true, lowerBody: false },
  { id: 'machine_shoulder_press', name: 'Machine Shoulder Press', pattern: 'vertical_push', primary: 'shoulders', equipment: ['machine'], load: 'machine', compound: true, lowerBody: false },
  { id: 'kb_press', name: 'Kettlebell Overhead Press', pattern: 'vertical_push', primary: 'shoulders', equipment: ['kettlebell'], load: 'kettlebell', compound: true, lowerBody: false },
  { id: 'band_overhead_press', name: 'Banded Overhead Press', pattern: 'vertical_push', primary: 'shoulders', equipment: ['bands'], load: 'band', compound: true, lowerBody: false },
  { id: 'pike_push_up', name: 'Pike Push-Up', pattern: 'vertical_push', primary: 'shoulders', equipment: [], load: 'bodyweight', compound: true, lowerBody: false },

  // Horizontal pull
  { id: 'barbell_row', name: 'Barbell Row', pattern: 'horizontal_pull', primary: 'back', equipment: ['barbell'], load: 'barbell', compound: true, lowerBody: false, cue: 'Flat back, pull to your lower ribs.' },
  { id: 'db_row', name: 'One-Arm Dumbbell Row', pattern: 'horizontal_pull', primary: 'back', equipment: ['dumbbell'], load: 'dumbbell', compound: true, lowerBody: false },
  { id: 'chest_supported_row', name: 'Chest-Supported Dumbbell Row', pattern: 'horizontal_pull', primary: 'back', equipment: ['dumbbell', 'bench'], load: 'dumbbell', compound: true, lowerBody: false },
  { id: 'seated_cable_row', name: 'Seated Cable Row', pattern: 'horizontal_pull', primary: 'back', equipment: ['cable'], load: 'cable', compound: true, lowerBody: false },
  { id: 'machine_row', name: 'Machine Row', pattern: 'horizontal_pull', primary: 'back', equipment: ['machine'], load: 'machine', compound: true, lowerBody: false },
  { id: 'kb_row', name: 'Kettlebell Row', pattern: 'horizontal_pull', primary: 'back', equipment: ['kettlebell'], load: 'kettlebell', compound: true, lowerBody: false },
  { id: 'band_row', name: 'Banded Row', pattern: 'horizontal_pull', primary: 'back', equipment: ['bands'], load: 'band', compound: true, lowerBody: false },
  { id: 'towel_row', name: 'Doorway Towel Row', pattern: 'horizontal_pull', primary: 'back', equipment: [], load: 'bodyweight', compound: true, lowerBody: false, cue: 'Loop a towel around both sides of a sturdy, closed door and lean back.' },
  { id: 'inverted_row', name: 'Inverted Row', pattern: 'horizontal_pull', primary: 'back', equipment: ['pullup_bar'], load: 'bodyweight', compound: true, lowerBody: false, cue: 'Use a low bar or a sturdy table edge.' },

  // Vertical pull
  { id: 'pull_up', name: 'Pull-Up', pattern: 'vertical_pull', primary: 'back', equipment: ['pullup_bar'], load: 'bodyweight', compound: true, lowerBody: false },
  { id: 'chin_up', name: 'Chin-Up', pattern: 'vertical_pull', primary: 'back', equipment: ['pullup_bar'], load: 'bodyweight', compound: true, lowerBody: false },
  { id: 'lat_pulldown', name: 'Lat Pulldown', pattern: 'vertical_pull', primary: 'back', equipment: ['cable'], load: 'cable', compound: true, lowerBody: false },
  { id: 'machine_pulldown', name: 'Machine Pulldown', pattern: 'vertical_pull', primary: 'back', equipment: ['machine'], load: 'machine', compound: true, lowerBody: false },
  { id: 'band_pulldown', name: 'Banded Lat Pulldown', pattern: 'vertical_pull', primary: 'back', equipment: ['bands'], load: 'band', compound: true, lowerBody: false },
  { id: 'db_pullover', name: 'Dumbbell Pullover', pattern: 'vertical_pull', primary: 'back', equipment: ['dumbbell', 'bench'], load: 'dumbbell', compound: false, lowerBody: false },
  { id: 'superman_pull', name: 'Prone Y-T-W Raise', pattern: 'vertical_pull', primary: 'back', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },

  // Chest fly
  { id: 'cable_fly', name: 'Cable Fly', pattern: 'chest_fly', primary: 'chest', equipment: ['cable'], load: 'cable', compound: false, lowerBody: false },
  { id: 'db_fly', name: 'Dumbbell Fly', pattern: 'chest_fly', primary: 'chest', equipment: ['dumbbell', 'bench'], load: 'dumbbell', compound: false, lowerBody: false },
  { id: 'pec_deck', name: 'Pec Deck', pattern: 'chest_fly', primary: 'chest', equipment: ['machine'], load: 'machine', compound: false, lowerBody: false },
  { id: 'band_fly', name: 'Banded Chest Fly', pattern: 'chest_fly', primary: 'chest', equipment: ['bands'], load: 'band', compound: false, lowerBody: false },
  { id: 'wide_push_up', name: 'Wide Push-Up', pattern: 'chest_fly', primary: 'chest', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },

  // Shoulders
  { id: 'db_lateral_raise', name: 'Dumbbell Lateral Raise', pattern: 'lateral_raise', primary: 'shoulders', equipment: ['dumbbell'], load: 'dumbbell', compound: false, lowerBody: false },
  { id: 'cable_lateral_raise', name: 'Cable Lateral Raise', pattern: 'lateral_raise', primary: 'shoulders', equipment: ['cable'], load: 'cable', compound: false, lowerBody: false },
  { id: 'band_lateral_raise', name: 'Banded Lateral Raise', pattern: 'lateral_raise', primary: 'shoulders', equipment: ['bands'], load: 'band', compound: false, lowerBody: false },
  { id: 'face_pull', name: 'Cable Face Pull', pattern: 'rear_delt', primary: 'shoulders', equipment: ['cable'], load: 'cable', compound: false, lowerBody: false },
  { id: 'reverse_db_fly', name: 'Reverse Dumbbell Fly', pattern: 'rear_delt', primary: 'shoulders', equipment: ['dumbbell'], load: 'dumbbell', compound: false, lowerBody: false },
  { id: 'reverse_pec_deck', name: 'Reverse Pec Deck', pattern: 'rear_delt', primary: 'shoulders', equipment: ['machine'], load: 'machine', compound: false, lowerBody: false },
  { id: 'band_pull_apart', name: 'Band Pull-Apart', pattern: 'rear_delt', primary: 'shoulders', equipment: ['bands'], load: 'band', compound: false, lowerBody: false },
  { id: 'prone_t_raise', name: 'Prone T Raise', pattern: 'rear_delt', primary: 'shoulders', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },

  // Arms
  { id: 'barbell_curl', name: 'Barbell Curl', pattern: 'biceps_curl', primary: 'biceps', equipment: ['barbell'], load: 'barbell', compound: false, lowerBody: false },
  { id: 'db_curl', name: 'Dumbbell Curl', pattern: 'biceps_curl', primary: 'biceps', equipment: ['dumbbell'], load: 'dumbbell', compound: false, lowerBody: false },
  { id: 'hammer_curl', name: 'Hammer Curl', pattern: 'biceps_curl', primary: 'biceps', equipment: ['dumbbell'], load: 'dumbbell', compound: false, lowerBody: false },
  { id: 'cable_curl', name: 'Cable Curl', pattern: 'biceps_curl', primary: 'biceps', equipment: ['cable'], load: 'cable', compound: false, lowerBody: false },
  { id: 'kb_curl', name: 'Kettlebell Curl', pattern: 'biceps_curl', primary: 'biceps', equipment: ['kettlebell'], load: 'kettlebell', compound: false, lowerBody: false },
  { id: 'band_curl', name: 'Banded Curl', pattern: 'biceps_curl', primary: 'biceps', equipment: ['bands'], load: 'band', compound: false, lowerBody: false },
  { id: 'towel_curl', name: 'Isometric Towel Curl', pattern: 'biceps_curl', primary: 'biceps', equipment: [], load: 'bodyweight', compound: false, lowerBody: false, timed: true },
  { id: 'triceps_pushdown', name: 'Triceps Pushdown', pattern: 'triceps_ext', primary: 'triceps', equipment: ['cable'], load: 'cable', compound: false, lowerBody: false },
  { id: 'skull_crusher', name: 'EZ-Bar Skull Crusher', pattern: 'triceps_ext', primary: 'triceps', equipment: ['barbell', 'bench'], load: 'barbell', compound: false, lowerBody: false },
  { id: 'db_overhead_ext', name: 'Dumbbell Overhead Triceps Extension', pattern: 'triceps_ext', primary: 'triceps', equipment: ['dumbbell'], load: 'dumbbell', compound: false, lowerBody: false },
  { id: 'band_pushdown', name: 'Banded Triceps Pushdown', pattern: 'triceps_ext', primary: 'triceps', equipment: ['bands'], load: 'band', compound: false, lowerBody: false },
  { id: 'bench_dip', name: 'Bench Dip', pattern: 'triceps_ext', primary: 'triceps', equipment: [], load: 'bodyweight', compound: false, lowerBody: false, cue: 'Hands on a bench, chair or step.' },
  { id: 'diamond_push_up', name: 'Diamond Push-Up', pattern: 'triceps_ext', primary: 'triceps', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },

  // Leg isolation
  { id: 'leg_extension', name: 'Leg Extension', pattern: 'leg_ext', primary: 'quads', equipment: ['machine'], load: 'machine', compound: false, lowerBody: true },
  { id: 'band_leg_ext', name: 'Banded Leg Extension', pattern: 'leg_ext', primary: 'quads', equipment: ['bands'], load: 'band', compound: false, lowerBody: true },
  { id: 'wall_sit', name: 'Wall Sit', pattern: 'leg_ext', primary: 'quads', equipment: [], load: 'bodyweight', compound: false, lowerBody: true, timed: true },
  { id: 'leg_curl', name: 'Lying Leg Curl', pattern: 'leg_curl', primary: 'hamstrings', equipment: ['machine'], load: 'machine', compound: false, lowerBody: true },
  { id: 'cable_leg_curl', name: 'Cable Leg Curl', pattern: 'leg_curl', primary: 'hamstrings', equipment: ['cable'], load: 'cable', compound: false, lowerBody: true },
  { id: 'db_leg_curl', name: 'Dumbbell Leg Curl', pattern: 'leg_curl', primary: 'hamstrings', equipment: ['dumbbell', 'bench'], load: 'dumbbell', compound: false, lowerBody: true },
  { id: 'band_leg_curl', name: 'Banded Leg Curl', pattern: 'leg_curl', primary: 'hamstrings', equipment: ['bands'], load: 'band', compound: false, lowerBody: true },
  { id: 'slider_leg_curl', name: 'Slider Hamstring Curl', pattern: 'leg_curl', primary: 'hamstrings', equipment: [], load: 'bodyweight', compound: false, lowerBody: true, cue: 'Heels on towels or sliders, bridge up and curl.' },
  { id: 'standing_calf_raise', name: 'Standing Calf Raise', pattern: 'calf_raise', primary: 'calves', equipment: ['machine'], load: 'machine', compound: false, lowerBody: true },
  { id: 'db_calf_raise', name: 'Dumbbell Calf Raise', pattern: 'calf_raise', primary: 'calves', equipment: ['dumbbell'], load: 'dumbbell', compound: false, lowerBody: true },
  { id: 'bw_calf_raise', name: 'Single-Leg Calf Raise', pattern: 'calf_raise', primary: 'calves', equipment: [], load: 'bodyweight', compound: false, lowerBody: true },

  // Core
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', pattern: 'core_flexion', primary: 'abs', equipment: ['pullup_bar'], load: 'bodyweight', compound: false, lowerBody: false },
  { id: 'cable_crunch', name: 'Cable Crunch', pattern: 'core_flexion', primary: 'abs', equipment: ['cable'], load: 'cable', compound: false, lowerBody: false },
  { id: 'ab_crunch_machine', name: 'Ab Crunch Machine', pattern: 'core_flexion', primary: 'abs', equipment: ['machine'], load: 'machine', compound: false, lowerBody: false },
  { id: 'db_crunch', name: 'Weighted Crunch', pattern: 'core_flexion', primary: 'abs', equipment: ['dumbbell'], load: 'dumbbell', compound: false, lowerBody: false },
  { id: 'reverse_crunch', name: 'Reverse Crunch', pattern: 'core_flexion', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },
  { id: 'crunch', name: 'Crunch', pattern: 'core_flexion', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },
  { id: 'lying_leg_raise', name: 'Lying Leg Raise', pattern: 'core_flexion', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },
  { id: 'plank', name: 'Plank', pattern: 'core_stability', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false, timed: true },
  { id: 'side_plank', name: 'Side Plank', pattern: 'core_stability', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false, timed: true },
  { id: 'dead_bug', name: 'Dead Bug', pattern: 'core_stability', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },
  { id: 'ab_wheel', name: 'Ab Wheel Rollout', pattern: 'core_stability', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false, cue: 'Needs an ab wheel; a barbell with round plates works too.' },
  { id: 'suitcase_carry', name: 'Suitcase Carry', pattern: 'core_stability', primary: 'abs', equipment: ['dumbbell'], load: 'dumbbell', compound: false, lowerBody: false, timed: true },
  { id: 'pallof_press', name: 'Pallof Press', pattern: 'core_rotation', primary: 'abs', equipment: ['cable'], load: 'cable', compound: false, lowerBody: false },
  { id: 'band_pallof_press', name: 'Banded Pallof Press', pattern: 'core_rotation', primary: 'abs', equipment: ['bands'], load: 'band', compound: false, lowerBody: false },
  { id: 'cable_woodchop', name: 'Cable Woodchop', pattern: 'core_rotation', primary: 'abs', equipment: ['cable'], load: 'cable', compound: false, lowerBody: false },
  { id: 'russian_twist', name: 'Russian Twist', pattern: 'core_rotation', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },
  { id: 'bicycle_crunch', name: 'Bicycle Crunch', pattern: 'core_rotation', primary: 'abs', equipment: [], load: 'bodyweight', compound: false, lowerBody: false },
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  const exercise = BY_ID.get(id);
  if (!exercise) throw new Error(`Unknown exercise: ${id}`);
  return exercise;
}

export function findExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

export function canPerform(exercise: Exercise, equipment: Equipment[]): boolean {
  return exercise.equipment.every((item) => equipment.includes(item));
}

export function availableExercises(equipment: Equipment[]): Exercise[] {
  return EXERCISES.filter((e) => canPerform(e, equipment));
}

export function alternativesFor(exercise: Exercise, equipment: Equipment[]): Exercise[] {
  return availableExercises(equipment).filter((e) => e.id !== exercise.id && e.pattern === exercise.pattern);
}

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs & core',
};

export const PATTERN_LABELS: Record<Pattern, string> = {
  squat: 'Squat',
  hinge: 'Hinge',
  lunge: 'Lunge',
  hip_thrust: 'Hip thrust',
  horizontal_push: 'Horizontal push',
  incline_push: 'Incline push',
  vertical_push: 'Overhead push',
  horizontal_pull: 'Row',
  vertical_pull: 'Vertical pull',
  chest_fly: 'Chest fly',
  lateral_raise: 'Lateral raise',
  rear_delt: 'Rear delt',
  biceps_curl: 'Biceps',
  triceps_ext: 'Triceps',
  leg_ext: 'Quad isolation',
  leg_curl: 'Hamstring curl',
  calf_raise: 'Calves',
  core_flexion: 'Abs',
  core_stability: 'Core stability',
  core_rotation: 'Obliques',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell & plates',
  rack: 'Squat rack',
  bench: 'Bench',
  dumbbell: 'Dumbbells',
  kettlebell: 'Kettlebells',
  cable: 'Cable machine',
  machine: 'Weight machines',
  pullup_bar: 'Pull-up / dip bar',
  bands: 'Resistance bands',
};
