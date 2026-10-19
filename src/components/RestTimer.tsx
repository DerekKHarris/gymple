import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Effort } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { Chip, text } from './ui';

export const EFFORTS: { value: Effort; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'good', label: 'Good' },
  { value: 'hard', label: 'Hard' },
  { value: 'fail', label: 'Failed' },
];

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Rest countdown shown after a set is logged. Based on an end timestamp, so it stays
 * correct if the app is backgrounded. Also asks how the set felt, which feeds the
 * weight suggestions.
 */
export function RestTimer({
  endsAt,
  duration,
  setLabel,
  effort,
  onRate,
  onAdjust,
  onClose,
}: {
  endsAt: number;
  duration: number;
  setLabel: string;
  effort?: Effort;
  onRate: (effort: Effort | undefined) => void;
  onAdjust: (seconds: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => Date.now());
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

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.md) }]} testID="rest-timer">
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }, finished && styles.fillDone]} />
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={text.small}>{finished ? 'Rest over' : `Rest · ${setLabel} logged`}</Text>
          <Text style={[styles.time, finished && { color: colors.accent }]}>{finished ? 'Next set!' : format(remaining)}</Text>
        </View>
        <Pressable style={styles.adjust} onPress={() => onAdjust(-15)} accessibilityLabel="Remove 15 seconds">
          <Text style={styles.adjustText}>−15</Text>
        </Pressable>
        <Pressable style={styles.adjust} onPress={() => onAdjust(30)} accessibilityLabel="Add 30 seconds">
          <Text style={styles.adjustText}>+30</Text>
        </Pressable>
        <Pressable style={[styles.adjust, styles.skip]} onPress={onClose} accessibilityLabel={finished ? 'Dismiss' : 'Skip rest'}>
          <Text style={[styles.adjustText, { color: colors.accentText }]}>{finished ? 'Done' : 'Skip'}</Text>
        </Pressable>
      </View>
      <Text style={[text.small, { marginTop: space.sm }]}>How did that set feel?</Text>
      <View style={styles.efforts}>
        {EFFORTS.map((e) => (
          <Chip key={e.value} label={e.label} selected={effort === e.value} onPress={() => onRate(effort === e.value ? undefined : e.value)} style={styles.effortChip} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cardAlt,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginBottom: space.md },
  fill: { height: 4, backgroundColor: colors.info },
  fillDone: { backgroundColor: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  time: { color: colors.text, fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] },
  adjust: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  skip: { backgroundColor: colors.accent, borderColor: colors.accent },
  adjustText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  efforts: { flexDirection: 'row', gap: space.sm, marginTop: space.xs, flexWrap: 'wrap' },
  effortChip: { paddingVertical: 7 },
});
