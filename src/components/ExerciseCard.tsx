import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MUSCLE_LABELS, getExercise } from '@/data/exercises';
import { formatReps } from '@/lib/periodization';
import { exerciseHistory } from '@/lib/program';
import type { Suggestion, SuggestionKind } from '@/lib/progression';
import { suggestionsForExercise } from '@/lib/suggest';
import type { Profile, Session, SessionExercise, SetEntry } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';
import { Badge, Card, text } from './ui';

const KIND_STYLE: Record<SuggestionKind, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  first: { icon: 'flag-outline', color: colors.info, bg: colors.infoBg },
  increase: { icon: 'trending-up', color: colors.success, bg: colors.successBg },
  hold: { icon: 'remove-outline', color: colors.muted, bg: colors.cardAlt },
  decrease: { icon: 'trending-down', color: colors.warning, bg: colors.warningBg },
  reset: { icon: 'refresh', color: colors.warning, bg: colors.warningBg },
  deload: { icon: 'leaf-outline', color: colors.info, bg: colors.infoBg },
  recalc: { icon: 'calculator-outline', color: colors.info, bg: colors.infoBg },
  bodyweight: { icon: 'body-outline', color: colors.muted, bg: colors.cardAlt },
};

const EFFORT_LABEL = { easy: 'Easy', good: 'Good', hard: 'Hard', fail: 'Failed' } as const;

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
    <View style={[styles.setRow, set.done && styles.setRowDone, isNext && styles.setRowNext]}>
      <Text style={[styles.cell, styles.setNum]}>{index + 1}</Text>
      <View style={styles.targetCell}>
        <Text style={styles.target}>{formatReps(set, timed)}</Text>
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
        style={[styles.input, set.done && styles.inputDone, error && styles.inputError]}
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
        style={[styles.input, set.done && styles.inputDone]}
        accessibilityLabel={`Set ${index + 1} ${timed ? 'seconds' : 'reps'}`}
      />
      <Pressable
        onPress={onToggle}
        style={[styles.check, set.done && styles.checkDone]}
        accessibilityRole="button"
        accessibilityLabel={set.done ? `Undo set ${index + 1}` : `Log set ${index + 1}`}
        hitSlop={6}
      >
        <Ionicons name="checkmark" size={20} color={set.done ? colors.accentText : colors.muted} />
      </Pressable>
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
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.titleRow}>
            <Text style={[text.h3, { flexShrink: 1 }]}>{exercise.name}</Text>
            {se.role === 'main' ? <Badge label="Main lift" tone="accent" /> : se.role === 'core' ? <Badge label="Core" tone="info" /> : null}
          </View>
          <Text style={text.small}>
            {se.sets.length} × {formatReps(se.sets[0] ?? { repMin: 0, repMax: 0 }, exercise.timed)} · {MUSCLE_LABELS[exercise.primary]} · {doneCount}/{se.sets.length} done
          </Text>
          {last ? (
            <Text style={text.small} numberOfLines={1}>
              Last time: {last.sets.map((s) => (s.weight ? `${num(s.weight)}×${s.reps}` : `${s.reps}${exercise.timed ? 's' : ''}`)).join(', ')}
            </Text>
          ) : null}
        </View>
        {exercise.cue ? (
          <Pressable onPress={() => setShowCue(!showCue)} hitSlop={8} accessibilityLabel="Form tip" style={styles.iconBtn}>
            <Ionicons name="information-circle-outline" size={22} color={colors.muted} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => onMenu(se)} hitSlop={8} accessibilityLabel={`${exercise.name} options`} style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      </View>
      {showCue && exercise.cue ? <Text style={[text.small, styles.cue]}>{exercise.cue}</Text> : null}

      {next ? (
        <View style={[styles.suggestion, { backgroundColor: KIND_STYLE[next.kind].bg }]}>
          <Ionicons name={KIND_STYLE[next.kind].icon} size={16} color={KIND_STYLE[next.kind].color} />
          <Text style={[text.small, { color: colors.text, flex: 1 }]}>{next.reason}</Text>
        </View>
      ) : (
        <View style={[styles.suggestion, { backgroundColor: colors.successBg }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[text.small, { color: colors.text, flex: 1 }]}>All sets done.</Text>
        </View>
      )}

      <View style={styles.tableHead}>
        <Text style={[styles.headText, styles.setNum]}>SET</Text>
        <Text style={[styles.headText, styles.targetCell]}>TARGET</Text>
        <Text style={[styles.headText, styles.inputHead]}>{bodyweight ? `+${profile.units.toUpperCase()}` : profile.units.toUpperCase()}</Text>
        <Text style={[styles.headText, styles.inputHead]}>{exercise.timed ? 'SEC' : 'REPS'}</Text>
        <View style={{ width: 40 }} />
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
    </Card>
  );
}

export const ExerciseCard = memo(ExerciseCardInner);

const styles = StyleSheet.create({
  card: { gap: space.sm, padding: space.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  iconBtn: { padding: 4 },
  cue: { color: colors.text, backgroundColor: colors.cardAlt, padding: space.sm, borderRadius: radius.sm },
  suggestion: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', padding: space.sm, borderRadius: radius.sm },
  tableHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: 6, marginTop: space.xs },
  headText: { color: colors.faint, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  inputHead: { flex: 1, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6, paddingHorizontal: 6, borderRadius: radius.sm },
  setRowDone: { backgroundColor: colors.successBg },
  setRowNext: { backgroundColor: colors.cardAlt },
  cell: { color: colors.text },
  setNum: { width: 28, textAlign: 'center', fontWeight: '800', color: colors.muted },
  targetCell: { width: 64 },
  target: { color: colors.text, fontWeight: '600', fontVariant: ['tabular-nums'] },
  effort: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  input: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  inputDone: { backgroundColor: 'transparent', borderColor: 'transparent', color: colors.success },
  inputError: { borderColor: colors.danger },
  check: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
});
