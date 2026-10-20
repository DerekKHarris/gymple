import { DELOAD_FACTOR } from './periodization';
import type { Effort, Exercise, Experience, Goal, Units } from './types';

/**
 * Progression engine. Turns everything the user has logged into a suggested weight
 * (and rep target) for the next set.
 *
 * The rules follow the research summarised in docs/RESEARCH.md:
 * - Strength goal: linear progression. Add weight each session all sets hit the target;
 *   after three stalled sessions at a weight, reset 10% and build back (StrongLifts / Starting Strength).
 * - Other goals: double progression. Keep the weight until every set reaches the top of
 *   the rep range, then add weight and start again at the bottom (ACSM: add 2-10% once you
 *   can do 1-2 reps over the target).
 * - Within a session: a set that was too easy bumps the next set up; missed reps drop it
 *   so the remaining sets stay in the target range.
 * - When the rep range changes between blocks, the weight is recalculated from your
 *   estimated one-rep max (Epley) with the block's reps-in-reserve.
 * - Deload weeks use 90% of your working weight.
 */

export interface LoggedSet {
  weight: number;
  reps: number;
  repMin: number;
  repMax: number;
  effort?: Effort;
}

export interface ExerciseLog {
  sessionId: string;
  date: string;
  isDeload: boolean;
  sets: LoggedSet[];
}

export interface Target {
  repMin: number;
  repMax: number;
  rir: number;
  isDeload: boolean;
}

export interface SuggestInput {
  goal: Goal;
  experience: Experience;
  units: Units;
  exercise: Exercise;
  target: Target;
  /** Earlier sessions for this exercise, oldest first. Excludes the current session. */
  history: ExerciseLog[];
  /** Sets already completed for this exercise in the current session, in order. */
  currentSets: LoggedSet[];
  /** The weekly check-in found recovery low: suggest no weight increases. */
  hold?: boolean;
}

export type SuggestionKind = 'first' | 'increase' | 'hold' | 'decrease' | 'deload' | 'reset' | 'recalc' | 'bodyweight';

export interface Suggestion {
  /** Null when there is no data yet to base a weight on. */
  weight: number | null;
  reps: number;
  kind: SuggestionKind;
  reason: string;
}

// ---------- One-rep max helpers ----------

/** Epley estimate. Reliable up to roughly 12-15 reps. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + Math.min(reps, 15) / 30);
}

/** Weight you could lift for `reps` reps to failure, given a one-rep max. */
export function weightForReps(oneRepMax: number, reps: number): number {
  if (reps <= 1) return oneRepMax;
  return oneRepMax / (1 + reps / 30);
}

// ---------- Increments and rounding ----------

/** Smallest practical jump for this kind of equipment, used for rounding. */
export function loadStep(exercise: Exercise, units: Units): number {
  const kg = units === 'kg';
  switch (exercise.load) {
    case 'barbell':
      return kg ? 2.5 : 5;
    case 'dumbbell':
      return kg ? 2 : 5;
    case 'kettlebell':
      return kg ? 4 : 5;
    case 'machine':
    case 'cable':
      return kg ? 2.5 : 5;
    default:
      return kg ? 2.5 : 5;
  }
}

/** How much to add when it's time to progress. Bigger for big lower-body lifts and beginners. */
export function increment(exercise: Exercise, experience: Experience, units: Units): number {
  const step = loadStep(exercise, units);
  const big = exercise.compound && exercise.lowerBody && (exercise.load === 'barbell' || exercise.load === 'machine');
  if (big && experience === 'beginner') return step * 2;
  if (exercise.load === 'kettlebell' && units === 'lb') return 10;
  return step;
}

export function minimumLoad(exercise: Exercise, units: Units): number {
  if (exercise.load === 'barbell') return units === 'kg' ? 20 : 45;
  return 0;
}

