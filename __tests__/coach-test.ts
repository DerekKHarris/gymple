import { buildReport, isCheckInDue, trainingWeek, type CoachInput } from '@/lib/coach';
import { weekInfo } from '@/lib/periodization';
import { suggestNextSet } from '@/lib/progression';
import { getExercise } from '@/data/exercises';
import type { CheckIn, CheckInRatings, Session } from '@/lib/types';

const NOW = new Date('2026-03-15T09:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const okRatings: CheckInRatings = { energy: 4, sleep: 4, soreness: 2, stress: 2, nutrition: 4, motivation: 4 };

const previous = (weight: number, units: 'lb' | 'kg' = 'lb'): CheckIn => ({
  id: 'prev',
  date: daysAgo(7),
  week: 1,
  units,
  weight,
  ratings: okRatings,
  report: { headline: '', wins: [], actions: [], weightTrend: 'baseline', workoutsDone: 3, workoutsPlanned: 3, newBests: [], holdProgression: false },
});

const input = (over: Partial<CoachInput>): CoachInput => ({
  goal: 'fat_loss',
  units: 'lb',
  now: NOW,
  weight: 200,
  ratings: okRatings,
  training: { workoutsDone: 3, workoutsPlanned: 3, setsLogged: 50, newBests: [] },
  nextWeek: weekInfo('fat_loss', 2),
  ...over,
});

describe('coach report: body weight', () => {
  it('records a baseline on the first check-in', () => {
    const r = buildReport(input({}));
    expect(r.weightTrend).toBe('baseline');
    expect(r.wins.join(' ')).toMatch(/Baseline recorded: 200 lb/);
  });

  it('praises fat loss in the 0.5–1% a week range', () => {
    const r = buildReport(input({ weight: 198.5, previous: previous(200) }));
    expect(r.weightTrend).toBe('on_track');
    expect(r.weeklyChangePct).toBeCloseTo(-0.75, 1);
  });

  it('flags losing too fast and suggests eating more', () => {
    const r = buildReport(input({ weight: 196, previous: previous(200) }));
    expect(r.weightTrend).toBe('too_fast');
    expect(r.actions.join(' ')).toMatch(/more calories/);
  });

  it('flags a stalled cut', () => {
    expect(buildReport(input({ weight: 200, previous: previous(200) })).weightTrend).toBe('too_slow');
  });

  it('wants a slow gain when building muscle', () => {
    const goal = 'hypertrophy';
    expect(buildReport(input({ goal, weight: 180.7, previous: previous(180) })).weightTrend).toBe('on_track');
    expect(buildReport(input({ goal, weight: 180, previous: previous(180) })).weightTrend).toBe('too_slow');
    expect(buildReport(input({ goal, weight: 183, previous: previous(180) })).weightTrend).toBe('too_fast');
  });

  it('prefers the Apple Health 7-day average and converts units', () => {
    const r = buildReport(input({ units: 'kg', weight: 90, health: { weightAvg: 90.27 }, previous: previous(200, 'lb') }));
    // 200 lb = 90.72 kg, so 90.27 kg is about −0.5% a week.
    expect(r.weeklyChangePct).toBeCloseTo(-0.5, 1);
    expect(r.weightTrend).toBe('on_track');
  });
});

describe('coach report: recovery and consistency', () => {
  it('holds progression when two or more recovery flags are raised', () => {
    const r = buildReport(input({ ratings: { ...okRatings, energy: 2, soreness: 5 }, health: { sleepHours: 5.8 } }));
    expect(r.holdProgression).toBe(true);
    expect(r.headline).toBe('Recovery first this week.');
    expect(r.actions[0]).toMatch(/holding your weights/);
  });

  it("doesn't hold before a deload week; it leans on the deload instead", () => {
    const r = buildReport(input({ ratings: { ...okRatings, energy: 1, stress: 5 }, nextWeek: weekInfo('fat_loss', 4) }));
    expect(r.holdProgression).toBe(false);
    expect(r.actions[0]).toMatch(/deload/);
  });

  it('calls out missed workouts and celebrates a full week', () => {
    expect(buildReport(input({ training: { workoutsDone: 1, workoutsPlanned: 4, setsLogged: 10, newBests: [] } })).headline).toBe("Let's get back on schedule.");
    expect(buildReport(input({})).wins.join(' ')).toMatch(/Hit 3 of 3 workouts/);
  });

  it('nudges steps on a cut', () => {
    const r = buildReport(input({ health: { stepsPerDay: 4200 } }));
    expect(r.actions.join(' ')).toMatch(/4,200 a day/);
  });

  it('keeps the to-do list short', () => {
    const r = buildReport(
      input({ ratings: { energy: 1, sleep: 1, soreness: 5, stress: 5, nutrition: 1, motivation: 1 }, weight: 205, previous: previous(200), training: { workoutsDone: 0, workoutsPlanned: 3, setsLogged: 0, newBests: [] }, health: { stepsPerDay: 3000 } }),
    );
    expect(r.actions.length).toBeLessThanOrEqual(3);
  });
});

describe('training week and due dates', () => {
  it('counts workouts in the last 7 days and spots new bests', () => {
    const session = (id: string, at: string, weight: number): Session => ({
      id,
      programId: 'p',
      week: 1,
      day: 0,
      name: 'Day A',
      focus: '',
      isDeload: false,
      completedAt: at,
      exercises: [{ id: `${id}e`, slotId: 's', exerciseId: 'back_squat', role: 'main', sets: [{ id: `${id}s`, repMin: 5, repMax: 5, weight, reps: 5, done: true, doneAt: at }] }],
    });
    const sessions = { a: session('a', daysAgo(10), 185), b: session('b', daysAgo(2), 195) };
    const week = trainingWeek(undefined, sessions, NOW);
    expect(week.workoutsDone).toBe(1);
    expect(week.newBests).toEqual(['Barbell Back Squat']);
  });

  it('is due with no check-ins or after 6 days', () => {
    expect(isCheckInDue([], NOW)).toBe(true);
    expect(isCheckInDue([{ ...previous(200), date: daysAgo(3) }], NOW)).toBe(false);
    expect(isCheckInDue([{ ...previous(200), date: daysAgo(6) }], NOW)).toBe(true);
  });
});

describe('progression hold', () => {
  it('turns weight increases into holds while recovery is low', () => {
    const base = {
      goal: 'strength' as const,
      experience: 'beginner' as const,
      units: 'lb' as const,
      exercise: getExercise('back_squat'),
      target: { repMin: 5, repMax: 5, rir: 2, isDeload: false },
      history: [{ sessionId: 's', date: daysAgo(2), isDeload: false, sets: [5, 5, 5].map((reps) => ({ weight: 200, reps, repMin: 5, repMax: 5 })) }],
      currentSets: [],
    };
    expect(suggestNextSet(base)).toMatchObject({ kind: 'increase', weight: 210 });
    expect(suggestNextSet({ ...base, hold: true })).toMatchObject({ kind: 'hold', weight: 200 });
  });
});

describe('coach report: body composition', () => {
  it('celebrates fat loss with lean mass held', () => {
    const prev = { ...previous(200), bodyFat: 25 };
    const r = buildReport(input({ weight: 198, bodyFat: 24.2, previous: prev }));
    // 200 × 25% = 50 fat → 198 × 24.2% ≈ 47.9 fat; lean 150 → ≈150.1
    expect(r.fatMassChange).toBeCloseTo(-2.1, 1);
    expect(r.leanMassChange).toBeCloseTo(0.1, 1);
    expect(r.wins.join(' ')).toMatch(/losing fat while keeping muscle/);
  });

  it('warns when a cut is eating into lean mass', () => {
    const prev = { ...previous(200), leanMass: 150 };
    const r = buildReport(input({ weight: 197, leanMass: 147.6, previous: prev }));
    expect(r.actions.join(' ')).toMatch(/lean mass/);
  });

  it('flags a bulk that is mostly fat', () => {
    const prev = { ...previous(180), bodyFat: 15 };
    const r = buildReport(input({ goal: 'hypertrophy', weight: 181, bodyFat: 15.8, previous: prev, nextWeek: weekInfo('hypertrophy', 2) }));
    expect(r.actions.join(' ')).toMatch(/mostly|most of the gain looks like fat/);
  });

  it('prefers Apple Health averages for body fat and lean mass', () => {
    const prev = { ...previous(200), health: { weightAvg: 200, leanMass: 150 } };
    const r = buildReport(input({ weight: 199, bodyFat: 40, health: { weightAvg: 199, leanMass: 150.5 }, previous: prev }));
    expect(r.leanMassChange).toBeCloseTo(0.5, 1);
  });
});
