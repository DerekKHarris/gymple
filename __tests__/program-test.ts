import { EXERCISES, canPerform, getExercise } from '@/data/exercises';
import { EQUIPMENT_PRESETS } from '@/data/goals';
import { PLANS } from '@/data/plans';
import { EXERCISE_MEDIA, thumbnailFor } from '@/data/exerciseMedia';
import { EXERCISE_VIDEOS, videoSearchUrl, videoUrlFor } from '@/data/videos';
import { TOTAL_WEEKS, schemeFor, weekInfo } from '@/lib/periodization';
import { buildSession, createProgram, currentWeek, exerciseHistory, recommendPlans, resolvePlanDays, sessionId } from '@/lib/program';
import type { Equipment, Profile } from '@/lib/types';

const profile = (over: Partial<Profile> = {}): Profile => ({
  goal: 'hypertrophy',
  experience: 'intermediate',
  daysPerWeek: 4,
  equipment: EQUIPMENT_PRESETS[0].equipment,
  units: 'lb',
  restSeconds: 120,
  ...over,
});

describe('data integrity', () => {
  it('has unique exercise ids', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });

  it('only references real exercises that match the slot pattern', () => {
    for (const plan of PLANS) {
      expect(plan.days).toHaveLength(plan.daysPerWeek);
      for (const day of plan.days) {
        for (const slot of day.slots) {
          for (const id of slot.prefer) {
            expect(getExercise(id).pattern).toBe(slot.pattern);
          }
        }
      }
    }
  });

  it('includes the common splits', () => {
    const splits = new Set(PLANS.map((p) => p.split));
    for (const s of ['full_body', 'upper_lower', 'push_pull_legs', 'push_pull', 'body_part', 'core'] as const) expect(splits.has(s)).toBe(true);
  });
});

describe('equipment', () => {
  it.each(EQUIPMENT_PRESETS.map((p) => [p.title, p.equipment] as [string, Equipment[]]))(
    'every plan resolves every slot for "%s"',
    (_title, equipment) => {
      for (const plan of PLANS) {
        const days = resolvePlanDays(plan, equipment);
        days.forEach((day, i) => {
          expect(day.exercises.length).toBe(plan.days[i].slots.length);
          for (const ex of day.exercises) expect(canPerform(getExercise(ex.exerciseId), equipment)).toBe(true);
        });
      }
    },
  );

  it('falls back to bodyweight moves with no equipment', () => {
    const days = resolvePlanDays(PLANS.find((p) => p.id === 'full_body_3')!, []);
    expect(days[0].exercises.map((e) => e.exerciseId)).toEqual(['bw_squat', 'push_up', 'towel_row', 'plank']);
    for (const day of days) for (const ex of day.exercises) expect(getExercise(ex.exerciseId).equipment).toEqual([]);
  });

  it('does not repeat an exercise within a day', () => {
    for (const preset of EQUIPMENT_PRESETS) {
      for (const plan of PLANS) {
        for (const day of resolvePlanDays(plan, preset.equipment)) {
          const ids = day.exercises.map((e) => e.exerciseId);
          expect(new Set(ids).size).toBe(ids.length);
        }
      }
    }
  });
});

describe('periodization', () => {
  it('runs 12 weeks with a deload closing each 4-week block', () => {
    const deloads = Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).filter((w) => weekInfo('hypertrophy', w).isDeload);
    expect(deloads).toEqual([4, 8, 12]);
    expect(weekInfo('strength', 12).isTest).toBe(true);
    expect(weekInfo('strength', 12).isDeload).toBe(false);
  });

  it('matches the research rep zones for each goal', () => {
    expect(schemeFor('strength', 1, 'main')).toMatchObject({ sets: 5, repMin: 5, repMax: 5 });
    expect(schemeFor('strength', 9, 'main').repMax).toBeLessThanOrEqual(5);
    expect(schemeFor('hypertrophy', 1, 'main').repMin).toBeGreaterThanOrEqual(6);
    expect(schemeFor('fat_loss', 1, 'accessory').repMin).toBeGreaterThanOrEqual(12);
    expect(schemeFor('general', 1, 'main')).toMatchObject({ repMin: 8, repMax: 10 });
  });

  it('cuts volume in deload weeks', () => {
    expect(schemeFor('hypertrophy', 4, 'main').sets).toBeLessThan(schemeFor('hypertrophy', 3, 'main').sets);
  });
});

