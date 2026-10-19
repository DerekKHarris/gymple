import { getExercise } from '@/data/exercises';
import {
  estimateOneRepMax,
  increment,
  roundLoad,
  suggestNextSet,
  weightForReps,
  type ExerciseLog,
  type LoggedSet,
  type SuggestInput,
} from '@/lib/progression';

const squat = getExercise('back_squat');
const bench = getExercise('bench_press');
const curl = getExercise('db_curl');
const pushUp = getExercise('push_up');

const sets = (weight: number, reps: number[], repMin: number, repMax: number, effort?: LoggedSet['effort']): LoggedSet[] =>
  reps.map((r) => ({ weight, reps: r, repMin, repMax, effort }));

let day = 0;
const log = (s: LoggedSet[], isDeload = false): ExerciseLog => ({
  sessionId: `s${++day}`,
  date: new Date(Date.UTC(2026, 0, day)).toISOString(),
  isDeload,
  sets: s,
});

const base = (over: Partial<SuggestInput>): SuggestInput => ({
  goal: 'strength',
  experience: 'beginner',
  units: 'lb',
  exercise: squat,
  target: { repMin: 5, repMax: 5, rir: 2, isDeload: false },
  history: [],
  currentSets: [],
  ...over,
});

describe('one-rep max helpers', () => {
  it('uses the Epley formula and inverts it', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 1);
    expect(weightForReps(estimateOneRepMax(225, 5), 5)).toBeCloseTo(225, 5);
  });

  it('rounds to real plate jumps and never below an empty bar', () => {
    expect(roundLoad(137, squat, 'lb')).toBe(135);
    expect(roundLoad(139, squat, 'lb', 'down')).toBe(135);
    expect(roundLoad(61.3, squat, 'kg')).toBe(62.5);
    expect(roundLoad(10, squat, 'lb')).toBe(45);
    expect(roundLoad(23, curl, 'kg')).toBe(24);
  });

  it('progresses big lower-body lifts faster for beginners', () => {
    expect(increment(squat, 'beginner', 'lb')).toBe(10);
    expect(increment(squat, 'intermediate', 'lb')).toBe(5);
    expect(increment(bench, 'beginner', 'lb')).toBe(5);
    expect(increment(bench, 'beginner', 'kg')).toBe(2.5);
  });
});

describe('first time doing an exercise', () => {
  it('has no weight to suggest yet', () => {
    const s = suggestNextSet(base({}));
    expect(s.kind).toBe('first');
    expect(s.weight).toBeNull();
    expect(s.reps).toBe(5);
  });

  it('suggests reps for bodyweight work', () => {
    const s = suggestNextSet(base({ exercise: pushUp, goal: 'hypertrophy', target: { repMin: 10, repMax: 12, rir: 2, isDeload: false } }));
    expect(s.weight).toBe(0);
    expect(s.reps).toBe(12);
  });
});

describe('strength: linear progression', () => {
  it('adds weight after every set hit the target', () => {
    const s = suggestNextSet(base({ history: [log(sets(135, [5, 5, 5, 5, 5], 5, 5))] }));
    expect(s.kind).toBe('increase');
    expect(s.weight).toBe(145);
  });

  it('adds a double jump when the sets were rated easy', () => {
    const s = suggestNextSet(base({ history: [log(sets(135, [5, 5, 5, 5, 5], 5, 5, 'easy'))] }));
    expect(s.weight).toBe(155);
  });

  it('repeats the weight after a missed session', () => {
    const s = suggestNextSet(base({ history: [log(sets(185, [5, 5, 5, 4, 3], 5, 5))] }));
    expect(s.kind).toBe('hold');
    expect(s.weight).toBe(185);
  });

  it('resets 10% after three stalled sessions', () => {
    const history = [log(sets(200, [5, 5, 4, 4, 3], 5, 5)), log(sets(200, [5, 5, 5, 4, 4], 5, 5)), log(sets(200, [5, 4, 4, 4, 3], 5, 5))];
    const s = suggestNextSet(base({ history }));
    expect(s.kind).toBe('reset');
    expect(s.weight).toBe(180);
  });

  it('counts only consecutive stalls', () => {
    const history = [log(sets(190, [5, 5, 4, 4, 4], 5, 5)), log(sets(195, [5, 5, 5, 5, 5], 5, 5)), log(sets(200, [5, 5, 4, 4, 3], 5, 5))];
    expect(suggestNextSet(base({ history })).kind).toBe('hold');
  });
});

