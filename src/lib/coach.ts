import { getExercise } from '@/data/exercises';
import type { WeekInfo } from './periodization';
import { estimateOneRepMax } from './progression';
import type { CheckIn, CheckInRatings, CoachReport, Goal, HealthSnapshot, Program, Session, Units, WeightTrend } from './types';

/**
 * Weekly check-in "coach". Turns the week's body weight, training log, recovery
 * ratings and Apple Health data into a short trainer-style report.
 *
 * Weight targets (see docs/RESEARCH.md):
 * - Fat loss: lose 0.5–1% of body weight a week; faster risks muscle loss (Garthe 2011, Helms 2014).
 * - Muscle: gain about 0.25–0.5% a week to limit fat gain (Iraki 2019).
 * - Strength: hold weight steady or gain slowly; a deficit costs strength.
 * - General fitness: roughly maintain.
 */

const DAY = 24 * 60 * 60 * 1000;
const LB_PER_KG = 2.20462;

export interface TrainingWeek {
  workoutsDone: number;
  workoutsPlanned: number;
  setsLogged: number;
  newBests: string[];
  /** Total volume (weight × reps) change vs the previous 7 days, in %. */
  volumeChangePct?: number;
}

export interface CoachInput {
  goal: Goal;
  units: Units;
  now: Date;
  weight?: number;
  /** Percent, e.g. 18.5. */
  bodyFat?: number;
  leanMass?: number;
  ratings: CheckInRatings;
  health?: HealthSnapshot;
  previous?: CheckIn;
  training: TrainingWeek;
  nextWeek: WeekInfo;
}

interface Range {
  min: number;
  max: number;
}

/** Healthy weekly body-weight change for each goal, in % of body weight. */
export const WEIGHT_TARGETS: Record<Goal, Range> = {
  fat_loss: { min: -1, max: -0.5 },
  hypertrophy: { min: 0.25, max: 0.5 },
  strength: { min: -0.25, max: 0.5 },
  general: { min: -0.5, max: 0.5 },
};

const convert = (value: number, from: Units, to: Units) => (from === to ? value : to === 'kg' ? value / LB_PER_KG : value * LB_PER_KG);
const round1 = (n: number) => Math.round(n * 10) / 10;
const fmtWeight = (n: number, units: Units) => `${round1(n)} ${units}`;
const fmtPct = (n: number) => `${n > 0 ? '+' : ''}${round1(n)}%`;

/** The weight to judge trends by: the Apple Health 7-day average when there is one. */
export function effectiveWeight(weight: number | undefined, health: HealthSnapshot | undefined): number | undefined {
  return health?.weightAvg ?? weight;
}

export interface Composition {
  weight: number;
  fatMass: number;
  leanMass: number;
}

/**
 * Splits body weight into fat and lean mass from a smart scale's body-fat % or lean-mass
 * reading, preferring Apple Health's 7-day averages (single readings swing a lot).
 */
export function bodyComposition(weight?: number, bodyFat?: number, leanMass?: number, health?: HealthSnapshot): Composition | undefined {
  const w = effectiveWeight(weight, health);
  if (w === undefined) return undefined;
  const bf = health?.bodyFat ?? bodyFat;
  const lean = health?.leanMass ?? leanMass ?? (bf !== undefined ? w * (1 - bf / 100) : undefined);
  if (lean === undefined || lean <= 0 || lean >= w) return undefined;
  return { weight: w, fatMass: w - lean, leanMass: lean };
}

function convertComposition(c: Composition, from: Units, to: Units): Composition {
  return { weight: convert(c.weight, from, to), fatMass: convert(c.fatMass, from, to), leanMass: convert(c.leanMass, from, to) };
}

interface CompositionVerdict {
  fatMassChange?: number;
  leanMassChange?: number;
  win?: string;
  action?: string;
}

