import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MUSCLE_LABELS, getExercise } from '@/data/exercises';
import { openVideo } from '@/data/videos';
import { formatReps } from '@/lib/periodization';
import { exerciseHistory } from '@/lib/program';
import type { Suggestion, SuggestionKind } from '@/lib/progression';
import { suggestionsForExercise } from '@/lib/suggest';
import type { Profile, Session, SessionExercise, SetEntry } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, space } from '@/theme';
import { ExerciseIcon } from './ExerciseIcon';
import { Badge, text } from './ui';

const KIND_STYLE: Record<SuggestionKind, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  first: { icon: 'flag', color: colors.text },
  increase: { icon: 'trending-up', color: colors.accent },
  hold: { icon: 'repeat', color: colors.text },
  decrease: { icon: 'trending-down', color: colors.warning },
  reset: { icon: 'refresh', color: colors.warning },
  deload: { icon: 'leaf', color: colors.text },
  recalc: { icon: 'calculator', color: colors.accent },
  bodyweight: { icon: 'body', color: colors.text },
};

const EFFORT_LABEL = { easy: 'EASY', good: 'GOOD', hard: 'HARD', fail: 'FAILED' } as const;

type Draft = { weight?: string; reps?: string };

const num = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(Number(v.toFixed(2))));

function SetRow({
  index,
  set,
  suggestion,
  draft,
  timed,
  bodyweight,
  isNext,
  onDraft,
  onToggle,
  error,
}: {
  index: number;
  set: SetEntry;
  suggestion: Suggestion;
  draft: Draft;
  timed: boolean;
  bodyweight: boolean;
  isNext: boolean;
  onDraft: (d: Draft) => void;
  onToggle: () => void;
  error: boolean;
}) {
  const weightValue = set.done ? num(set.weight) : (draft.weight ?? num(suggestion.weight));
  const repsValue = set.done ? num(set.reps) : (draft.reps ?? num(suggestion.reps));
  return (
    <View style={[styles.setRow, isNext && styles.setRowNext]}>
      <Pressable
        onPress={onToggle}
        style={[styles.check, set.done && styles.checkDone, isNext && styles.checkNext]}
        accessibilityRole="button"
        accessibilityLabel={set.done ? `Undo set ${index + 1}` : `Log set ${index + 1}`}
        hitSlop={6}
      >
        {set.done ? <Ionicons name="checkmark" size={20} color={colors.accentText} /> : <Text style={[styles.checkNum, isNext && { color: colors.accent }]}>{index + 1}</Text>}
      </Pressable>
      <View style={styles.targetCell}>
        <Text style={[styles.target, set.done && { color: colors.muted }]}>{formatReps(set, timed)}</Text>
        {set.done && set.effort ? <Text style={styles.effort}>{EFFORT_LABEL[set.effort]}</Text> : null}
      </View>
      <TextInput
        value={weightValue}
        onChangeText={(t) => onDraft({ ...draft, weight: t.replace(',', '.') })}
        editable={!set.done}
        keyboardType="decimal-pad"
        placeholder={bodyweight ? 'BW' : '—'}
        placeholderTextColor={colors.faint}
        selectTextOnFocus
        style={[styles.input, isNext && styles.inputNext, set.done && styles.inputDone, error && styles.inputError]}
        accessibilityLabel={`Set ${index + 1} weight`}
      />
      <TextInput
        value={repsValue}
        onChangeText={(t) => onDraft({ ...draft, reps: t.replace(/[^0-9]/g, '') })}
        editable={!set.done}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.faint}
        selectTextOnFocus
        style={[styles.input, isNext && styles.inputNext, set.done && styles.inputDone]}
        accessibilityLabel={`Set ${index + 1} ${timed ? 'seconds' : 'reps'}`}
      />
    </View>
  );
}