describe('hypertrophy: double progression', () => {
  const target = { repMin: 8, repMax: 10, rir: 2, isDeload: false };
  const hyp = (over: Partial<SuggestInput>) => base({ goal: 'hypertrophy', exercise: bench, target, ...over });

  it('keeps the weight until every set reaches the top of the range', () => {
    const s = suggestNextSet(hyp({ history: [log(sets(135, [10, 9, 8], 8, 10))] }));
    expect(s.kind).toBe('hold');
    expect(s.weight).toBe(135);
    expect(s.reps).toBe(10);
  });

  it('adds weight once all sets hit the top of the range', () => {
    const s = suggestNextSet(hyp({ history: [log(sets(135, [10, 10, 10], 8, 10))] }));
    expect(s.kind).toBe('increase');
    expect(s.weight).toBe(140);
    expect(s.reps).toBe(8);
  });

  it('drops 10% after two sessions below the range', () => {
    const history = [log(sets(150, [8, 7, 6], 8, 10)), log(sets(150, [7, 6, 6], 8, 10))];
    const s = suggestNextSet(hyp({ history }));
    expect(s.kind).toBe('reset');
    expect(s.weight).toBe(135);
  });

  it('recalculates from estimated 1RM when the rep range changes', () => {
    const history = [log(sets(135, [10, 10, 10], 8, 10))];
    const s = suggestNextSet(hyp({ history, target: { repMin: 6, repMax: 8, rir: 2, isDeload: false } }));
    expect(s.kind).toBe('recalc');
    // 1RM ≈ 135 × (1 + 10/30) = 180; weight for 8 + 2 RIR = 10 reps ≈ 135
    expect(s.weight).toBe(135);
  });
});

describe('deloads', () => {
  it('uses 90% of working weight in a deload week', () => {
    const s = suggestNextSet(base({ history: [log(sets(200, [5, 5, 5, 5, 5], 5, 5))], target: { repMin: 5, repMax: 5, rir: 4, isDeload: true } }));
    expect(s.kind).toBe('deload');
    expect(s.weight).toBe(180);
  });

  it('ignores deload sessions when progressing afterwards', () => {
    const history = [log(sets(200, [5, 5, 5, 5, 5], 5, 5)), log(sets(180, [5, 5, 5], 5, 5), true)];
    const s = suggestNextSet(base({ history }));
    expect(s.weight).toBe(210);
  });
});

describe('within a session', () => {
  const target = { repMin: 8, repMax: 10, rir: 2, isDeload: false };
  const within = (current: LoggedSet[]) => suggestNextSet(base({ goal: 'hypertrophy', exercise: bench, target, currentSets: current }));

  it('holds the weight when the set was on target', () => {
    const s = within(sets(135, [9], 8, 10));
    expect(s.kind).toBe('hold');
    expect(s.weight).toBe(135);
  });

  it('bumps the next set when reps blew past the range', () => {
    const s = within(sets(135, [13], 8, 10));
    expect(s.kind).toBe('increase');
    expect(s.weight).toBe(140);
  });

  it('bumps the next set when the user rated it easy at the top of the range', () => {
    expect(within(sets(135, [10], 8, 10, 'easy')).weight).toBe(140);
  });

  it('drops the next set after missed reps, scaled to the miss', () => {
    expect(within(sets(150, [7], 8, 10)).weight).toBe(140);
    expect(within(sets(150, [5], 8, 10)).weight).toBe(125);
  });

  it('drops the next set after a failed set even if reps were reached', () => {
    const s = within(sets(150, [8], 8, 10, 'fail'));
    expect(s.kind).toBe('decrease');
    expect(s.weight).toBeLessThan(150);
  });

  it('takes priority over history', () => {
    const s = suggestNextSet(
      base({ goal: 'hypertrophy', exercise: bench, target, history: [log(sets(135, [10, 10, 10], 8, 10))], currentSets: sets(140, [6], 8, 10) }),
    );
    expect(s.kind).toBe('decrease');
    expect(s.weight).toBeLessThan(140);
  });
});