function judgeComposition(input: CoachInput): CompositionVerdict {
  const { previous, units, goal } = input;
  const current = bodyComposition(input.weight, input.bodyFat, input.leanMass, input.health);
  if (!current || !previous) return {};
  const prevRaw = bodyComposition(previous.weight, previous.bodyFat, previous.leanMass, previous.health);
  if (!prevRaw) return {};
  const prev = convertComposition(prevRaw, previous.units, units);
  const dFat = current.fatMass - prev.fatMass;
  const dLean = current.leanMass - prev.leanMass;
  const noise = current.weight * 0.0025;
  const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtWeight(Math.abs(n), units)}`;
  const summary = `fat mass ${signed(dFat)}, lean mass ${signed(dLean)}`;
  const base = { fatMassChange: dFat, leanMassChange: dLean };

  if (goal === 'fat_loss') {
    if (dFat < 0 && dLean >= -noise) return { ...base, win: `Scale shows ${summary}: losing fat while keeping muscle.` };
    if (dLean < -noise && -dLean > -Math.min(dFat, 0) * 0.5)
      return {
        ...base,
        action: `Scale shows ${summary}. A good share of the loss may be lean mass: keep protein at 1.6–2.2 g per kg, keep the weights heavy, and lose no faster than 1% a week. Smart-scale estimates are noisy, so watch the trend.`,
      };
    return base;
  }
  if (goal === 'hypertrophy') {
    if (dFat > noise && dFat > Math.max(dLean, 0) * 2)
      return { ...base, action: `Scale shows ${summary}, so most of the gain looks like fat. Trim about 100–150 calories a day.` };
    if (dLean > noise) return { ...base, win: `Scale shows ${summary}. Muscle is going on.` };
    return base;
  }
  if (dLean > noise && dFat <= noise) return { ...base, win: `Scale shows ${summary}: a recomposition week.` };
  return base;
}

export function trainingWeek(program: Program | undefined, sessions: Record<string, Session>, now: Date): TrainingWeek {
  const weekStart = now.getTime() - 7 * DAY;
  const prevStart = weekStart - 7 * DAY;
  let workoutsDone = 0;
  let setsLogged = 0;
  let volume = 0;
  let prevVolume = 0;
  const bestThisWeek = new Map<string, number>();
  const bestBefore = new Map<string, number>();

  for (const session of Object.values(sessions)) {
    if (session.completedAt) {
      const t = new Date(session.completedAt).getTime();
      if (t > weekStart && t <= now.getTime()) workoutsDone++;
    }
    for (const se of session.exercises) {
      for (const set of se.sets) {
        if (!set.done || !set.doneAt || !set.reps) continue;
        const t = new Date(set.doneAt).getTime();
        if (t > now.getTime()) continue;
        const load = (set.weight ?? 0) * set.reps;
        const e1rm = estimateOneRepMax(set.weight ?? 0, set.reps);
        if (t > weekStart) {
          setsLogged++;
          volume += load;
          bestThisWeek.set(se.exerciseId, Math.max(bestThisWeek.get(se.exerciseId) ?? 0, e1rm));
        } else {
          if (t > prevStart) prevVolume += load;
          bestBefore.set(se.exerciseId, Math.max(bestBefore.get(se.exerciseId) ?? 0, e1rm));
        }
      }
    }
  }

  const newBests = [...bestThisWeek.entries()]
    .filter(([id, best]) => (bestBefore.get(id) ?? 0) > 0 && best > (bestBefore.get(id) ?? 0))
    .sort((a, b) => b[1] / (bestBefore.get(b[0]) ?? 1) - a[1] / (bestBefore.get(a[0]) ?? 1))
    .slice(0, 3)
    .map(([id]) => getExercise(id).name);

  return {
    workoutsDone,
    workoutsPlanned: program?.days.length ?? 0,
    setsLogged,
    newBests,
    volumeChangePct: prevVolume > 0 ? ((volume - prevVolume) / prevVolume) * 100 : undefined,
  };
}

interface WeightVerdict {
  trend: WeightTrend;
  weeklyChangePct?: number;
  win?: string;
  action?: string;
}

function judgeWeight(input: CoachInput): WeightVerdict {
  const { goal, units, previous, now } = input;
  const current = effectiveWeight(input.weight, input.health);
  if (current === undefined) return { trend: 'no_data', action: 'Log your body weight next week so I can track your trend.' };
  if (!previous) {
    return { trend: 'baseline', win: `Baseline recorded: ${fmtWeight(current, units)}. From next week I'll track your trend.` };
  }
  const prevRaw = effectiveWeight(previous.weight, previous.health);
  if (prevRaw === undefined) return { trend: 'baseline', win: `Weight logged: ${fmtWeight(current, units)}. Next week I'll compare against it.` };

  const prev = convert(prevRaw, previous.units, units);
  const days = Math.max(1, (now.getTime() - new Date(previous.date).getTime()) / DAY);
  const pct = (((current - prev) / prev) * 100 * 7) / Math.max(days, 3);
  const change = `${fmtPct(pct)} a week (${fmtWeight(current - prev, units)} since last check-in)`;
  const target = WEIGHT_TARGETS[goal];

  switch (goal) {
    case 'fat_loss':
      if (pct < target.min) return { trend: 'too_fast', weeklyChangePct: pct, action: `You're losing ${change}, faster than the 0.5–1% that protects muscle. Eat about 100–200 more calories a day.` };
      if (pct <= target.max) return { trend: 'on_track', weeklyChangePct: pct, win: `Weight ${change}, right in the 0.5–1% fat-loss range.` };
      if (pct <= -0.25) return { trend: 'on_track', weeklyChangePct: pct, win: `Weight ${change}: slow but steady. Hold the course.` };
      if (pct <= 0.25) return { trend: 'too_slow', weeklyChangePct: pct, action: `Weight is flat (${change}). Trim about 200 calories a day or add 2,000 daily steps.` };
      return { trend: 'wrong_way', weeklyChangePct: pct, action: `Weight went up (${change}). Check portions and weekend eating; aim for a 300–500 calorie daily deficit.` };
    case 'hypertrophy':
      if (pct > 0.75) return { trend: 'too_fast', weeklyChangePct: pct, action: `You're gaining ${change}; above about 0.5% a week most of it is fat. Ease back about 150 calories a day.` };
      if (pct >= target.min) return { trend: 'on_track', weeklyChangePct: pct, win: `Weight ${change}, a lean-gain pace for building muscle.` };
      if (pct >= 0.1) return { trend: 'on_track', weeklyChangePct: pct, win: `Weight ${change}: a slow gain. Fine, just keep protein high.` };
      if (pct >= -0.25) return { trend: 'too_slow', weeklyChangePct: pct, action: `Weight is flat (${change}). To build muscle, add about 200 calories a day, ideally from carbs around training.` };
      return { trend: 'wrong_way', weeklyChangePct: pct, action: `You're losing weight (${change}), which makes building muscle much harder. Add 300 or more calories a day.` };
    case 'strength':
      if (pct < -0.5) return { trend: 'wrong_way', weeklyChangePct: pct, action: `You're losing ${change}. A calorie deficit costs strength; eat at least maintenance while chasing PRs.` };
      if (pct > 0.75) return { trend: 'too_fast', weeklyChangePct: pct, action: `Weight is climbing quickly (${change}). A slower gain keeps the extra weight useful.` };
      return { trend: 'on_track', weeklyChangePct: pct, win: `Weight ${change}: stable, which is ideal for strength.` };
    default:
      if (Math.abs(pct) > 0.75)
        return { trend: pct > 0 ? 'too_fast' : 'wrong_way', weeklyChangePct: pct, action: `Weight changed ${change}. If that wasn't intended, check how much you're eating.` };
      return { trend: 'on_track', weeklyChangePct: pct, win: `Weight ${change}: nice and stable.` };
  }
}