export function roundLoad(weight: number, exercise: Exercise, units: Units, mode: 'nearest' | 'down' = 'nearest'): number {
  const step = loadStep(exercise, units);
  const fn = mode === 'down' ? Math.floor : Math.round;
  const rounded = fn(weight / step + 1e-9) * step;
  const floor = minimumLoad(exercise, units);
  return Math.max(floor, Number(rounded.toFixed(2)));
}

// ---------- Helpers over logged sets ----------

const sameRange = (a: { repMin: number; repMax: number }, b: { repMin: number; repMax: number }) =>
  a.repMin === b.repMin && a.repMax === b.repMax;

const usesLinearProgression = (goal: Goal, target: Target) => goal === 'strength' || target.repMin === target.repMax;

function bestOneRepMax(logs: ExerciseLog[]): number {
  let best = 0;
  for (const log of logs) {
    for (const set of log.sets) best = Math.max(best, estimateOneRepMax(set.weight, set.reps));
  }
  return best;
}

/** The working weight of a session: the heaviest weight that met its rep minimum, else the lightest used. */
function workingWeight(log: ExerciseLog): number {
  const met = log.sets.filter((s) => s.reps >= s.repMin).map((s) => s.weight);
  if (met.length) return Math.max(...met);
  return Math.min(...log.sets.map((s) => s.weight));
}

const allHit = (log: ExerciseLog, key: 'repMin' | 'repMax') => log.sets.every((s) => s.reps >= s[key]);

function mostlyEasy(sets: LoggedSet[]): boolean {
  const rated = sets.filter((s) => s.effort);
  return rated.length > 0 && rated.filter((s) => s.effort === 'easy').length > rated.length / 2;
}

/** Consecutive most-recent sessions at or above `weight` where the reps fell short. */
function stalledSessions(logs: ExerciseLog[], weight: number, key: 'repMin' | 'repMax'): number {
  let count = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (log.isDeload) continue;
    if (workingWeight(log) < weight || allHit(log, key)) break;
    count++;
  }
  return count;
}

function fmt(weight: number, units: Units): string {
  return `${Number(weight.toFixed(2))} ${units}`;
}

function fmtRange(t: { repMin: number; repMax: number }): string {
  return t.repMin === t.repMax ? `${t.repMin}` : `${t.repMin}–${t.repMax}`;
}

// ---------- Main entry point ----------

export function suggestNextSet(input: SuggestInput): Suggestion {
  const suggestion = suggest(input);
  if (!input.hold || suggestion.kind !== 'increase' || suggestion.weight === null) return suggestion;
  const weight = holdWeight(input);
  if (weight === null) return suggestion;
  return {
    ...suggestion,
    weight,
    kind: 'hold',
    reason: `Coach: holding at ${fmt(weight, input.units)} this week while you recover. Focus on clean reps.`,
  };
}

/** The weight to repeat when progression is on hold: the last set's, else last session's working weight. */
function holdWeight({ currentSets, history }: SuggestInput): number | null {
  const last = currentSets[currentSets.length - 1];
  if (last && last.weight > 0) return last.weight;
  const log = history.filter((l) => !l.isDeload && l.sets.length).pop();
  return log ? workingWeight(log) : null;
}

function suggest(input: SuggestInput): Suggestion {
  const { exercise } = input;
  const loaded = input.currentSets.length
    ? input.currentSets.some((s) => s.weight > 0)
    : input.history.some((log) => log.sets.some((s) => s.weight > 0));

  if (exercise.load === 'bodyweight' && !loaded) return suggestBodyweight(input);
  if (input.currentSets.length) return suggestWithinSession(input);
  return suggestFromHistory(input);
}

