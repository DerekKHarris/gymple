import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseCard } from '@/components/ExerciseCard';
import { ExercisePicker } from '@/components/ExercisePicker';
import { RestTimer, type NextUp } from '@/components/RestTimer';
import { ChoiceSheet, afterModalClose, type Choice } from '@/components/Sheet';
import { Badge, Button, Display, SegmentBar, Stat, text } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { saveStrengthWorkout } from '@/lib/health';
import { weekInfo } from '@/lib/periodization';
import { exerciseHistory, sessionId } from '@/lib/program';
import { estimateOneRepMax } from '@/lib/progression';
import { suggestionsForExercise } from '@/lib/suggest';
import type { EditScope, Exercise, Profile, Session, SessionExercise, SetEntry } from '@/lib/types';
import { useProgressionHold, useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';

interface TimerState {
  endsAt: number;
  duration: number;
  seId: string;
  setId: string;
  label: string;
}

type Pending =
  | { kind: 'menu'; se: SessionExercise }
  | { kind: 'scope'; action: 'swap' | 'delete' | 'add'; se?: SessionExercise; exercise?: Exercise }
  | { kind: 'finish' }
  | null;

function summarize(session: Session, sessions: Record<string, Session>) {
  let sets = 0;
  let volume = 0;
  const records: string[] = [];
  for (const se of session.exercises) {
    const done = se.sets.filter((s) => s.done && s.reps);
    sets += done.length;
    volume += done.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
    const best = Math.max(0, ...done.map((s) => estimateOneRepMax(s.weight ?? 0, s.reps ?? 0)));
    if (!best) continue;
    const previous = Math.max(0, ...exerciseHistory(sessions, se.exerciseId, session.id).flatMap((l) => l.sets.map((s) => estimateOneRepMax(s.weight, s.reps))));
    if (previous > 0 && best > previous) records.push(getExercise(se.exerciseId).name);
  }
  const ms = session.startedAt && session.completedAt ? new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime() : 0;
  const minutes = Math.floor(ms / 60000);
  const time = `${minutes}:${Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, '0')}`;
  return { sets, volume: Math.round(volume), records, time };
}

/** The next unlogged set after the one just logged, with its suggested weight. */
function nextUp(profile: Profile, sessions: Record<string, Session>, session: Session, seId: string, hold: boolean): NextUp | undefined {
  const start = Math.max(0, session.exercises.findIndex((e) => e.id === seId));
  const order = [...session.exercises.keys()].map((i) => (start + i) % session.exercises.length);
  for (const i of order) {
    const se = session.exercises[i];
    const setIndex = se.sets.findIndex((s) => !s.done);
    if (setIndex < 0) continue;
    const exercise = getExercise(se.exerciseId);
    const suggestion = suggestionsForExercise(profile, sessions, session, i, undefined, hold)[setIndex];
    const load = suggestion.weight === null ? 'Pick weight ·' : suggestion.weight === 0 ? (exercise.load === 'bodyweight' ? '' : `0 ${profile.units} ×`) : `${suggestion.weight} ${profile.units} ×`;
    return {
      label: `Set ${setIndex + 1} of ${se.sets.length}`,
      detail: `${load} ${suggestion.reps}${exercise.timed ? 's' : ''}`.trim(),
      exercise,
    };
  }
  return undefined;
}

export default function WorkoutScreen() {
  const params = useLocalSearchParams<{ week: string; day: string }>();
  const week = Number(params.week);
  const day = Number(params.day);
  const router = useRouter();

  const profile = useStore((s) => s.profile);
  const program = useStore((s) => s.program);
  const ensureSession = useStore((s) => s.ensureSession);
  const sid = program ? sessionId(program.id, week, day) : '';
  const session = useStore((s) => s.sessions[sid]);
  const sessions = useStore((s) => s.sessions);
  const hold = useProgressionHold();
  const { rateSet, addSet, removeSet, addExercise, swapExercise, removeExercise, finishSession, reopenSession } = useStore.getState();

  const [timer, setTimer] = useState<TimerState | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'swap'; se: SessionExercise } | null>(null);
  const [summary, setSummary] = useState(false);

  useEffect(() => {
    if (program && Number.isFinite(week) && Number.isFinite(day)) ensureSession(week, day);
  }, [program, week, day, ensureSession]);

  const onLogged = useCallback(
    (se: SessionExercise, set: SetEntry, label: string) => {
      const duration = profile?.restSeconds ?? 120;
      setTimer({ endsAt: Date.now() + duration * 1000, duration, seId: se.id, setId: set.id, label });
    },
    [profile?.restSeconds],
  );
  const onMenu = useCallback((se: SessionExercise) => setPending({ kind: 'menu', se }), []);

  if (!profile || !program || !session) return null;

  const info = weekInfo(program.goal, week);
  const timerSet = timer ? session.exercises.find((e) => e.id === timer.seId)?.sets.find((s) => s.id === timer.setId) : undefined;
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const exerciseProgress = session.exercises.reduce((n, e) => n + (e.sets.length ? e.sets.filter((s) => s.done).length / e.sets.length : 0), 0);
  const estMinutes = Math.round((totalSets * (profile.restSeconds + 45)) / 60 / 5) * 5;

  const applyScoped = (scope: EditScope) => {
    if (pending?.kind !== 'scope') return;
    if (pending.action === 'delete' && pending.se) removeExercise(session.id, pending.se.id, scope);
    if (pending.action === 'swap' && pending.se && pending.exercise) swapExercise(session.id, pending.se.id, pending.exercise.id, scope);
    if (pending.action === 'add' && pending.exercise) addExercise(session.id, pending.exercise.id, scope);
  };

  const scopeChoices: Choice[] = [
    { label: 'Just this workout', onPress: () => applyScoped('today') },
    {
      label: `This and future ${session.name} days`,
      description: `Updates ${session.name} for weeks ${week + 1}–12 too.`,
      variant: 'primary',
      onPress: () => applyScoped('future'),
    },
  ];

  const menuChoices: Choice[] =
    pending?.kind === 'menu'
      ? [
          { label: 'Change exercise', onPress: () => setPicker({ mode: 'swap', se: pending.se }) },
          { label: 'Add a set', onPress: () => addSet(session.id, pending.se.id) },
          ...(pending.se.sets.length > 1
            ? [{ label: 'Remove last set', onPress: () => removeSet(session.id, pending.se.id, pending.se.sets[pending.se.sets.length - 1].id) }]
            : []),
          { label: 'Delete exercise', variant: 'danger' as const, onPress: () => setPending({ kind: 'scope', action: 'delete', se: pending.se }) },
        ]
      : [];

  const finish = () => {
    finishSession(session.id);
    const { coach } = useStore.getState();
    const done = useStore.getState().sessions[session.id];
    if (coach.healthConnected && coach.saveToHealth && done?.startedAt && done.completedAt) {
      void saveStrengthWorkout(new Date(done.startedAt), new Date(done.completedAt));
    }
    setTimer(null);
    setSummary(true);
  };

  const stats = summary ? summarize(session, sessions) : null;
  const weekDone = program.days.filter((_, d) => sessions[sessionId(program.id, week, d)]?.completedAt).length;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={{ title: `WEEK ${week} · ${session.name.toUpperCase()}` }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.dayLabel}>DAY {day + 1}</Text>
            <Badge label={info.phase} tone={info.isDeload ? 'info' : info.isTest ? 'warning' : 'success'} />
            {session.completedAt ? <Badge label="Completed" tone="accent" /> : null}
          </View>
          <Display size={30}>{session.focus}</Display>
          <Text style={text.muted}>{info.summary}</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={`${estMinutes} min`} label="Est. time" accent />
          <View style={styles.divider} />
          <Stat value={`${doneSets}/${totalSets}`} label="Sets done" accent />
          <View style={styles.divider} />
          <Stat value={`${Math.round(profile.restSeconds / 6) / 10}m`} label="Rest" accent />
        </View>
        <SegmentBar total={Math.max(1, session.exercises.length)} filled={exerciseProgress} height={6} />

        {session.exercises.map((se, i) => (
          <ExerciseCard key={se.id} profile={profile} session={session} index={i} onLogged={onLogged} onMenu={onMenu} />
        ))}

        <Button title="+ Add exercise" variant="secondary" onPress={() => setPicker({ mode: 'add' })} />
        {session.completedAt ? <Button title="Reopen workout" variant="ghost" onPress={() => reopenSession(session.id)} /> : null}
      </ScrollView>

      {!session.completedAt ? (
        <View style={styles.footer}>
          <Button
            title="Finish workout"
            variant={doneSets === totalSets ? 'primary' : 'secondary'}
            onPress={() => (doneSets < totalSets ? setPending({ kind: 'finish' }) : finish())}
            testID="finish-workout"
          />
        </View>
      ) : null}

      {timer ? (
        <RestTimer
          endsAt={timer.endsAt}
          duration={timer.duration}
          setLabel={timer.label}
          effort={timerSet?.effort}
          next={nextUp(profile, sessions, session, timer.seId, hold)}
          onRate={(effort) => rateSet(session.id, timer.seId, timer.setId, effort)}
          onAdjust={(sec) => setTimer({ ...timer, endsAt: Math.max(Date.now(), timer.endsAt + sec * 1000), duration: Math.max(15, timer.duration + sec) })}
          onClose={() => setTimer(null)}
        />
      ) : null}

      <ChoiceSheet
        visible={pending?.kind === 'menu'}
        title={pending?.kind === 'menu' ? getExercise(pending.se.exerciseId).name : ''}
        choices={menuChoices}
        onClose={() => setPending((p) => (p?.kind === 'menu' ? null : p))}
      />
      <ChoiceSheet
        visible={pending?.kind === 'scope'}
        title={
          pending?.kind === 'scope'
            ? pending.action === 'delete'
              ? `Delete ${getExercise(pending.se!.exerciseId).name}?`
              : pending.action === 'swap'
                ? `Switch to ${pending.exercise?.name}?`
                : `Add ${pending.exercise?.name}?`
            : ''
        }
        message="Apply this change to today only, or to the rest of your program too?"
        choices={scopeChoices}
        onClose={() => setPending((p) => (p?.kind === 'scope' ? null : p))}
      />
      <ChoiceSheet
        visible={pending?.kind === 'finish'}
        title="Finish with sets left?"
        message={`You've logged ${doneSets} of ${totalSets} sets. Unlogged sets won't count toward your progress.`}
        choices={[{ label: 'Finish workout', variant: 'primary', onPress: finish }]}
        onClose={() => setPending((p) => (p?.kind === 'finish' ? null : p))}
      />

      <ExercisePicker
        visible={!!picker}
        title={picker?.mode === 'swap' ? 'Change exercise' : 'Add exercise'}
        equipment={profile.equipment}
        pattern={picker?.mode === 'swap' ? getExercise(picker.se.exerciseId).pattern : undefined}
        excludeId={picker?.mode === 'swap' ? picker.se.exerciseId : undefined}
        onClose={() => setPicker(null)}
        onPick={(exercise) => {
          const current = picker;
          setPicker(null);
          afterModalClose(() => {
            if (current?.mode === 'swap') setPending({ kind: 'scope', action: 'swap', se: current.se, exercise });
            else setPending({ kind: 'scope', action: 'add', exercise });
          });
        }}
      />

      <Modal visible={summary} animationType="fade" onRequestClose={() => setSummary(false)}>
        <LinearGradient colors={['#000000', '#000000', '#2E3209']} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
          <SafeAreaView style={styles.summary} edges={['top', 'bottom']}>
            {stats ? (
              <>
                <View style={styles.medalWrap}>
                  <View style={styles.medalOuter}>
                    <View style={styles.medalInner}>
                      <Ionicons name="checkmark" size={56} color={colors.accentText} />
                    </View>
                  </View>
                </View>
                <View style={styles.streak}>
                  <Text style={styles.streakTitle}>
                    WEEK {week} · {weekDone} OF {program.days.length} WORKOUTS
                  </Text>
                  <SegmentBar total={program.days.length} filled={weekDone} height={6} />
                </View>
                <Text style={styles.summaryEyebrow}>{program.name.toUpperCase()}</Text>
                <Display size={32}>Workout complete</Display>
                <Text style={text.muted}>
                  {session.name} · {session.focus}
                </Text>
                <View style={styles.grid}>
                  <Stat value={stats.time} label="Total time" />
                  <Stat value={String(stats.sets)} label="Sets" />
                </View>
                <View style={styles.grid}>
                  <Stat value={stats.volume.toLocaleString()} label={`Total volume ${profile.units}`} />
                  <Stat value={String(stats.records.length)} label="New bests" accent={stats.records.length > 0} />
                </View>
                {stats.records.length ? <Text style={text.muted}>New estimated 1RM: {stats.records.join(', ')}</Text> : null}
                <Text style={[text.small, { marginTop: space.sm }]}>Your next workouts will use today’s numbers to set their weights.</Text>
                <View style={{ flex: 1 }} />
                <Button
                  title="Continue"
                  onPress={() => {
                    setSummary(false);
                    router.back();
                  }}
                />
              </>
            ) : null}
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl * 3 },
  hero: { gap: space.sm, paddingHorizontal: space.xs, paddingTop: space.sm },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dayLabel: { color: colors.accent, fontWeight: '900', fontSize: 13, letterSpacing: 0.6 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xs, paddingVertical: space.sm },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg, backgroundColor: 'rgba(0,0,0,0.92)' },
  summary: { flex: 1, padding: space.xl, gap: space.md },
  medalWrap: { alignItems: 'center', marginTop: space.lg },
  medalOuter: { width: 148, height: 148, borderRadius: 74, borderWidth: 10, borderColor: '#3A3A40', backgroundColor: '#1A1A1E', alignItems: 'center', justifyContent: 'center' },
  medalInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  streak: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, gap: space.sm, marginTop: space.lg },
  streakTitle: { color: colors.text, fontWeight: '900', fontSize: 13, letterSpacing: 0.4 },
  summaryEyebrow: { color: colors.accent, fontWeight: '900', fontSize: 12, letterSpacing: 0.5, marginTop: space.md },
  grid: { flexDirection: 'row', gap: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: space.md },
});