export function buildReport(input: CoachInput): CoachReport {
  const { ratings, health, training, nextWeek, goal } = input;
  const wins: string[] = [];
  const actions: string[] = [];

  // Recovery first: it decides whether to push next week.
  const lowSleep = (health?.sleepHours !== undefined && health.sleepHours < 6.5) || ratings.sleep <= 2;
  const flags = [
    lowSleep && (health?.sleepHours !== undefined ? `sleep ${round1(health.sleepHours)} h` : 'poor sleep'),
    ratings.energy <= 2 && 'low energy',
    ratings.soreness >= 4 && 'lots of soreness',
    ratings.stress >= 4 && 'high stress',
  ].filter(Boolean) as string[];
  let holdProgression = false;
  if (flags.length >= 2) {
    if (nextWeek.isDeload) {
      actions.push(`Recovery is low (${flags.join(', ')}). Good timing: next week is a deload, so take the lighter weights seriously.`);
    } else {
      holdProgression = true;
      actions.push(`Recovery is low (${flags.join(', ')}). I'm holding your weights steady next week (no increases) so you can catch up. Aim for 7–9 hours of sleep.`);
    }
  } else if (flags.length === 1) {
    const tip: Record<string, string> = {
      'low energy': 'Energy was low. Eat a carb-and-protein meal 1–3 hours before training.',
      'lots of soreness': 'Lots of soreness. Keep moving on rest days with an easy walk, and keep reps clean rather than grinding.',
      'high stress': 'Stress was high. Training still helps, but skip extra sets when you feel flat.',
    };
    actions.push(tip[flags[0]] ?? 'Sleep was short. A consistent bedtime is the easiest win for recovery; aim for 7–9 hours.');
  }
  if (health?.sleepHours !== undefined && health.sleepHours >= 7) wins.push(`Averaging ${round1(health.sleepHours)} h of sleep a night.`);

  // Consistency.
  const { workoutsDone: done, workoutsPlanned: planned } = training;
  if (planned > 0) {
    if (done >= planned) wins.push(`Hit ${done} of ${planned} workouts. Consistency is what drives results.`);
    else if (done === 0) actions.push(`No workouts logged this week. Put ${planned} sessions in your calendar now; even a short session counts.`);
    else actions.push(`${done} of ${planned} workouts done. Missed sessions slow progress more than anything else, so plan around what got in the way.`);
  }
  if (training.newBests.length) wins.push(`New estimated bests: ${training.newBests.join(', ')}.`);
  if (training.volumeChangePct !== undefined && training.volumeChangePct >= 5) wins.push(`Training volume up ${Math.round(training.volumeChangePct)}% on last week.`);

  // Body weight and composition.
  const weight = judgeWeight(input);
  if (weight.win) wins.push(weight.win);
  if (weight.action) actions.push(weight.action);
  const composition = judgeComposition(input);
  if (composition.win) wins.push(composition.win);
  if (composition.action) actions.push(composition.action);

  // Habits.
  if (ratings.nutrition <= 2) actions.push('Nutrition drifted. Pick one habit: a palm-sized serving of protein at every meal (about 1.6 g per kg of body weight a day).');
  if (health?.stepsPerDay !== undefined) {
    const steps = Math.round(health.stepsPerDay).toLocaleString();
    if (goal === 'fat_loss' && health.stepsPerDay < 7000) actions.push(`Steps averaged ${steps} a day. Add a 15–20 minute walk to reach 8,000 or more; it burns calories without hurting recovery.`);
    else if (health.stepsPerDay >= 10000) wins.push(`${steps} steps a day on average.`);
  }
  if (ratings.motivation <= 2) actions.push("Motivation is low, and that's normal. Next week, just show up and finish the first exercise. Momentum follows.");
  else if (ratings.motivation >= 4 && planned > 0 && done >= planned) wins.push('Motivation is high. Ride it, but stick to the plan rather than adding extra.');

  const topActions = actions.slice(0, 3);
  let headline: string;
  if (holdProgression) headline = 'Recovery first this week.';
  else if (planned > 0 && done < planned / 2) headline = "Let's get back on schedule.";
  else if (!topActions.length) headline = 'Great week. Keep doing exactly this.';
  else if (weight.trend === 'on_track' && done >= planned) headline = 'On track. A couple of small tweaks below.';
  else headline = "Solid week. Here's your focus for the next one.";

  return {
    headline,
    wins,
    actions: topActions,
    weightTrend: weight.trend,
    weeklyChangePct: weight.weeklyChangePct,
    fatMassChange: composition.fatMassChange,
    leanMassChange: composition.leanMassChange,
    workoutsDone: done,
    workoutsPlanned: planned,
    newBests: training.newBests,
    holdProgression,
  };
}

/** A check-in is due if there's never been one, or the last was 6+ days ago. */
export function isCheckInDue(checkIns: CheckIn[], now: Date): boolean {
  const last = checkIns[checkIns.length - 1];
  if (!last) return true;
  return now.getTime() - new Date(last.date).getTime() >= 6 * DAY;
}
