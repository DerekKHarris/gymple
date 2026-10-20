export type Goal = 'strength' | 'hypertrophy' | 'fat_loss' | 'general';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Units = 'lb' | 'kg';

export type Equipment =
  | 'barbell'
  | 'rack'
  | 'bench'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'pullup_bar'
  | 'bands';

export type Muscle =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs';

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'hip_thrust'
  | 'horizontal_push'
  | 'incline_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'chest_fly'
  | 'lateral_raise'
  | 'rear_delt'
  | 'biceps_curl'
  | 'triceps_ext'
  | 'leg_ext'
  | 'leg_curl'
  | 'calf_raise'
  | 'core_flexion'
  | 'core_stability'
  | 'core_rotation';

/** How load is measured, which decides increments and rounding. */
export type LoadType = 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'cable' | 'bodyweight' | 'band';

export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  primary: Muscle;
  /** Every item is required to perform the exercise. Empty means bodyweight only. */
  equipment: Equipment[];
  load: LoadType;
  compound: boolean;
  lowerBody: boolean;
  /** Reps are counted in seconds (e.g. planks). */
  timed?: boolean;
  cue?: string;
}

export type Role = 'main' | 'accessory' | 'core';

export interface PlanSlot {
  pattern: Pattern;
  /** Preferred exercise ids, best first. The first one the user has equipment for wins. */
  prefer: string[];
  role: Role;
}

export interface PlanDay {
  name: string;
  focus: string;
  slots: PlanSlot[];
}

export type Split = 'full_body' | 'upper_lower' | 'push_pull_legs' | 'push_pull' | 'body_part' | 'core';

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  description: string;
  split: Split;
  daysPerWeek: number;
  schedule: string;
  levels: Experience[];
  bestFor: Goal[];
  /** Why the plan works, based on the programs it is modelled on. */
  basis: string;
  days: PlanDay[];
}

export interface Profile {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  equipment: Equipment[];
  units: Units;
  restSeconds: number;
}

/** A day of the user's own program: the plan's day resolved to exercises they can do, and editable. */
export interface ProgramExercise {
  slotId: string;
  exerciseId: string;
  role: Role;
}

export interface ProgramDay {
  name: string;
  focus: string;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string;
  planId: string;
  name: string;
  goal: Goal;
  startedAt: string;
  days: ProgramDay[];
}

export type Effort = 'easy' | 'good' | 'hard' | 'fail';

export interface SetEntry {
  id: string;
  repMin: number;
  repMax: number;
  weight?: number;
  reps?: number;
  effort?: Effort;
  done: boolean;
  doneAt?: string;
}

export interface SessionExercise {
  id: string;
  slotId: string;
  exerciseId: string;
  role: Role;
  sets: SetEntry[];
}

export interface Session {
  id: string;
  programId: string;
  week: number;
  day: number;
  name: string;
  focus: string;
  isDeload: boolean;
  exercises: SessionExercise[];
  startedAt?: string;
  completedAt?: string;
}

export type EditScope = 'today' | 'future';

/** 1 (low) to 5 (high). */
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface CheckInRatings {
  energy: Rating;
  sleep: Rating;
  /** 5 = very sore. */
  soreness: Rating;
  /** 5 = very stressed. */
  stress: Rating;
  /** How closely you ate to plan. */
  nutrition: Rating;
  motivation: Rating;
}

/** Last-7-day numbers pulled from Apple Health, when connected. */
export interface HealthSnapshot {
  weightAvg?: number;
  weightLatest?: number;
  /** 7-day average body fat, in percent (e.g. 18.5). */
  bodyFat?: number;
  /** 7-day average lean body mass, in the user's units. */
  leanMass?: number;
  stepsPerDay?: number;
  sleepHours?: number;
  restingHr?: number;
}

export type WeightTrend = 'baseline' | 'on_track' | 'too_fast' | 'too_slow' | 'wrong_way' | 'no_data';

export interface CoachReport {
  headline: string;
  wins: string[];
  actions: string[];
  weightTrend: WeightTrend;
  /** Weekly change in body weight as a % of body weight. */
  weeklyChangePct?: number;
  /** Change in fat mass and lean mass since the last check-in, in the user's units. */
  fatMassChange?: number;
  leanMassChange?: number;
  workoutsDone: number;
  workoutsPlanned: number;
  newBests: string[];
  /** Coach chose to hold weights steady next week because recovery was poor. */
  holdProgression: boolean;
}

export interface CheckIn {
  id: string;
  date: string;
  week: number;
  units: Units;
  weight?: number;
  waist?: number;
  /** Percent, e.g. 18.5. */
  bodyFat?: number;
  leanMass?: number;
  ratings: CheckInRatings;
  notes?: string;
  health?: HealthSnapshot;
  report: CoachReport;
}

export interface CoachSettings {
  /** Day of week for check-ins, 0 = Sunday. */
  checkInDay: number;
  reminder: boolean;
  healthConnected: boolean;
  saveToHealth: boolean;
  /** ISO date; weight increases are held until then. */
  holdUntil?: string;
}
