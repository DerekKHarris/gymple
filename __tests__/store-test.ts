import { EQUIPMENT_PRESETS } from '@/data/goals';
import { sessionId } from '@/lib/program';
import { suggestionsForExercise } from '@/lib/suggest';
import { useStore } from '@/store/useStore';

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const get = () => useStore.getState();

beforeEach(() => {
  get().resetAll();
  get().saveProfile({ goal: 'strength', experience: 'beginner', daysPerWeek: 3, equipment: EQUIPMENT_PRESETS[0].equipment, units: 'lb', restSeconds: 120 });
  get().startPlan('full_body_3');
});

describe('store', () => {
  it('creates a program and materialises a session on demand', () => {
    const program = get().program!;
    expect(program.planId).toBe('full_body_3');
    const id = get().ensureSession(1, 0)!;
    expect(id).toBe(sessionId(program.id, 1, 0));
    expect(get().sessions[id].exercises.map((e) => e.exerciseId)).toEqual(['back_squat', 'bench_press', 'barbell_row', 'plank']);
  });

  it('feeds logged sets into the next set and the next session', () => {
    const id = get().ensureSession(1, 0)!;
    const squat = get().sessions[id].exercises[0];
    get().logSet(id, squat.id, squat.sets[0].id, { weight: 135, reps: 5 });
    let session = get().sessions[id];
    const within = suggestionsForExercise(get().profile!, get().sessions, session, 0);
    expect(within[1]).toMatchObject({ kind: 'hold', weight: 135 });

    for (const set of session.exercises[0].sets.slice(1)) get().logSet(id, squat.id, set.id, { weight: 135, reps: 5 });
    get().finishSession(id);

    const next = get().ensureSession(1, 1)!;
    session = get().sessions[next];
    const squatIndex = session.exercises.findIndex((e) => e.exerciseId === 'back_squat');
    const fromHistory = suggestionsForExercise(get().profile!, get().sessions, session, squatIndex);
    expect(fromHistory[0]).toMatchObject({ kind: 'increase', weight: 145 });
  });

  it('applies "today only" edits to just the session', () => {
    const id = get().ensureSession(1, 0)!;
    const bench = get().sessions[id].exercises[1];
    get().swapExercise(id, bench.id, 'db_bench_press', 'today');
    expect(get().sessions[id].exercises[1].exerciseId).toBe('db_bench_press');
    expect(get().program!.days[0].exercises[1].exerciseId).toBe('bench_press');
  });

  it('applies "future" edits to the template and rebuilds untouched later sessions', () => {
    const later = get().ensureSession(2, 0)!;
    const id = get().ensureSession(1, 0)!;
    const bench = get().sessions[id].exercises[1];
    get().swapExercise(id, bench.id, 'db_bench_press', 'future');
    expect(get().program!.days[0].exercises[1].exerciseId).toBe('db_bench_press');
    expect(get().sessions[later]).toBeUndefined();
    const rebuilt = get().ensureSession(2, 0)!;
    expect(get().sessions[rebuilt].exercises[1].exerciseId).toBe('db_bench_press');

    get().addExercise(id, 'db_curl', 'future');
    expect(get().program!.days[0].exercises.map((e) => e.exerciseId)).toContain('db_curl');

    const plank = get().sessions[id].exercises.find((e) => e.exerciseId === 'plank')!;
    get().removeExercise(id, plank.id, 'future');
    expect(get().sessions[id].exercises.some((e) => e.exerciseId === 'plank')).toBe(false);
    expect(get().program!.days[0].exercises.some((e) => e.exerciseId === 'plank')).toBe(false);
  });

  it('adds and removes sets, and records effort', () => {
    const id = get().ensureSession(1, 0)!;
    const ex = get().sessions[id].exercises[0];
    get().addSet(id, ex.id);
    expect(get().sessions[id].exercises[0].sets).toHaveLength(ex.sets.length + 1);
    const last = get().sessions[id].exercises[0].sets.at(-1)!;
    get().removeSet(id, ex.id, last.id);
    expect(get().sessions[id].exercises[0].sets).toHaveLength(ex.sets.length);

    get().logSet(id, ex.id, ex.sets[0].id, { weight: 135, reps: 5 });
    get().rateSet(id, ex.id, ex.sets[0].id, 'easy');
    expect(get().sessions[id].exercises[0].sets[0]).toMatchObject({ done: true, effort: 'easy' });
    get().undoSet(id, ex.id, ex.sets[0].id);
    expect(get().sessions[id].exercises[0].sets[0]).toMatchObject({ done: false, effort: undefined });
  });

  it('keeps history when switching plans', () => {
    const id = get().ensureSession(1, 0)!;
    const ex = get().sessions[id].exercises[0];
    get().logSet(id, ex.id, ex.sets[0].id, { weight: 135, reps: 5 });
    get().startPlan('push_pull_4');
    expect(get().pastPrograms).toHaveLength(1);
    expect(get().sessions[id]).toBeDefined();
  });
});
