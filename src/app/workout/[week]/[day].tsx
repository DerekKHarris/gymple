import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseCard } from '@/components/ExerciseCard';
import { ExercisePicker } from '@/components/ExercisePicker';
import { RestTimer } from '@/components/RestTimer';
import { ChoiceSheet, Sheet, afterModalClose, type Choice } from '@/components/Sheet';
import { Badge, Button, Card, text } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { weekInfo } from '@/lib/periodization';
import { exerciseHistory } from '@/lib/program';
import { estimateOneRepMax } from '@/lib/progression';
import type { EditScope, Exercise, Session, SessionExercise, SetEntry } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme';

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
  return { sets, volume: Math.round(volume), records };
}

export default function WorkoutScreen() {
  const params = useLocalSearchParams<{ week: string; day: string }>();
  const week = Number(params.week);
  const day = Number(params.day);
  const router = useRouter();

  const profile = useStore((s) => s.profile);
  const program = useStore((s) => s.program);
  const ensureSession = useStore((s) => s.ensureSession);
  const sid = program ? `${program.id}:w${week}:d${day}` : '';
  const session = useStore((s) => s.sessions[sid]);
  const sessions = useStore((s) => s.sessions);
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
    setTimer(null);
    setSummary(true);
  };

  const stats = summary ? summarize(session, sessions) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={{ title: `${session.name} · Week ${week}` }} />
      <ScrollView contentContainerStyle={[styles.content, timer && { paddingBottom: 240 }]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Card style={styles.intro}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={text.h2}>{session.name}</Text>
              <Text style={text.small}>{session.focus}</Text>
            </View>
            <Badge label={info.phase} tone={info.isDeload ? 'info' : info.isTest ? 'warning' : 'accent'} />
          </View>
          <Text style={text.muted}>{info.summary}</Text>
          <Text style={text.small}>
            {doneSets}/{totalSets} sets · rest {Math.round(profile.restSeconds / 60 * 10) / 10} min between sets
          </Text>
          {session.completedAt ? <Badge label="Completed" tone="success" /> : null}
        </Card>

        {session.exercises.map((se, i) => (
          <ExerciseCard key={se.id} profile={profile} session={session} index={i} onLogged={onLogged} onMenu={onMenu} />
        ))}

        <Button title="+ Add exercise" variant="secondary" onPress={() => setPicker({ mode: 'add' })} />
        {session.completedAt ? (
          <Button title="Reopen workout" variant="ghost" onPress={() => reopenSession(session.id)} />
        ) : (
          <Button title="Finish workout" onPress={() => (doneSets < totalSets ? setPending({ kind: 'finish' }) : finish())} testID="finish-workout" />
        )}
      </ScrollView>

      {timer ? (
        <RestTimer
          endsAt={timer.endsAt}
          duration={timer.duration}
          setLabel={timer.label}
          effort={timerSet?.effort}
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

      <Sheet visible={summary} onClose={() => setSummary(false)} title="Workout complete 💪">
        {stats ? (
          <View style={{ gap: space.md }}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{stats.sets}</Text>
                <Text style={text.small}>sets</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{stats.volume.toLocaleString()}</Text>
                <Text style={text.small}>{profile.units} lifted</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{stats.records.length}</Text>
                <Text style={text.small}>new bests</Text>
              </View>
            </View>
            {stats.records.length ? <Text style={text.muted}>New estimated 1RM: {stats.records.join(', ')}</Text> : null}
            <Text style={text.muted}>Your next workouts will use today’s numbers to set their weights.</Text>
            <Button
              title="Back to program"
              onPress={() => {
                setSummary(false);
                router.back();
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl * 2 },
  intro: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  statsRow: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, backgroundColor: colors.cardAlt, borderRadius: 12, padding: space.md, alignItems: 'center' },
  statNum: { color: colors.accent, fontSize: 24, fontWeight: '800' },
});
