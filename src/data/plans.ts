import type { Pattern, Plan, PlanSlot, Role } from '@/lib/types';

const slot = (pattern: Pattern, role: Role, ...prefer: string[]): PlanSlot => ({ pattern, role, prefer });

const main = (pattern: Pattern, ...prefer: string[]) => slot(pattern, 'main', ...prefer);
const acc = (pattern: Pattern, ...prefer: string[]) => slot(pattern, 'accessory', ...prefer);
const core = (pattern: Pattern, ...prefer: string[]) => slot(pattern, 'core', ...prefer);

/**
 * Plan templates. Each is modelled on a widely used program; sets and reps come from
 * the user's goal and the week of the 12-week block (see lib/periodization.ts), so the
 * same split serves strength, muscle or fat-loss goals.
 */
export const PLANS: Plan[] = [
  {
    id: 'full_body_3',
    name: 'Full Body 3-Day',
    tagline: 'The classic beginner program: big lifts, three days a week',
    description:
      'Every session trains the whole body with squats plus a push, a pull and a hinge. Weight goes up every session you hit your reps, which is the fastest way for a new lifter to get stronger.',
    split: 'full_body',
    daysPerWeek: 3,
    schedule: 'Mon · Wed · Fri',
    levels: ['beginner'],
    bestFor: ['strength', 'general'],
    basis:
      'Modelled on StrongLifts 5×5 and Starting Strength: few compound lifts, trained often, with session-to-session linear progression and a 10% reset after three stalled sessions.',
    days: [
      {
        name: 'Day A',
        focus: 'Squat · Bench · Row',
        slots: [
          main('squat', 'back_squat', 'goblet_squat', 'leg_press'),
          main('horizontal_push', 'bench_press', 'db_bench_press', 'push_up'),
          main('horizontal_pull', 'barbell_row', 'db_row', 'inverted_row'),
          core('core_stability', 'plank'),
        ],
      },
      {
        name: 'Day B',
        focus: 'Squat · Press · Deadlift',
        slots: [
          main('squat', 'back_squat', 'goblet_squat', 'leg_press'),
          main('vertical_push', 'ohp', 'db_shoulder_press', 'pike_push_up'),
          main('hinge', 'deadlift', 'db_rdl', 'kb_deadlift'),
          acc('vertical_pull', 'chin_up', 'lat_pulldown', 'band_pulldown'),
        ],
      },
      {
        name: 'Day C',
        focus: 'Squat · Incline · Row',
        slots: [
          main('squat', 'front_squat', 'back_squat', 'goblet_squat'),
          main('incline_push', 'incline_bench', 'incline_db_press', 'decline_push_up'),
          main('horizontal_pull', 'barbell_row', 'chest_supported_row', 'inverted_row'),
          core('core_flexion', 'hanging_leg_raise', 'reverse_crunch'),
        ],
      },
    ],
  },
  {
    id: 'full_body_2',
    name: 'Minimalist Full Body 2-Day',
    tagline: 'Two efficient sessions for a busy week',
    description:
      'Two whole-body sessions that hit every major muscle twice a week. Great when time is tight, or alongside running or sport.',
    split: 'full_body',
    daysPerWeek: 2,
    schedule: 'Tue · Fri',
    levels: ['beginner', 'intermediate'],
    bestFor: ['general', 'fat_loss'],
    basis:
      'Follows the ACSM guidance that training each muscle group about twice a week with multi-joint lifts gives most of the benefit for general fitness.',
    days: [
      {
        name: 'Day A',
        focus: 'Squat · Push · Pull',
        slots: [
          main('squat', 'back_squat', 'goblet_squat', 'leg_press', 'bw_squat'),
          main('horizontal_push', 'bench_press', 'db_bench_press', 'push_up'),
          main('horizontal_pull', 'seated_cable_row', 'db_row', 'inverted_row'),
          acc('lunge', 'db_lunge', 'bw_lunge'),
          acc('lateral_raise', 'db_lateral_raise', 'band_lateral_raise'),
          core('core_stability', 'plank'),
        ],
      },
      {
        name: 'Day B',
        focus: 'Hinge · Press · Pulldown',
        slots: [
          main('hinge', 'deadlift', 'rdl', 'db_rdl', 'kb_swing'),
          main('vertical_push', 'ohp', 'db_shoulder_press', 'pike_push_up'),
          main('vertical_pull', 'pull_up', 'lat_pulldown', 'band_pulldown'),
          acc('hip_thrust', 'hip_thrust', 'db_hip_thrust', 'glute_bridge'),
          acc('biceps_curl', 'db_curl', 'band_curl'),
          core('core_flexion', 'reverse_crunch'),
        ],
      },
    ],
  },
  {
    id: 'upper_lower_4',
    name: 'Upper / Lower 4-Day (PHUL)',
    tagline: 'Power days and hypertrophy days for strength and size',
    description:
      'Two upper and two lower sessions a week. The first half of the week is heavier power work; the second half adds volume with more isolation exercises.',
    split: 'upper_lower',
    daysPerWeek: 4,
    schedule: 'Mon · Tue · Thu · Fri',
    levels: ['intermediate', 'advanced'],
    bestFor: ['hypertrophy', 'strength'],
    basis:
      'Modelled on PHUL (Power Hypertrophy Upper Lower): four sessions, each muscle trained twice a week, combining heavy compound work with hypertrophy volume.',
    days: [
      {
        name: 'Upper Power',
        focus: 'Chest · Back · Shoulders',
        slots: [
          main('horizontal_push', 'bench_press', 'db_bench_press', 'machine_chest_press', 'push_up'),
          main('horizontal_pull', 'barbell_row', 'db_row', 'seated_cable_row', 'inverted_row'),
          acc('vertical_push', 'ohp', 'db_shoulder_press', 'pike_push_up'),
          acc('vertical_pull', 'pull_up', 'lat_pulldown', 'band_pulldown'),
          acc('biceps_curl', 'barbell_curl', 'db_curl', 'band_curl'),
          acc('triceps_ext', 'skull_crusher', 'triceps_pushdown', 'db_overhead_ext', 'diamond_push_up'),
        ],
      },
      {
        name: 'Lower Power',
        focus: 'Quads · Hamstrings · Glutes',
        slots: [
          main('squat', 'back_squat', 'leg_press', 'goblet_squat', 'bw_squat'),
          main('hinge', 'deadlift', 'rdl', 'db_rdl', 'kb_deadlift'),
          acc('squat', 'leg_press', 'hack_squat', 'goblet_squat'),
          acc('leg_curl', 'leg_curl', 'db_leg_curl', 'slider_leg_curl'),
          acc('calf_raise', 'standing_calf_raise', 'db_calf_raise', 'bw_calf_raise'),
          core('core_stability', 'plank', 'ab_wheel'),
        ],
      },
      {
        name: 'Upper Hypertrophy',
        focus: 'Chest · Back · Arms',
        slots: [
          acc('incline_push', 'incline_db_press', 'incline_machine_press', 'decline_push_up'),
          acc('chest_fly', 'cable_fly', 'db_fly', 'pec_deck', 'wide_push_up'),
          acc('horizontal_pull', 'seated_cable_row', 'chest_supported_row', 'db_row', 'band_row'),
          acc('lateral_raise', 'db_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise'),
          acc('biceps_curl', 'hammer_curl', 'cable_curl', 'band_curl'),
          acc('triceps_ext', 'triceps_pushdown', 'db_overhead_ext', 'bench_dip'),
        ],
      },
      {
        name: 'Lower Hypertrophy',
        focus: 'Legs · Glutes · Abs',
        slots: [
          acc('squat', 'front_squat', 'hack_squat', 'leg_press', 'goblet_squat'),
          acc('lunge', 'bulgarian_split_squat', 'db_lunge', 'bw_split_squat'),
          acc('leg_ext', 'leg_extension', 'band_leg_ext', 'wall_sit'),
          acc('leg_curl', 'leg_curl', 'cable_leg_curl', 'slider_leg_curl'),
          acc('calf_raise', 'standing_calf_raise', 'db_calf_raise', 'bw_calf_raise'),
          core('core_flexion', 'cable_crunch', 'hanging_leg_raise', 'reverse_crunch'),
        ],
      },
    ],
  },
  {
    id: 'ppl_3',
    name: 'Push / Pull / Legs 3-Day',
    tagline: 'Each muscle group gets its own day',
    description:
      'Push day trains chest, shoulders and triceps; pull day trains back and biceps; leg day trains quads, hamstrings, glutes and abs. Each muscle is trained once a week with plenty of sets.',
    split: 'push_pull_legs',
    daysPerWeek: 3,
    schedule: 'Mon · Wed · Fri',
    levels: ['beginner', 'intermediate'],
    bestFor: ['hypertrophy', 'general'],
    basis:
      'The standard Push/Pull/Legs split. Grouping muscles that work together lets each session do more sets per muscle while the others recover.',
    days: [
      {
        name: 'Push',
        focus: 'Chest · Shoulders · Triceps',
        slots: [
          main('horizontal_push', 'bench_press', 'db_bench_press', 'machine_chest_press', 'push_up'),
          acc('vertical_push', 'ohp', 'db_shoulder_press', 'machine_shoulder_press', 'pike_push_up'),
          acc('incline_push', 'incline_db_press', 'incline_machine_press', 'decline_push_up'),
          acc('lateral_raise', 'db_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise'),
          acc('triceps_ext', 'triceps_pushdown', 'db_overhead_ext', 'bench_dip'),
        ],
      },
      {
        name: 'Pull',
        focus: 'Back · Biceps · Rear delts',
        slots: [
          main('hinge', 'deadlift', 'rdl', 'db_rdl', 'kb_swing'),
          acc('vertical_pull', 'pull_up', 'lat_pulldown', 'band_pulldown', 'superman_pull'),
          acc('horizontal_pull', 'barbell_row', 'seated_cable_row', 'db_row', 'inverted_row'),
          acc('rear_delt', 'face_pull', 'reverse_db_fly', 'band_pull_apart', 'prone_t_raise'),
          acc('biceps_curl', 'barbell_curl', 'db_curl', 'band_curl'),
        ],
      },
      {
        name: 'Legs',
        focus: 'Quads · Hamstrings · Glutes · Abs',
        slots: [
          main('squat', 'back_squat', 'leg_press', 'goblet_squat', 'bw_squat'),
          acc('lunge', 'bulgarian_split_squat', 'db_lunge', 'bw_lunge'),
          acc('leg_curl', 'leg_curl', 'db_leg_curl', 'slider_leg_curl'),
          acc('calf_raise', 'standing_calf_raise', 'db_calf_raise', 'bw_calf_raise'),
          core('core_flexion', 'hanging_leg_raise', 'cable_crunch', 'reverse_crunch'),
        ],
      },
    ],
  },
  {
    id: 'ppl_6',
    name: 'Push / Pull / Legs 6-Day',
    tagline: 'High-frequency PPL: every muscle twice a week',
    description:
      'Runs Push, Pull and Legs twice a week. The first rotation is heavier; the second uses different exercises and higher reps. High volume for lifters who can train six days.',
    split: 'push_pull_legs',
    daysPerWeek: 6,
    schedule: 'Mon–Sat, rest Sun',
    levels: ['intermediate', 'advanced'],
    bestFor: ['hypertrophy'],
    basis:
      'The popular 6-day PPL rotation. Training each muscle twice a week with 10+ hard sets is associated with more growth than once a week at the same session quality.',
    days: [
      {
        name: 'Push A',
        focus: 'Chest focus',
        slots: [
          main('horizontal_push', 'bench_press', 'db_bench_press', 'machine_chest_press', 'push_up'),
          acc('vertical_push', 'db_shoulder_press', 'machine_shoulder_press', 'pike_push_up'),
          acc('incline_push', 'incline_db_press', 'decline_push_up'),
          acc('lateral_raise', 'db_lateral_raise', 'band_lateral_raise'),
          acc('triceps_ext', 'triceps_pushdown', 'band_pushdown', 'bench_dip'),
        ],
      },
      {
        name: 'Pull A',
        focus: 'Back thickness',
        slots: [
          main('hinge', 'deadlift', 'rdl', 'db_rdl', 'kb_swing'),
          acc('horizontal_pull', 'barbell_row', 'db_row', 'inverted_row'),
          acc('vertical_pull', 'lat_pulldown', 'pull_up', 'band_pulldown'),
          acc('rear_delt', 'face_pull', 'reverse_db_fly', 'band_pull_apart'),
          acc('biceps_curl', 'barbell_curl', 'db_curl', 'band_curl'),
        ],
      },
      {
        name: 'Legs A',
        focus: 'Quad focus',
        slots: [
          main('squat', 'back_squat', 'leg_press', 'goblet_squat', 'bw_squat'),
          acc('hinge', 'rdl', 'db_rdl', 'single_leg_rdl'),
          acc('leg_ext', 'leg_extension', 'band_leg_ext', 'wall_sit'),
          acc('calf_raise', 'standing_calf_raise', 'db_calf_raise', 'bw_calf_raise'),
          core('core_stability', 'plank', 'ab_wheel'),
        ],
      },
      {
        name: 'Push B',
        focus: 'Shoulder focus',
        slots: [
          main('vertical_push', 'ohp', 'db_shoulder_press', 'pike_push_up'),
          acc('incline_push', 'incline_bench', 'incline_db_press', 'decline_push_up'),
          acc('chest_fly', 'cable_fly', 'db_fly', 'pec_deck', 'wide_push_up'),
          acc('lateral_raise', 'cable_lateral_raise', 'db_lateral_raise', 'band_lateral_raise'),
          acc('triceps_ext', 'db_overhead_ext', 'skull_crusher', 'diamond_push_up'),
        ],
      },
      {
        name: 'Pull B',
        focus: 'Back width',
        slots: [
          main('vertical_pull', 'pull_up', 'lat_pulldown', 'band_pulldown'),
          acc('horizontal_pull', 'seated_cable_row', 'chest_supported_row', 'band_row'),
          acc('vertical_pull', 'machine_pulldown', 'db_pullover', 'superman_pull'),
          acc('rear_delt', 'reverse_pec_deck', 'reverse_db_fly', 'prone_t_raise'),
          acc('biceps_curl', 'hammer_curl', 'cable_curl', 'band_curl'),
        ],
      },
      {
        name: 'Legs B',
        focus: 'Hamstring & glute focus',
        slots: [
          main('hinge', 'rdl', 'db_rdl', 'kb_swing', 'single_leg_rdl'),
          acc('squat', 'hack_squat', 'leg_press', 'goblet_squat'),
          acc('hip_thrust', 'hip_thrust', 'db_hip_thrust', 'glute_bridge'),
          acc('leg_curl', 'leg_curl', 'db_leg_curl', 'slider_leg_curl'),
          core('core_flexion', 'hanging_leg_raise', 'cable_crunch', 'reverse_crunch'),
        ],
      },
    ],
  },
  {
    id: 'push_pull_4',
    name: 'Push / Pull 4-Day',
    tagline: 'Front-of-body and back-of-body days, twice a week',
    description:
      'Push days train chest, shoulders, triceps and quads. Pull days train back, biceps, hamstrings and glutes. Every muscle gets two sessions a week across just four days.',
    split: 'push_pull',
    daysPerWeek: 4,
    schedule: 'Mon · Tue · Thu · Fri',
    levels: ['beginner', 'intermediate', 'advanced'],
    bestFor: ['strength', 'hypertrophy', 'general'],
    basis:
      'The push/pull (anterior/posterior chain) split popular with powerbuilders. A main lift leads each day, followed by moderate-rep accessories.',
    days: [
      {
        name: 'Push A',
        focus: 'Squat · Bench',
        slots: [
          main('squat', 'back_squat', 'leg_press', 'goblet_squat', 'bw_squat'),
          main('horizontal_push', 'bench_press', 'db_bench_press', 'push_up'),
          acc('vertical_push', 'db_shoulder_press', 'machine_shoulder_press', 'pike_push_up'),
          acc('leg_ext', 'leg_extension', 'band_leg_ext', 'wall_sit'),
          acc('triceps_ext', 'triceps_pushdown', 'db_overhead_ext', 'bench_dip'),
          core('core_flexion', 'cable_crunch', 'reverse_crunch'),
        ],
      },
      {
        name: 'Pull A',
        focus: 'Deadlift · Row',
        slots: [
          main('hinge', 'deadlift', 'db_rdl', 'kb_deadlift', 'single_leg_rdl'),
          main('horizontal_pull', 'barbell_row', 'db_row', 'inverted_row'),
          acc('vertical_pull', 'pull_up', 'lat_pulldown', 'band_pulldown'),
          acc('leg_curl', 'leg_curl', 'db_leg_curl', 'slider_leg_curl'),
          acc('biceps_curl', 'barbell_curl', 'db_curl', 'band_curl'),
          core('core_stability', 'plank'),
        ],
      },
      {
        name: 'Push B',
        focus: 'Press · Front squat',
        slots: [
          main('vertical_push', 'ohp', 'db_shoulder_press', 'pike_push_up'),
          acc('squat', 'front_squat', 'hack_squat', 'goblet_squat'),
          acc('incline_push', 'incline_db_press', 'incline_machine_press', 'decline_push_up'),
          acc('lunge', 'bulgarian_split_squat', 'db_lunge', 'bw_split_squat'),
          acc('lateral_raise', 'db_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise'),
          core('core_rotation', 'pallof_press', 'band_pallof_press', 'russian_twist'),
        ],
      },
      {
        name: 'Pull B',
        focus: 'RDL · Pull-up',
        slots: [
          main('vertical_pull', 'pull_up', 'lat_pulldown', 'band_pulldown'),
          acc('hinge', 'rdl', 'db_rdl', 'kb_swing'),
          acc('hip_thrust', 'hip_thrust', 'db_hip_thrust', 'glute_bridge'),
          acc('horizontal_pull', 'seated_cable_row', 'chest_supported_row', 'band_row'),
          acc('rear_delt', 'face_pull', 'reverse_db_fly', 'band_pull_apart'),
          acc('biceps_curl', 'hammer_curl', 'cable_curl', 'band_curl'),
        ],
      },
    ],
  },
  {
    id: 'bro_split_5',
    name: 'Body Part Split 5-Day',
    tagline: 'Chest, back, shoulders, legs and arms each get a day',
    description:
      'The classic bodybuilding "bro split". Each session hammers one or two muscle groups with lots of sets, then the muscle rests for a full week. Abs twice a week.',
    split: 'body_part',
    daysPerWeek: 5,
    schedule: 'Mon–Fri',
    levels: ['intermediate', 'advanced'],
    bestFor: ['hypertrophy'],
    basis:
      'The traditional bodybuilding split. Research finds total weekly sets matter most for growth; this split reaches high volume per muscle in single sessions.',
    days: [
      {
        name: 'Chest',
        focus: 'Chest',
        slots: [
          main('horizontal_push', 'bench_press', 'db_bench_press', 'machine_chest_press', 'push_up'),
          acc('incline_push', 'incline_db_press', 'incline_bench', 'decline_push_up'),
          acc('horizontal_push', 'dip', 'machine_chest_press', 'db_floor_press', 'push_up'),
          acc('chest_fly', 'cable_fly', 'pec_deck', 'db_fly', 'wide_push_up'),
        ],
      },
      {
        name: 'Back',
        focus: 'Back · Rear delts',
        slots: [
          main('hinge', 'deadlift', 'rdl', 'db_rdl', 'kb_swing'),
          acc('vertical_pull', 'pull_up', 'lat_pulldown', 'band_pulldown'),
          acc('horizontal_pull', 'barbell_row', 'db_row', 'inverted_row'),
          acc('horizontal_pull', 'seated_cable_row', 'chest_supported_row', 'band_row'),
          acc('rear_delt', 'face_pull', 'reverse_db_fly', 'band_pull_apart'),
        ],
      },
      {
        name: 'Shoulders & Abs',
        focus: 'Delts · Core',
        slots: [
          main('vertical_push', 'ohp', 'db_shoulder_press', 'machine_shoulder_press', 'pike_push_up'),
          acc('lateral_raise', 'db_lateral_raise', 'cable_lateral_raise', 'band_lateral_raise'),
          acc('rear_delt', 'reverse_pec_deck', 'reverse_db_fly', 'prone_t_raise'),
          core('core_flexion', 'hanging_leg_raise', 'reverse_crunch'),
          core('core_stability', 'plank', 'ab_wheel'),
        ],
      },
      {
        name: 'Legs',
        focus: 'Quads · Hamstrings · Calves',
        slots: [
          main('squat', 'back_squat', 'leg_press', 'goblet_squat', 'bw_squat'),
          acc('squat', 'leg_press', 'hack_squat', 'goblet_squat'),
          acc('hinge', 'rdl', 'db_rdl', 'single_leg_rdl'),
          acc('leg_ext', 'leg_extension', 'band_leg_ext', 'wall_sit'),
          acc('leg_curl', 'leg_curl', 'db_leg_curl', 'slider_leg_curl'),
          acc('calf_raise', 'standing_calf_raise', 'db_calf_raise', 'bw_calf_raise'),
        ],
      },
      {
        name: 'Arms & Abs',
        focus: 'Biceps · Triceps · Core',
        slots: [
          acc('biceps_curl', 'barbell_curl', 'db_curl', 'band_curl'),
          acc('triceps_ext', 'skull_crusher', 'db_overhead_ext', 'diamond_push_up'),
          acc('biceps_curl', 'hammer_curl', 'cable_curl', 'kb_curl', 'towel_curl'),
          acc('triceps_ext', 'triceps_pushdown', 'band_pushdown', 'bench_dip'),
          core('core_rotation', 'cable_woodchop', 'band_pallof_press', 'bicycle_crunch'),
          core('core_flexion', 'cable_crunch', 'db_crunch', 'crunch'),
        ],
      },
    ],
  },
  {
    id: 'upper_lower_core_5',
    name: 'Upper / Lower / Abs 5-Day',
    tagline: 'Upper and lower days plus a dedicated core day',
    description:
      'Two upper days, two lower days and a dedicated abs and core session in the middle of the week. Balanced strength and muscle with extra attention on the midsection.',
    split: 'upper_lower',
    daysPerWeek: 5,
    schedule: 'Mon · Tue · Wed (abs) · Fri · Sat',
    levels: ['intermediate', 'advanced'],
    bestFor: ['general', 'hypertrophy', 'fat_loss'],
    basis:
      'An upper/lower split (each muscle twice a week) with a focused core session using flexion, anti-extension and anti-rotation work.',
    days: [
      {
        name: 'Upper A',
        focus: 'Horizontal push & pull',
        slots: [
          main('horizontal_push', 'bench_press', 'db_bench_press', 'push_up'),
          main('horizontal_pull', 'barbell_row', 'db_row', 'inverted_row'),
          acc('incline_push', 'incline_db_press', 'decline_push_up'),
          acc('vertical_pull', 'lat_pulldown', 'pull_up', 'band_pulldown'),
          acc('biceps_curl', 'db_curl', 'band_curl'),
          acc('triceps_ext', 'triceps_pushdown', 'bench_dip'),
        ],
      },
      {
        name: 'Lower A',
        focus: 'Squat focus',
        slots: [
          main('squat', 'back_squat', 'leg_press', 'goblet_squat', 'bw_squat'),
          acc('hinge', 'rdl', 'db_rdl', 'single_leg_rdl'),
          acc('lunge', 'db_lunge', 'bw_lunge'),
          acc('leg_curl', 'leg_curl', 'slider_leg_curl'),
          acc('calf_raise', 'standing_calf_raise', 'bw_calf_raise'),
        ],
      },
      {
        name: 'Abs & Core',
        focus: 'Flexion · Stability · Rotation',
        slots: [
          core('core_flexion', 'hanging_leg_raise', 'reverse_crunch'),
          core('core_stability', 'plank', 'ab_wheel'),
          core('core_rotation', 'cable_woodchop', 'band_pallof_press', 'russian_twist'),
          core('core_flexion', 'cable_crunch', 'db_crunch', 'crunch'),
          core('core_stability', 'side_plank'),
          core('core_stability', 'suitcase_carry', 'dead_bug'),
        ],
      },
      {
        name: 'Upper B',
        focus: 'Vertical push & pull',
        slots: [
          main('vertical_push', 'ohp', 'db_shoulder_press', 'pike_push_up'),
          main('vertical_pull', 'pull_up', 'lat_pulldown', 'band_pulldown'),
          acc('horizontal_push', 'db_bench_press', 'machine_chest_press', 'push_up'),
          acc('horizontal_pull', 'seated_cable_row', 'chest_supported_row', 'band_row'),
          acc('lateral_raise', 'db_lateral_raise', 'band_lateral_raise'),
          acc('rear_delt', 'face_pull', 'band_pull_apart', 'prone_t_raise'),
        ],
      },
      {
        name: 'Lower B',
        focus: 'Hinge focus',
        slots: [
          main('hinge', 'deadlift', 'db_rdl', 'kb_swing', 'single_leg_rdl'),
          acc('squat', 'front_squat', 'hack_squat', 'goblet_squat'),
          acc('hip_thrust', 'hip_thrust', 'db_hip_thrust', 'glute_bridge'),
          acc('leg_ext', 'leg_extension', 'band_leg_ext', 'wall_sit'),
          acc('calf_raise', 'db_calf_raise', 'bw_calf_raise'),
        ],
      },
    ],
  },
  {
    id: 'core_3',
    name: 'Abs & Core 3-Day',
    tagline: 'A focused core program you can do anywhere',
    description:
      'Three short sessions that train every job your core does: curling, resisting extension, resisting rotation and carrying load. Works with no equipment, and pairs well with running or sport.',
    split: 'core',
    daysPerWeek: 3,
    schedule: 'Mon · Wed · Fri',
    levels: ['beginner', 'intermediate', 'advanced'],
    bestFor: ['general', 'fat_loss'],
    basis:
      'Built on the anti-movement core training approach (flexion, anti-extension, anti-rotation, anti-lateral-flexion) with glute work for a strong midsection.',
    days: [
      {
        name: 'Core A',
        focus: 'Anti-extension',
        slots: [
          core('core_stability', 'plank', 'ab_wheel'),
          core('core_flexion', 'hanging_leg_raise', 'reverse_crunch'),
          core('core_stability', 'dead_bug'),
          acc('hip_thrust', 'glute_bridge', 'db_hip_thrust'),
        ],
      },
      {
        name: 'Core B',
        focus: 'Rotation',
        slots: [
          core('core_rotation', 'pallof_press', 'band_pallof_press', 'russian_twist'),
          core('core_flexion', 'cable_crunch', 'db_crunch', 'crunch'),
          core('core_stability', 'side_plank'),
          core('core_rotation', 'cable_woodchop', 'bicycle_crunch'),
        ],
      },
      {
        name: 'Core C',
        focus: 'Strength & carries',
        slots: [
          core('core_stability', 'suitcase_carry', 'plank'),
          core('core_flexion', 'lying_leg_raise', 'reverse_crunch'),
          core('core_rotation', 'russian_twist', 'bicycle_crunch'),
          acc('hinge', 'kb_swing', 'single_leg_rdl'),
        ],
      },
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
