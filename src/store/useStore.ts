import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getExercise } from '@/data/exercises';
import { getPlan } from '@/data/plans';
import { newId } from '@/lib/id';
import { buildSession, buildSessionExercise, createProgram, schemeForExercise, sessionId, sessionStatus } from '@/lib/program';
import type { EditScope, Effort, Goal, Profile, Program, ProgramExercise, Role, Session } from '@/lib/types';

interface State {
  profile?: Profile;
  program?: Program;
  pastPrograms: Program[];
  sessions: Record<string, Session>;

  saveProfile: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  /** Changes the goal for the profile and the active program; workouts not yet opened use the new sets and reps. */
  changeGoal: (goal: Goal) => void;
  startPlan: (planId: string) => void;
  ensureSession: (week: number, day: number) => string | undefined;

  logSet: (sessionId: string, exerciseId: string, setId: string, values: { weight: number; reps: number }) => void;
  undoSet: (sessionId: string, exerciseId: string, setId: string) => void;
  rateSet: (sessionId: string, exerciseId: string, setId: string, effort: Effort | undefined) => void;
  addSet: (sessionId: string, exerciseId: string) => void;
  removeSet: (sessionId: string, exerciseId: string, setId: string) => void;

  addExercise: (sessionId: string, exerciseId: string, scope: EditScope) => void;
  swapExercise: (sessionId: string, sessionExerciseId: string, exerciseId: string, scope: EditScope) => void;
  removeExercise: (sessionId: string, sessionExerciseId: string, scope: EditScope) => void;

  finishSession: (sessionId: string) => void;
  reopenSession: (sessionId: string) => void;
  resetAll: () => void;
}

type SessionUpdater = (session: Session) => Session;

const withSession = (state: State, id: string, update: SessionUpdater): Partial<State> => {
  const session = state.sessions[id];
  if (!session) return {};
  return { sessions: { ...state.sessions, [id]: update(session) } };
};

const mapSets = (
  session: Session,
  exerciseId: string,
  update: (sets: Session['exercises'][number]['sets']) => Session['exercises'][number]['sets'],
): Session => ({
  ...session,
  exercises: session.exercises.map((e) => (e.id === exerciseId ? { ...e, sets: update(e.sets) } : e)),
});

/**
 * Applies a template edit to the program, then drops later untouched sessions for the
 * same day so they are rebuilt from the updated template when opened.
 */
const editTemplate = (
  state: State,
  session: Session,
  edit: (exercises: ProgramExercise[]) => ProgramExercise[],
): Partial<State> => {
  const program = state.program;
  if (!program || program.id !== session.programId) return {};
  const days = program.days.map((d, i) => (i === session.day ? { ...d, exercises: edit(d.exercises) } : d));
  const sessions = { ...state.sessions };
  for (const s of Object.values(sessions)) {
    if (s.programId === program.id && s.day === session.day && s.week > session.week && sessionStatus(s) === 'not_started') {
      delete sessions[s.id];
    }
  }
  return { program: { ...program, days }, sessions };
};

