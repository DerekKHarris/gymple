import { EXERCISES, canPerform, findExercise, getExercise } from '@/data/exercises';
import { PLANS } from '@/data/plans';
import { newId } from './id';
import { TOTAL_WEEKS, schemeFor, timedScheme, weekInfo, type Scheme } from './periodization';
import type { ExerciseLog, LoggedSet, Target } from './progression';
import type {
  Equipment,
  Exercise,
  Goal,
  Plan,
  PlanSlot,
  Profile,
  Program,
  ProgramDay,
  ProgramExercise,
  Role,
  Session,
  SessionExercise,
  SetEntry,
} from './types';

// ---------- Resolving plans to the user's equipment ----------

/** Picks the exercise for a slot: the first preferred one the user can do, else any with the same pattern. */
export function resolveSlot(slot: PlanSlot, equipment: Equipment[]): Exercise | undefined {
  for (const id of slot.prefer) {
    const exercise = findExercise(id);
    if (exercise && canPerform(exercise, equipment)) return exercise;
  }
  const sameRole = (e: Exercise) => (slot.role === 'main' ? e.compound : true);
  return (
    EXERCISES.find((e) => e.pattern === slot.pattern && canPerform(e, equipment) && sameRole(e)) ??
    EXERCISES.find((e) => e.pattern === slot.pattern && canPerform(e, equipment))
  );
}

export function resolvePlanDays(plan: Plan, equipment: Equipment[]): ProgramDay[] {
  return plan.days.map((day) => {
    const used = new Set<string>();
    const exercises: ProgramExercise[] = [];
    for (const slot of day.slots) {
      let exercise = resolveSlot(slot, equipment);
      // Avoid doing the same exercise twice in a day when a slot falls back.
      if (exercise && used.has(exercise.id)) {
        exercise = EXERCISES.find((e) => e.pattern === slot.pattern && canPerform(e, equipment) && !used.has(e.id));
      }
      if (!exercise) continue;
      used.add(exercise.id);
      exercises.push({ slotId: newId(), exerciseId: exercise.id, role: slot.role });
    }
    return { name: day.name, focus: day.focus, exercises };
  });
}

export function createProgram(plan: Plan, profile: Profile): Program {
  return {
    id: newId(),
    planId: plan.id,
    name: plan.name,
    goal: profile.goal,
    startedAt: new Date().toISOString(),
    days: resolvePlanDays(plan, profile.equipment),
  };
}

// ---------- Recommendations ----------

/** Share of a plan's slots that resolve to one of their preferred exercises with this equipment. */
export function equipmentFit(plan: Plan, equipment: Equipment[]): number {
  let total = 0;
  let good = 0;
  for (const day of plan.days) {
    for (const slot of day.slots) {
      total++;
      const exercise = resolveSlot(slot, equipment);
      if (exercise && slot.prefer.slice(0, 2).includes(exercise.id)) good++;
      else if (exercise && slot.prefer.includes(exercise.id)) good += 0.6;
      else if (exercise) good += 0.3;
    }
  }
  return total ? good / total : 0;
}

export interface PlanRecommendation {
  plan: Plan;
  score: number;
  reasons: string[];
}

const GOAL_LABEL: Record<Goal, string> = {
  strength: 'strength',
  hypertrophy: 'building muscle',
  fat_loss: 'fat loss',
  general: 'general fitness',
};

export function recommendPlans(profile: Profile): PlanRecommendation[] {
  return PLANS.map((plan) => {
    const reasons: string[] = [];
    let score = 0;
    if (plan.bestFor[0] === profile.goal) {
      score += 4;
      reasons.push(`Built for ${GOAL_LABEL[profile.goal]}`);
    } else if (plan.bestFor.includes(profile.goal)) {
      score += 3;
      reasons.push(`Good for ${GOAL_LABEL[profile.goal]}`);
    }
    if (plan.levels.includes(profile.experience)) {
      score += 2;
      reasons.push(`Suits ${profile.experience} lifters`);
    } else if (profile.experience === 'beginner') {
      score -= 2;
    }
    const dayDiff = Math.abs(plan.daysPerWeek - profile.daysPerWeek);
    if (dayDiff === 0) {
      score += 3;
      reasons.push(`Matches your ${profile.daysPerWeek} days a week`);
    } else if (dayDiff === 1) {
      score += 1;
    } else {
      score -= dayDiff;
    }
    const fit = equipmentFit(plan, profile.equipment);
    score += fit * 3;
    if (fit >= 0.85) reasons.push('Fits your equipment');
    if (plan.split === 'core' && profile.goal !== 'general' && profile.goal !== 'fat_loss') score -= 3;
    return { plan, score, reasons };
  }).sort((a, b) => b.score - a.score);
}