describe('recommendations', () => {
  it('suggests a beginner full-body plan for a new lifter chasing strength', () => {
    const recs = recommendPlans(profile({ goal: 'strength', experience: 'beginner', daysPerWeek: 3 }));
    expect(recs[0].plan.id).toBe('full_body_3');
  });

  it('suggests a 6-day PPL for an intermediate building muscle six days a week', () => {
    const recs = recommendPlans(profile({ goal: 'hypertrophy', daysPerWeek: 6 }));
    expect(recs[0].plan.id).toBe('ppl_6');
  });

  it('suggests a 4-day split for an intermediate building muscle four days a week', () => {
    const recs = recommendPlans(profile({ goal: 'hypertrophy', daysPerWeek: 4 }));
    expect(['upper_lower_4', 'push_pull_4']).toContain(recs[0].plan.id);
  });
});

describe('sessions and history', () => {
  const p = profile();
  const program = createProgram(PLANS.find((x) => x.id === 'upper_lower_4')!, p);

  it('builds sets from the week scheme', () => {
    const session = buildSession(program, 1, 0);
    expect(session.id).toBe(sessionId(program.id, 1, 0));
    const main = session.exercises.find((e) => e.role === 'main')!;
    expect(main.sets).toHaveLength(schemeFor('hypertrophy', 1, 'main').sets);
    expect(buildSession(program, 4, 0).isDeload).toBe(true);
  });

  it('tracks the current week and gathers history across sessions', () => {
    const s1 = buildSession(program, 1, 0);
    s1.exercises[0].sets.forEach((set, i) => Object.assign(set, { done: true, weight: 135, reps: 10 - i, doneAt: '2026-01-01T10:00:00Z' }));
    s1.completedAt = '2026-01-01T11:00:00Z';
    const sessions = { [s1.id]: s1 };
    expect(currentWeek(program, sessions)).toBe(1);

    const history = exerciseHistory(sessions, s1.exercises[0].exerciseId);
    expect(history).toHaveLength(1);
    expect(history[0].sets.map((s) => s.reps)).toEqual(s1.exercises[0].sets.map((_, i) => 10 - i));
    expect(exerciseHistory(sessions, s1.exercises[0].exerciseId, s1.id)).toHaveLength(0);

    const all: Record<string, typeof s1> = {};
    for (let d = 0; d < program.days.length; d++) {
      const s = buildSession(program, 1, d);
      s.completedAt = '2026-01-02T00:00:00Z';
      all[s.id] = s;
    }
    expect(currentWeek(program, all)).toBe(2);
  });
});

describe('exercise videos', () => {
  it('has a YouTube how-to video for every exercise', () => {
    for (const exercise of EXERCISES) {
      const video = EXERCISE_VIDEOS[exercise.id];
      expect(video?.url).toMatch(/^https:\/\/www\.youtube\.com\/(watch\?v=|shorts\/)[\w-]{11}$/);
      expect(videoUrlFor(exercise)).toBe(video?.url);
    }
  });

  it('falls back to a YouTube search', () => {
    expect(videoSearchUrl(getExercise('back_squat'))).toBe('https://www.youtube.com/results?search_query=Barbell%20Back%20Squat%20proper%20form');
  });
});

describe('exercise illustrations', () => {
  it('only covers real exercises and every entry has an image and instructions', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    const entries = Object.entries(EXERCISE_MEDIA);
    expect(entries.length).toBeGreaterThanOrEqual(80);
    for (const [id, media] of entries) {
      expect(ids.has(id)).toBe(true);
      expect(thumbnailFor(id)).toBeDefined();
      expect(media!.instructions.length).toBeGreaterThan(0);
    }
  });
});