function suggestBodyweight({ target, history, currentSets, exercise }: SuggestInput): Suggestion {
  const unit = exercise.timed ? 's' : ' reps';
  if (currentSets.length) {
    const last = currentSets[currentSets.length - 1];
    if (last.reps < target.repMin || last.effort === 'fail') {
      return { weight: 0, reps: target.repMin, kind: 'decrease', reason: `Rest fully and aim for ${target.repMin}${unit}. Use an easier variation if you need to.` };
    }
    return { weight: 0, reps: Math.min(Math.max(last.reps, target.repMin), target.repMax + 5), kind: 'bodyweight', reason: `Match your last set: ${last.reps}${unit}.` };
  }
  const last = [...history].reverse().find((l) => !l.isDeload);
  if (!last) {
    return { weight: 0, reps: target.repMax, kind: 'first', reason: `Bodyweight: aim for ${fmtRange(target)}${unit} with good form.` };
  }
  const best = Math.max(...last.sets.map((s) => s.reps));
  if (allHit(last, 'repMax')) {
    return {
      weight: 0,
      reps: best + (exercise.timed ? 5 : 1),
      kind: 'increase',
      reason: `You hit the top of the range last time. Beat ${best}${unit}, or add weight (vest, backpack or dumbbell) and log it.`,
    };
  }
  return { weight: 0, reps: Math.min(best + 1, target.repMax), kind: 'bodyweight', reason: `Last time your best set was ${best}${unit}. Try for one more.` };
}

function suggestWithinSession(input: SuggestInput): Suggestion {
  const { currentSets, target, exercise, units, experience } = input;
  const last = currentSets[currentSets.length - 1];
  const step = increment(exercise, experience, units);

  if (!sameRange(last, target)) {
    const oneRm = estimateOneRepMax(last.weight, last.reps);
    const weight = roundLoad(weightForReps(oneRm, target.repMax + target.rir), exercise, units, 'down');
    return { weight, reps: target.repMax, kind: 'recalc', reason: `New rep target, so the weight is worked out from your last set (≈${fmt(oneRm, units)} 1RM).` };
  }

  if (last.reps < last.repMin || last.effort === 'fail') {
    const missed = Math.max(1, last.repMin - last.reps);
    const drop = Math.min(0.15, 0.05 * missed);
    let weight = roundLoad(last.weight * (1 - drop), exercise, units, 'down');
    if (weight >= last.weight) weight = Math.max(minimumLoad(exercise, units), last.weight - loadStep(exercise, units));
    return {
      weight,
      reps: target.repMin,
      kind: 'decrease',
      reason:
        target.repMin === target.repMax
          ? `You got ${last.reps} of ${last.repMin} reps, so drop to ${fmt(weight, units)} to hit all ${target.repMin} on the next set.`
          : `You got ${last.reps} of ${last.repMin} reps, so drop to ${fmt(weight, units)} to stay in the ${fmtRange(target)} range.`,
    };
  }

  const wayOver = last.reps >= last.repMax + 2;
  const easyAtTop = last.effort === 'easy' && last.reps >= last.repMax;
  if ((wayOver || easyAtTop) && !target.isDeload) {
    const weight = roundLoad(last.weight + step, exercise, units);
    return {
      weight,
      reps: target.repMin === target.repMax ? target.repMin : target.repMax,
      kind: 'increase',
      reason: wayOver
        ? `${last.reps} reps is well over the target, so go up to ${fmt(weight, units)}.`
        : `That felt easy${last.repMin === last.repMax ? '' : ' at the top of the range'}. Try ${fmt(weight, units)}.`,
    };
  }

  const reps = target.repMin === target.repMax ? target.repMin : Math.min(target.repMax, Math.max(target.repMin, last.reps));
  return {
    weight: last.weight,
    reps,
    kind: 'hold',
    reason: last.effort === 'hard' ? `Tough set, but on target. Stay at ${fmt(last.weight, units)}.` : `On target. Stay at ${fmt(last.weight, units)}.`,
  };
}

