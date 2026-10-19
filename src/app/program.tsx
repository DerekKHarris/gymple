import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, SectionTitle, text } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { GOAL_TITLES } from '@/data/goals';
import { TOTAL_WEEKS, formatReps, weekInfo } from '@/lib/periodization';
import { currentWeek, schemeForExercise, sessionId, sessionStatus } from '@/lib/program';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';

const WEEKS = Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);

function HeaderButtons() {
  const router = useRouter();
  return (
    <View style={styles.headerButtons}>
      <Pressable onPress={() => router.push('/progress')} accessibilityLabel="Progress" hitSlop={8}>
        <Ionicons name="stats-chart" size={22} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => router.push('/settings')} accessibilityLabel="Settings" hitSlop={8}>
        <Ionicons name="settings-outline" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

export default function ProgramScreen() {
  const router = useRouter();
  const program = useStore((s) => s.program);
  const sessions = useStore((s) => s.sessions);
  const profile = useStore((s) => s.profile);

  const activeWeek = useMemo(() => (program ? currentWeek(program, sessions) : 1), [program, sessions]);
  const [pickedWeek, setWeek] = useState<number | null>(null);
  const week = pickedWeek ?? activeWeek;

  if (!program || !profile) return null;

  const info = weekInfo(program.goal, week);
  const dayCount = program.days.length;
  const doneCount = Object.values(sessions).filter((s) => s.programId === program.id && s.completedAt).length;
  const total = dayCount * TOTAL_WEEKS;

  const weekDone = (w: number) => program.days.every((_, d) => sessions[sessionId(program.id, w, d)]?.completedAt);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={{ title: program.name, headerRight: () => <HeaderButtons />, headerBackVisible: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Text style={text.small}>{GOAL_TITLES[program.goal]} · 12-week plan</Text>
            <Text style={text.h2}>
              {doneCount} of {total} workouts done
            </Text>
          </View>
          <Text style={styles.percent}>{Math.round((doneCount / total) * 100)}%</Text>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${(doneCount / total) * 100}%` }]} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weeks}>
          {WEEKS.map((w) => {
            const wi = weekInfo(program.goal, w);
            const selected = w === week;
            return (
              <Pressable
                key={w}
                onPress={() => setWeek(w)}
                style={[styles.week, selected && styles.weekSelected, w === activeWeek && !selected && styles.weekCurrent]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`Week ${w}`}
              >
                <Text style={[styles.weekLabel, selected && { color: colors.accentText }]}>WK</Text>
                <Text style={[styles.weekNum, selected && { color: colors.accentText }]}>{w}</Text>
                <Text style={[styles.weekTag, selected && { color: colors.accentText }]}>
                  {weekDone(w) ? '✓' : wi.isDeload ? 'DL' : wi.isTest ? 'TEST' : ' '}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Card style={styles.weekCard}>
          <View style={styles.row}>
            <Text style={text.h2}>Week {week}</Text>
            <Badge label={info.phase} tone={info.isDeload ? 'info' : info.isTest ? 'warning' : 'accent'} />
          </View>
          <Text style={text.muted}>{info.summary}</Text>
        </Card>

        <SectionTitle>Workouts</SectionTitle>
        {program.days.map((day, d) => {
          const session = sessions[sessionId(program.id, week, d)];
          const status = sessionStatus(session);
          const items = session
            ? session.exercises.map((e) => ({ id: e.id, exerciseId: e.exerciseId, sets: e.sets.length, repMin: e.sets[0]?.repMin ?? 0, repMax: e.sets[0]?.repMax ?? 0 }))
            : day.exercises.map((e) => {
                const scheme = schemeForExercise(program.goal, week, e.role, getExercise(e.exerciseId));
                return { id: e.slotId, exerciseId: e.exerciseId, sets: scheme.sets, repMin: scheme.repMin, repMax: scheme.repMax };
              });
          return (
            <Card
              key={d}
              onPress={() => router.push({ pathname: '/workout/[week]/[day]', params: { week: String(week), day: String(d) } })}
              style={[styles.day, status === 'done' && styles.dayDone]}
            >
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={text.small}>Day {d + 1}</Text>
                  <Text style={text.h3}>{session?.name ?? day.name}</Text>
                  <Text style={text.small}>{session?.focus ?? day.focus}</Text>
                </View>
                {status === 'done' ? (
                  <Badge label="Done" tone="success" />
                ) : status === 'in_progress' ? (
                  <Badge label="In progress" tone="warning" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                )}
              </View>
              <View style={styles.exList}>
                {items.map((it) => {
                  const ex = getExercise(it.exerciseId);
                  return (
                    <View key={it.id} style={styles.exItem}>
                      <Text style={[text.body, { flex: 1, fontSize: 14 }]} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <Text style={[text.small, { fontVariant: ['tabular-nums'] }]}>
                        {it.sets} × {formatReps(it, ex.timed)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  headerButtons: { flexDirection: 'row', gap: space.lg, paddingHorizontal: space.sm },
  summary: { flexDirection: 'row', alignItems: 'flex-end' },
  percent: { color: colors.accent, fontSize: 28, fontWeight: '800' },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.accent },
  weeks: { gap: space.sm, paddingVertical: space.xs },
  week: {
    width: 54,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  weekSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  weekCurrent: { borderColor: colors.accent },
  weekLabel: { color: colors.faint, fontSize: 10, fontWeight: '800' },
  weekNum: { color: colors.text, fontSize: 20, fontWeight: '800' },
  weekTag: { color: colors.info, fontSize: 10, fontWeight: '800', height: 14 },
  weekCard: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  day: { gap: space.md },
  dayDone: { borderColor: colors.success },
  exList: { gap: 6 },
  exItem: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