// ---------- Sessions ----------

export const sessionId = (programId: string, week: number, day: number) => `${programId}:w${week}:d${day}`;

export function schemeForExercise(goal: Goal, week: number, role: Role, exercise: Exercise): Scheme {
  const scheme = schemeFor(goal, week, role);
  return exercise.timed ? timedScheme(scheme) : scheme;
}

export function buildSets(scheme: Scheme): SetEntry[] {
  return Array.from({ length: scheme.sets }, () => ({
    id: newId(),
    repMin: scheme.repMin,
    repMax: scheme.repMax,
    done: false,
  }));
}

export function buildSessionExercise(program: Program, week: number, item: ProgramExercise): SessionExercise {
  const exercise = getExercise(item.exerciseId);
  return {
    id: newId(),
    slotId: item.slotId,
    exerciseId: item.exerciseId,
    role: item.role,
    sets: buildSets(schemeForExercise(program.goal, week, item.role, exercise)),
  };
}

export function buildSession(program: Program, week: number, day: number): Session {
  const template = program.days[day];
  return {
    id: sessionId(program.id, week, day),
    programId: program.id,
    week,
    day,
    name: template.name,
    focus: template.focus,
    isDeload: weekInfo(program.goal, week).isDeload,
    exercises: template.exercises.map((item) => buildSessionExercise(program, week, item)),
  };
}

export function targetFor(goal: Goal, week: number, se: SessionExercise, set: SetEntry): Target {
  const exercise = getExercise(se.exerciseId);
  const scheme = schemeForExercise(goal, week, se.role, exercise);
  return { repMin: set.repMin, repMax: set.repMax, rir: scheme.rir, isDeload: weekInfo(goal, week).isDeload };
}

export function sessionStatus(session: Session | undefined): 'not_started' | 'in_progress' | 'done' {
  if (!session) return 'not_started';
  if (session.completedAt) return 'done';
  const any = session.exercises.some((e) => e.sets.some((s) => s.done));
  return any ? 'in_progress' : 'not_started';
}

/** The first week that still has an unfinished day. */
export function currentWeek(program: Program, sessions: Record<string, Session>): number {
  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    for (let day = 0; day < program.days.length; day++) {
      if (!sessions[sessionId(program.id, week, day)]?.completedAt) return week;
    }
  }
  return TOTAL_WEEKS;
}

// ---------- History ----------

export function toLoggedSet(set: SetEntry): LoggedSet | null {
  if (!set.done || set.reps === undefined) return null;
  return { weight: set.weight ?? 0, reps: set.reps, repMin: set.repMin, repMax: set.repMax, effort: set.effort };
}

function sessionDate(session: Session): string {
  if (session.completedAt) return session.completedAt;
  const times = session.exercises.flatMap((e) => e.sets.map((s) => s.doneAt).filter(Boolean) as string[]);
  return times.sort().pop() ?? session.startedAt ?? '';
}

/** All earlier logs for an exercise across every session and program, oldest first. */
export function exerciseHistory(sessions: Record<string, Session>, exerciseId: string, excludeSessionId?: string): ExerciseLog[] {
  const logs: ExerciseLog[] = [];
  for (const session of Object.values(sessions)) {
    if (session.id === excludeSessionId) continue;
    const sets: LoggedSet[] = [];
    for (const se of session.exercises) {
      if (se.exerciseId !== exerciseId) continue;
      for (const set of se.sets) {
        const logged = toLoggedSet(set);
        if (logged) sets.push(logged);
      }
    }
    if (sets.length) logs.push({ sessionId: session.id, date: sessionDate(session), isDeload: session.isDeload, sets });
  }
  return logs.sort((a, b) => a.date.localeCompare(b.date));
}