const initial = { profile: undefined, program: undefined, pastPrograms: [] as Program[], sessions: {} as Record<string, Session> };

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      saveProfile: (profile) => set({ profile }),
      updateProfile: (patch) => {
        const profile = get().profile;
        if (profile) set({ profile: { ...profile, ...patch } });
      },

      changeGoal: (goal) => {
        const { profile, program } = get();
        if (!profile) return;
        set({ profile: { ...profile, goal }, program: program ? { ...program, goal } : program });
      },

      startPlan: (planId) => {
        const { profile, program, pastPrograms } = get();
        const plan = getPlan(planId);
        if (!profile || !plan) return;
        set({
          program: createProgram(plan, profile),
          pastPrograms: program ? [...pastPrograms, program] : pastPrograms,
        });
      },

      ensureSession: (week, day) => {
        const { program, sessions } = get();
        if (!program || !program.days[day]) return undefined;
        const id = sessionId(program.id, week, day);
        if (!sessions[id]) set({ sessions: { ...sessions, [id]: buildSession(program, week, day) } });
        return id;
      },

      logSet: (sid, exerciseId, setId, { weight, reps }) =>
        set((state) =>
          withSession(state, sid, (session) => ({
            ...mapSets(session, exerciseId, (sets) =>
              sets.map((s) => (s.id === setId ? { ...s, weight, reps, done: true, doneAt: new Date().toISOString() } : s)),
            ),
            startedAt: session.startedAt ?? new Date().toISOString(),
          })),
        ),

      undoSet: (sid, exerciseId, setId) =>
        set((state) =>
          withSession(state, sid, (session) =>
            mapSets(session, exerciseId, (sets) => sets.map((s) => (s.id === setId ? { ...s, done: false, doneAt: undefined, effort: undefined } : s))),
          ),
        ),

      rateSet: (sid, exerciseId, setId, effort) =>
        set((state) =>
          withSession(state, sid, (session) => mapSets(session, exerciseId, (sets) => sets.map((s) => (s.id === setId ? { ...s, effort } : s)))),
        ),

      addSet: (sid, exerciseId) =>
        set((state) =>
          withSession(state, sid, (session) =>
            mapSets(session, exerciseId, (sets) => {
              const last = sets[sets.length - 1];
              const se = session.exercises.find((e) => e.id === exerciseId)!;
              const scheme = schemeForExercise(state.program?.goal ?? 'general', session.week, se.role, getExercise(se.exerciseId));
              return [...sets, { id: newId(), repMin: last?.repMin ?? scheme.repMin, repMax: last?.repMax ?? scheme.repMax, done: false }];
            }),
          ),
        ),

      removeSet: (sid, exerciseId, setId) =>
        set((state) => withSession(state, sid, (session) => mapSets(session, exerciseId, (sets) => sets.filter((s) => s.id !== setId)))),

      addExercise: (sid, exerciseId, scope) => {
        const state = get();
        const session = state.sessions[sid];
        const program = state.program;
        if (!session || !program) return;
        const exercise = getExercise(exerciseId);
        const role: Role = exercise.primary === 'abs' ? 'core' : 'accessory';
        const item: ProgramExercise = { slotId: newId(), exerciseId, role };
        const se = buildSessionExercise(program, session.week, item);
        const sessionPatch = withSession(state, sid, (s) => ({ ...s, exercises: [...s.exercises, se] }));
        if (scope === 'today') return set(sessionPatch);
        const merged = { ...state, ...sessionPatch } as State;
        set({ ...sessionPatch, ...editTemplate(merged, session, (list) => [...list, item]) });
      },

      swapExercise: (sid, seId, exerciseId, scope) => {
        const state = get();
        const session = state.sessions[sid];
        const program = state.program;
        const target = session?.exercises.find((e) => e.id === seId);
        if (!session || !program || !target) return;
        const exercise = getExercise(exerciseId);
        const scheme = schemeForExercise(program.goal, session.week, target.role, exercise);
        const sessionPatch = withSession(state, sid, (s) => ({
          ...s,
          exercises: s.exercises.map((e) =>
            e.id === seId
              ? {
                  ...e,
                  exerciseId,
                  sets: e.sets.map((set) => ({ id: set.id, repMin: scheme.repMin, repMax: scheme.repMax, done: false })),
                }
              : e,
          ),
        }));
        if (scope === 'today') return set(sessionPatch);
        const merged = { ...state, ...sessionPatch } as State;
        set({
          ...sessionPatch,
          ...editTemplate(merged, session, (list) => list.map((p) => (p.slotId === target.slotId ? { ...p, exerciseId } : p))),
        });
      },

      removeExercise: (sid, seId, scope) => {
        const state = get();
        const session = state.sessions[sid];
        const target = session?.exercises.find((e) => e.id === seId);
        if (!session || !target) return;
        const sessionPatch = withSession(state, sid, (s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== seId) }));
        if (scope === 'today') return set(sessionPatch);
        const merged = { ...state, ...sessionPatch } as State;
        set({ ...sessionPatch, ...editTemplate(merged, session, (list) => list.filter((p) => p.slotId !== target.slotId)) });
      },

      finishSession: (sid) =>
        set((state) => withSession(state, sid, (s) => ({ ...s, completedAt: new Date().toISOString(), startedAt: s.startedAt ?? new Date().toISOString() }))),

      reopenSession: (sid) => set((state) => withSession(state, sid, (s) => ({ ...s, completedAt: undefined }))),

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'gymple-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ profile, program, pastPrograms, sessions }) => ({ profile, program, pastPrograms, sessions }),
    },
  ),
);

/** True once saved data has been loaded from device storage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
