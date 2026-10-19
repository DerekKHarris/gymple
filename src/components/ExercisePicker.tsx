import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EQUIPMENT_LABELS, EXERCISES, MUSCLE_LABELS, PATTERN_LABELS, canPerform } from '@/data/exercises';
import type { Equipment, Exercise, Muscle, Pattern } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { Badge, Button, Chip, text } from './ui';

const MUSCLES = Object.keys(MUSCLE_LABELS) as Muscle[];

export function ExercisePicker({
  visible,
  title,
  equipment,
  pattern,
  excludeId,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  equipment: Equipment[];
  /** When swapping, exercises with this movement pattern are listed first. */
  pattern?: Pattern;
  excludeId?: string;
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [mineOnly, setMineOnly] = useState(true);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = EXERCISES.filter(
      (e) =>
        e.id !== excludeId &&
        (!mineOnly || canPerform(e, equipment)) &&
        (!muscle || e.primary === muscle) &&
        (!q || e.name.toLowerCase().includes(q) || PATTERN_LABELS[e.pattern].toLowerCase().includes(q)),
    );
    if (!pattern) return filtered;
    return [...filtered.filter((e) => e.pattern === pattern), ...filtered.filter((e) => e.pattern !== pattern)];
  }, [query, muscle, mineOnly, equipment, pattern, excludeId]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={text.h2}>{title}</Text>
          <Button title="Close" variant="ghost" onPress={onClose} style={styles.close} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={colors.faint}
          style={styles.search}
          autoCorrect={false}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filterRow}>
          <Chip label="All" selected={!muscle} onPress={() => setMuscle(null)} />
          {MUSCLES.map((m) => (
            <Chip key={m} label={MUSCLE_LABELS[m]} selected={muscle === m} onPress={() => setMuscle(muscle === m ? null : m)} />
          ))}
        </ScrollView>
        <Pressable onPress={() => setMineOnly(!mineOnly)} style={styles.toggle}>
          <View style={[styles.checkbox, mineOnly && styles.checkboxOn]}>{mineOnly ? <Text style={styles.check}>✓</Text> : null}</View>
          <Text style={text.muted}>Only show exercises for my equipment</Text>
        </Pressable>
        <FlatList
          data={list}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: space.xl }}
          ListEmptyComponent={<Text style={[text.muted, { padding: space.lg }]}>No exercises match.</Text>}
          renderItem={({ item }) => {
            const similar = pattern && item.pattern === pattern;
            const needs = item.equipment.length ? item.equipment.map((q) => EQUIPMENT_LABELS[q]).join(', ') : 'No equipment';
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => onPick(item)}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.cardAlt }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={text.h3}>{item.name}</Text>
                  <Text style={text.small}>
                    {MUSCLE_LABELS[item.primary]} · {PATTERN_LABELS[item.pattern]} · {needs}
                  </Text>
                </View>
                {similar ? <Badge label="Similar" tone="accent" /> : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.md },
  close: { minHeight: 40, paddingHorizontal: 0 },
  search: {
    marginHorizontal: space.lg,
    marginTop: space.sm,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  // flexShrink: 0 stops the list below from squashing this row (it clipped the chips on iOS).
  filters: { flexGrow: 0, flexShrink: 0, marginTop: space.md },
  filterRow: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: 2, alignItems: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: colors.accentText, fontWeight: '900', fontSize: 13 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