function ExerciseCardInner({
  profile,
  session,
  index,
  onLogged,
  onMenu,
}: {
  profile: Profile;
  session: Session;
  index: number;
  onLogged: (se: SessionExercise, set: SetEntry, label: string) => void;
  onMenu: (se: SessionExercise) => void;
}) {
  const sessions = useStore((s) => s.sessions);
  const logSet = useStore((s) => s.logSet);
  const undoSet = useStore((s) => s.undoSet);
  const se = session.exercises[index];
  const exercise = getExercise(se.exerciseId);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showCue, setShowCue] = useState(false);

  const history = useMemo(() => exerciseHistory(sessions, se.exerciseId, session.id), [sessions, se.exerciseId, session.id]);
  const suggestions = useMemo(() => suggestionsForExercise(profile, sessions, session, index, history), [profile, sessions, session, index, history]);

  const nextIndex = se.sets.findIndex((s) => !s.done);
  const next = nextIndex >= 0 ? suggestions[nextIndex] : undefined;
  const last = history[history.length - 1];
  const bodyweight = exercise.load === 'bodyweight';
  const doneCount = se.sets.filter((s) => s.done).length;
  const allDone = se.sets.length > 0 && doneCount === se.sets.length;

  const toggle = (set: SetEntry, i: number) => {
    if (set.done) return undoSet(session.id, se.id, set.id);
    const draft = drafts[set.id] ?? {};
    const suggestion = suggestions[i];
    const weightText = draft.weight ?? num(suggestion.weight);
    const repsText = draft.reps ?? num(suggestion.reps);
    const weight = weightText === '' ? (bodyweight ? 0 : NaN) : Number(weightText);
    const reps = Number(repsText);
    const badWeight = !Number.isFinite(weight) || weight < 0;
    if (badWeight || !Number.isFinite(reps) || reps <= 0) {
      setErrors((e) => ({ ...e, [set.id]: badWeight }));
      return;
    }
    setErrors((e) => ({ ...e, [set.id]: false }));
    logSet(session.id, se.id, set.id, { weight, reps });
    setDrafts((d) => {
      const { [set.id]: _, ...rest } = d;
      return rest;
    });
    onLogged(se, set, `Set ${i + 1}`);
  };

  return (
    <View style={[styles.card, allDone && styles.cardDone]}>
      <View style={styles.header}>
        <ExerciseIcon exercise={exercise} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>
            <Text style={{ color: colors.accent }}>{se.sets.length}x </Text>
            {exercise.name}
          </Text>
          <Text style={text.small}>
            {formatReps(se.sets[0] ?? { repMin: 0, repMax: 0 }, exercise.timed)} {exercise.timed ? 'sec' : 'reps'} · {MUSCLE_LABELS[exercise.primary]}
          </Text>
          <View style={styles.tags}>
            {se.role === 'main' ? <Badge label="Main lift" tone="accent" /> : se.role === 'core' ? <Badge label="Core" /> : null}
            <Text style={[styles.counter, allDone && { color: colors.accent }]}>
              {doneCount} of {se.sets.length}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => openVideo(exercise)} hitSlop={8} accessibilityLabel={`Watch how to do ${exercise.name}`} style={styles.iconBtn}>
          <Ionicons name="play" size={16} color={colors.accent} />
        </Pressable>
        {exercise.cue ? (
          <Pressable onPress={() => setShowCue(!showCue)} hitSlop={8} accessibilityLabel="Form tip" style={styles.iconBtn}>
            <Ionicons name="information" size={18} color={colors.text} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => onMenu(se)} hitSlop={8} accessibilityLabel={`${exercise.name} options`} style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
        </Pressable>
      </View>
      {showCue && exercise.cue ? <Text style={[text.small, styles.cue]}>{exercise.cue}</Text> : null}
      {last ? (
        <Text style={styles.last} numberOfLines={1}>
          LAST TIME <Text style={{ color: colors.text }}>{last.sets.map((s) => (s.weight ? `${num(s.weight)}×${s.reps}` : `${s.reps}${exercise.timed ? 's' : ''}`)).join('  ')}</Text>
        </Text>
      ) : null}

      {next ? (
        <View style={styles.suggestion}>
          <Ionicons name={KIND_STYLE[next.kind].icon} size={16} color={KIND_STYLE[next.kind].color} />
          <Text style={styles.suggestionText}>{next.reason}</Text>
        </View>
      ) : null}

      <View style={styles.tableHead}>
        <Text style={[styles.headText, { width: 36 }]}>LOG</Text>
        <Text style={[styles.headText, styles.targetCell]}>TARGET</Text>
        <Text style={[styles.headText, styles.inputHead]}>{bodyweight ? `+${profile.units.toUpperCase()}` : profile.units.toUpperCase()}</Text>
        <Text style={[styles.headText, styles.inputHead]}>{exercise.timed ? 'SEC' : 'REPS'}</Text>
      </View>
      {se.sets.map((set, i) => (
        <SetRow
          key={set.id}
          index={i}
          set={set}
          suggestion={suggestions[i]}
          draft={drafts[set.id] ?? {}}
          timed={!!exercise.timed}
          bodyweight={bodyweight}
          isNext={i === nextIndex}
          error={!!errors[set.id]}
          onDraft={(d) => setDrafts((all) => ({ ...all, [set.id]: d }))}
          onToggle={() => toggle(set, i)}
        />
      ))}
      {Object.values(errors).some(Boolean) ? <Text style={[text.small, { color: colors.danger }]}>Enter the weight you used.</Text> : null}
    </View>
  );
}

export const ExerciseCard = memo(ExerciseCardInner);

const styles = StyleSheet.create({
  card: { gap: space.sm, padding: space.md, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'transparent' },
  cardDone: { borderColor: 'rgba(229,255,0,0.35)' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  tags: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
  counter: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  cue: { color: colors.text, backgroundColor: colors.cardAlt, padding: space.sm, borderRadius: radius.sm },
  last: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  suggestion: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    padding: space.sm,
    paddingLeft: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  suggestionText: { color: colors.text, fontSize: 13, lineHeight: 18, flex: 1 },
  tableHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: 6, marginTop: space.xs },
  headText: { color: colors.faint, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  inputHead: { flex: 1, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6, paddingHorizontal: 6, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  setRowNext: { backgroundColor: 'rgba(229,255,0,0.07)', borderLeftColor: colors.accent },
  check: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkNext: { borderColor: colors.accent },
  checkDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkNum: { color: colors.muted, fontFamily: fonts.display, fontSize: 14 },
  targetCell: { width: 60 },
  target: { color: colors.text, fontWeight: '800', fontSize: 15, fontVariant: ['tabular-nums'] },
  effort: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  input: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
    color: colors.text,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  inputNext: { borderColor: colors.accent },
  inputDone: { backgroundColor: 'transparent', color: colors.accent },
  inputError: { borderColor: colors.danger },
});
