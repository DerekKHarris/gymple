import type { Goal, Role } from './types';

export const TOTAL_WEEKS = 12;

export interface Scheme {
  sets: number;
  repMin: number;
  repMax: number;
  /** Reps in reserve to aim for: how many more reps you could have done. */
  rir: number;
}

export interface WeekInfo {
  week: number;
  block: 1 | 2 | 3;
  phase: string;
  isDeload: boolean;
  /** Strength goal only: week 12 tests your new top end instead of deloading. */
  isTest: boolean;
  summary: string;
}

type BlockSchemes = Record<Role, [Scheme, Scheme, Scheme]>;

const s = (sets: number, repMin: number, repMax: number, rir: number): Scheme => ({ sets, repMin, repMax, rir });

/**
 * Rep schemes per goal for each 4-week block (3 hard weeks then a deload).
 * - Strength: heavy compounds in the 1-6 RM zone, getting heavier each block (ACSM 2009).
 * - Hypertrophy: moderate loads, 6-12 reps, volume climbing across blocks (Schoenfeld et al.).
 * - Fat loss: higher reps and density to keep muscle while in a calorie deficit.
 * - General: novice-friendly 8-12 RM (ACSM 2009 novice recommendation).
 */
const SCHEMES: Record<Goal, BlockSchemes> = {
  strength: {
    main: [s(5, 5, 5, 2), s(4, 4, 4, 2), s(5, 3, 3, 1)],
    accessory: [s(3, 8, 10, 2), s(3, 6, 8, 2), s(3, 6, 8, 1)],
    core: [s(3, 10, 12, 2), s(3, 10, 12, 2), s(3, 10, 12, 2)],
  },
  hypertrophy: {
    main: [s(3, 8, 10, 3), s(4, 6, 8, 2), s(4, 8, 10, 1)],
    accessory: [s(3, 10, 12, 3), s(3, 10, 12, 2), s(4, 12, 15, 1)],
    core: [s(3, 12, 15, 2), s(3, 12, 15, 2), s(4, 12, 15, 1)],
  },
  fat_loss: {
    main: [s(3, 10, 12, 3), s(3, 8, 10, 2), s(4, 10, 12, 2)],
    accessory: [s(3, 12, 15, 3), s(3, 12, 15, 2), s(3, 15, 20, 2)],
    core: [s(3, 15, 20, 2), s(3, 15, 20, 2), s(4, 15, 20, 2)],
  },
  general: {
    main: [s(3, 8, 10, 3), s(3, 6, 8, 2), s(3, 8, 10, 2)],
    accessory: [s(3, 10, 12, 3), s(3, 10, 12, 2), s(3, 10, 12, 2)],
    core: [s(3, 12, 15, 2), s(3, 12, 15, 2), s(3, 12, 15, 2)],
  },
};

const PHASES = ['Foundation', 'Build', 'Peak'] as const;

const PHASE_SUMMARY: Record<Goal, [string, string, string]> = {
  strength: [
    'Groove technique with 5×5 on the main lifts.',
    'Heavier 4×4 work. Fewer reps, more weight.',
    'Heavy triples to drive up your top-end strength.',
  ],
  hypertrophy: [
    'Moderate weights, 8–12 reps, leave a few reps in the tank.',
    'Heavier 6–8 rep main lifts with an extra set.',
    'Highest volume: more sets taken closer to failure.',
  ],
  fat_loss: [
    'Higher reps to build work capacity.',
    'Slightly heavier to hold onto strength.',
    'Highest density: more sets, high reps.',
  ],
  general: [
    'Learn the movements with 8–12 reps.',
    'A little heavier, 6–8 reps on the main lifts.',
    'Back to 8–10 reps with heavier weights than week 1.',
  ],
};

export function weekInfo(goal: Goal, week: number): WeekInfo {
  const w = Math.min(Math.max(week, 1), TOTAL_WEEKS);
  const block = (Math.ceil(w / 4) as 1 | 2 | 3);
  const isTest = goal === 'strength' && w === TOTAL_WEEKS;
  const isDeload = w % 4 === 0 && !isTest;
  let phase: string = PHASES[block - 1];
  let summary = PHASE_SUMMARY[goal][block - 1];
  if (isTest) {
    phase = 'Test';
    summary = 'Work up to a heavy set of 1–3 on the main lifts to see how far you have come.';
  } else if (isDeload) {
    phase = 'Deload';
    summary = 'Lighter weights and fewer sets so your body can recover and adapt.';
  }
  return { week: w, block, phase, isDeload, isTest, summary };
}

export function schemeFor(goal: Goal, week: number, role: Role): Scheme {
  const info = weekInfo(goal, week);
  const base = SCHEMES[goal][role][info.block - 1];
  if (info.isTest) {
    if (role === 'main') return s(3, 1, 3, 1);
    return { ...base, sets: Math.max(2, base.sets - 1), rir: 3 };
  }
  if (info.isDeload) {
    return { ...base, sets: Math.max(2, base.sets - 1), rir: 4 };
  }
  return base;
}

/** Fraction of normal working weight used in a deload week. */
export const DELOAD_FACTOR = 0.9;

export function formatReps(scheme: { repMin: number; repMax: number }, timed = false): string {
  const unit = timed ? 's' : '';
  if (scheme.repMin === scheme.repMax) return `${scheme.repMin}${unit}`;
  return `${scheme.repMin}–${scheme.repMax}${unit}`;
}

/** Timed holds (planks etc.) are prescribed in seconds; scale the rep scheme into a sensible duration. */
export function timedScheme(scheme: Scheme): Scheme {
  const repMin = Math.round((scheme.repMin * 3) / 5) * 5;
  const repMax = Math.round((scheme.repMax * 3) / 5) * 5;
  return { ...scheme, repMin: Math.max(15, repMin), repMax: Math.max(20, repMax) };
}
