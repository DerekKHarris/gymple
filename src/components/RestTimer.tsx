import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Effort, Exercise } from '@/lib/types';
import { colors, fonts, radius, space } from '@/theme';
import { ExerciseIcon } from './ExerciseIcon';
import { Button, Chip, Display, text } from './ui';

export const EFFORTS: { value: Effort; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'good', label: 'Good' },
  { value: 'hard', label: 'Hard' },
  { value: 'fail', label: 'Failed' },
];

export interface NextUp {
  /** e.g. "Set 2 of 5" */
  label: string;
  /** e.g. "145 lb × 5" */
  detail: string;
  exercise: Exercise;
}

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Rest countdown shown after a set is logged: full screen by default (Ladder style),
 * or minimised to a bar so the workout stays editable. Based on an end timestamp, so it
 * stays correct if the app is backgrounded. Also asks how the set felt, which feeds the
 * weight suggestions.
 */
export function RestTimer({
  endsAt,
  duration,
  setLabel,
  effort,
  next,
  onRate,
  onAdjust,
  onClose,
}: {
  endsAt: number;
  duration: number;
  setLabel: string;
  effort?: Effort;
  next?: NextUp;
  onRate: (effort: Effort | undefined) => void;
  onAdjust: (seconds: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(true);
  const buzzed = useRef(false);
  const remaining = endsAt - now;
  const finished = remaining <= 0;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!finished) buzzed.current = false;
    if (finished && !buzzed.current) {
      buzzed.current = true;
      Vibration.vibrate([0, 400, 200, 400]);
    }
  }, [finished]);

  const progress = Math.min(1, Math.max(0, 1 - remaining / (duration * 1000)));

  if (!expanded) {
    return (
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]} testID="rest-timer">
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.barRow}>
          <Pressable onPress={() => setExpanded(true)} accessibilityLabel="Expand rest timer" style={{ flex: 1 }}>
            <Text style={styles.barLabel}>{finished ? 'REST OVER' : 'REST'}</Text>
            <Text style={[styles.barTime, finished && { color: colors.accent }]}>{finished ? 'GO!' : format(remaining)}</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={() => onAdjust(30)} accessibilityLabel="Add 30 seconds">
            <Text style={styles.smallBtnText}>+30</Text>
          </Pressable>
          <Pressable style={[styles.smallBtn, styles.smallBtnPrimary]} onPress={onClose} accessibilityLabel={finished ? 'Dismiss' : 'Skip rest'}>
            <Text style={[styles.smallBtnText, { color: colors.accentText }]}>{finished ? 'DONE' : 'SKIP'}</Text>
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={() => setExpanded(true)} accessibilityLabel="Expand rest timer">
            <Ionicons name="chevron-up" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Modal visible animationType="fade" onRequestClose={() => setExpanded(false)}>
      <LinearGradient colors={['#000000', '#000000', '#2A2F05']} locations={[0, 0.55, 1]} style={styles.full} testID="rest-timer">
        <View style={[styles.fullInner, { paddingTop: insets.top + space.md, paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <View style={styles.topRow}>
            <Text style={styles.logged}>✓ {setLabel.toUpperCase()} LOGGED</Text>
            <Pressable onPress={() => setExpanded(false)} accessibilityLabel="Minimise rest timer" style={styles.round} hitSlop={8}>
              <Ionicons name="chevron-down" size={20} color={colors.text} />
            </Pressable>
          </View>

          {next ? (
            <View style={styles.nextCard}>
              <ExerciseIcon exercise={next.exercise} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>NEXT → {next.label.toUpperCase()}</Text>
                <Text style={styles.nextTitle} numberOfLines={1}>
                  <Text style={{ color: colors.accent }}>{next.detail} </Text>
                  {next.exercise.name}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.nextCard}>
              <Ionicons name="flag" size={28} color={colors.accent} />
              <Text style={[styles.nextTitle, { flex: 1 }]}>That was the last set. Finish the workout when you’re ready.</Text>
            </View>
          )}

          <View style={styles.center}>
            <Display size={30} color={finished ? colors.accent : colors.text}>
              {finished ? 'Go!' : 'Rest'}
            </Display>
            <Text style={[styles.bigTime, finished && { color: colors.accent }]}>{format(remaining)}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.adjustRow}>
              <Pressable style={styles.adjust} onPress={() => onAdjust(-15)} accessibilityLabel="Remove 15 seconds">
                <Text style={styles.adjustText}>−15s</Text>
              </Pressable>
              <Pressable style={styles.adjust} onPress={() => onAdjust(30)} accessibilityLabel="Add 30 seconds">
                <Text style={styles.adjustText}>+30s</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[text.small, styles.feelLabel]}>HOW DID THAT SET FEEL?</Text>
          <View style={styles.efforts}>
            {EFFORTS.map((e) => (
              <Chip key={e.value} label={e.label} selected={effort === e.value} onPress={() => onRate(effort === e.value ? undefined : e.value)} style={styles.effortChip} />
            ))}
          </View>
          <Text style={[text.small, { textAlign: 'center' }]}>Your rating fine-tunes the next set’s weight.</Text>

          <Button title={finished ? 'Start next set' : 'Skip rest'} onPress={onClose} style={{ marginTop: space.lg }} testID="skip-rest" />
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  fullInner: { flex: 1, paddingHorizontal: space.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logged: { color: colors.accent, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.lg, padding: space.md, marginTop: space.lg },
  nextLabel: { color: colors.accent, fontWeight: '900', fontSize: 12, letterSpacing: 0.4 },
  nextTitle: { color: colors.text, fontWeight: '800', fontSize: 17, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  bigTime: { color: colors.text, fontFamily: fonts.display, fontSize: 92, lineHeight: 100, fontVariant: ['tabular-nums'] },
  track: { width: '80%', height: 6, borderRadius: 3, backgroundColor: colors.cardAlt, overflow: 'hidden', marginTop: space.sm },
  fill: { height: 6, backgroundColor: colors.accent },
  adjustRow: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  adjust: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  adjustText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  feelLabel: { textAlign: 'center', fontWeight: '900', letterSpacing: 0.5, color: colors.text },
  efforts: { flexDirection: 'row', gap: space.sm, justifyContent: 'center', marginVertical: space.sm, flexWrap: 'wrap' },
  effortChip: { paddingVertical: 9 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cardAlt,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1.5,
    borderColor: colors.accent,
  },
  barTrack: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginBottom: space.sm },
  barFill: { height: 4, backgroundColor: colors.accent },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  barLabel: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  barTime: { color: colors.text, fontFamily: fonts.display, fontSize: 28, fontVariant: ['tabular-nums'] },
  smallBtn: { height: 40, minWidth: 40, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  smallBtnPrimary: { backgroundColor: colors.accent },
  smallBtnText: { color: colors.text, fontWeight: '900', fontSize: 13 },
});