function suggestFromHistory(input: SuggestInput): Suggestion {
  const { history, target, exercise, units, experience, goal } = input;
  const working = history.filter((l) => !l.isDeload && l.sets.length > 0);
  const lastLog = working[working.length - 1] ?? history.filter((l) => l.sets.length > 0).pop();
  const repTarget = target.repMin === target.repMax ? target.repMin : target.repMax;

  if (!lastLog) {
    return {
      weight: null,
      reps: repTarget,
      kind: 'first',
      reason: `First time: pick a weight you could lift for about ${repTarget + target.rir} reps, so ${target.rir} are left in the tank.`,
    };
  }

  const base = workingWeight(lastLog);
  const step = increment(exercise, experience, units);
  let suggestion: Suggestion;

  if (!sameRange(lastLog.sets[0], target)) {
    // New block / rep range: recalculate from the best recent estimated 1RM.
    const oneRm = bestOneRepMax(working.slice(-3).length ? working.slice(-3) : [lastLog]);
    const weight = roundLoad(weightForReps(oneRm, repTarget + target.rir), exercise, units, 'down');
    suggestion = {
      weight,
      reps: repTarget,
      kind: 'recalc',
      reason: `New rep range (${fmtRange(target)}). Based on your estimated 1RM of ${fmt(roundLoad(oneRm, exercise, units), units)}, start at ${fmt(weight, units)}.`,
    };
  } else if (usesLinearProgression(goal, target)) {
    if (allHit(lastLog, 'repMin')) {
      const bonus = mostlyEasy(lastLog.sets) ? 2 : 1;
      const weight = roundLoad(base + step * bonus, exercise, units);
      suggestion = {
        weight,
        reps: repTarget,
        kind: 'increase',
        reason: `You hit every set at ${fmt(base, units)} last time. Add ${fmt(weight - base, units)}.`,
      };
    } else {
      const stalls = stalledSessions(working, base, 'repMin');
      if (stalls >= 3) {
        const weight = roundLoad(base * 0.9, exercise, units, 'down');
        suggestion = {
          weight,
          reps: repTarget,
          kind: 'reset',
          reason: `Missed reps at ${fmt(base, units)} three sessions running. Reset 10% to ${fmt(weight, units)} and build back up.`,
        };
      } else {
        suggestion = {
          weight: base,
          reps: repTarget,
          kind: 'hold',
          reason: `Missed reps last time (${stalls} of 3 before a reset). Repeat ${fmt(base, units)} and get every set.`,
        };
      }
    }
  } else if (allHit(lastLog, 'repMax')) {
    const bonus = mostlyEasy(lastLog.sets) ? 2 : 1;
    const weight = roundLoad(base + step * bonus, exercise, units);
    suggestion = {
      weight,
      reps: target.repMin,
      kind: 'increase',
      reason: `Every set reached ${target.repMax} reps last time. Go up to ${fmt(weight, units)} and aim for ${target.repMin}+ reps.`,
    };
  } else if (allHit(lastLog, 'repMin')) {
    const best = Math.max(...lastLog.sets.map((s) => s.reps));
    suggestion = {
      weight: base,
      reps: Math.min(target.repMax, best + 1),
      kind: 'hold',
      reason: `Stay at ${fmt(base, units)} and add reps. Move up once every set hits ${target.repMax}.`,
    };
  } else {
    const stalls = stalledSessions(working, base, 'repMin');
    if (stalls >= 2) {
      const weight = roundLoad(base * 0.9, exercise, units, 'down');
      suggestion = {
        weight,
        reps: target.repMin,
        kind: 'reset',
        reason: `Below ${target.repMin} reps two sessions in a row. Drop 10% to ${fmt(weight, units)}.`,
      };
    } else {
      suggestion = {
        weight: base,
        reps: target.repMin,
        kind: 'hold',
        reason: `Some sets fell short last time. Repeat ${fmt(base, units)} and aim for at least ${target.repMin} reps.`,
      };
    }
  }

  if (target.isDeload && suggestion.weight !== null) {
    const normal = suggestion.kind === 'increase' ? base : suggestion.weight;
    const weight = roundLoad(normal * DELOAD_FACTOR, exercise, units, 'down');
    return { weight, reps: repTarget, kind: 'deload', reason: `Deload week: ${fmt(weight, units)} (about 90% of your working weight) so you recover and come back stronger.` };
  }
  return suggestion;
}
