import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Badge, Button, Display, SectionTitle, SegmentBar, text } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { GOAL_TITLES } from '@/data/goals';
import { TOTAL_WEEKS, weekInfo } from '@/lib/periodization';
import { currentWeek, schemeForExercise, sessionId, sessionStatus } from '@/lib/program';
import type { Program, Session } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, space } from '@/theme';

interface DayView {
  index: number;
  name: string;
  focus: string;
  status: ReturnType<typeof sessionStatus>;
  exerciseIds: string[];
  sets: number;
}

function dayViews(program: Program, sessions: Record<string, Session>, week: number): DayView[] {
  return program.days.map((day, d) => {
    const session = sessions[sessionId(program.id, week, d)];
    const exerciseIds = session ? session.exercises.map((e) => e.exerciseId) : day.exercises.map((e) => e.exerciseId);
    const sets = session
      ? session.exercises.reduce((n, e) => n + e.sets.length, 0)
      : day.exercises.reduce((n, e) => n + schemeForExercise(program.goal, week, e.role, getExercise(e.exerciseId)).sets, 0);
    return { index: d, name: session?.name ?? day.name, focus: session?.focus ?? day.focus, status: sessionStatus(session), exerciseIds, sets };
  });
}

function IconButton({ name, label, onPress }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}>
      <Ionicons name={name} size={20} color={colors.text} />
    </Pressable>
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
  const days = dayViews(program, sessions, week);
  const doneThisWeek = days.filter((d) => d.status === 'done').length;
  const next = days.find((d) => d.status !== 'done');
  const totalDone = Object.values(sessions).filter((s) => s.programId === program.id && s.completedAt).length;
  const weeksFilled = totalDone / program.days.length;
  const open = (d: number) => router.push({ pathname: '/workout/[week]/[day]', params: { week: String(week), day: String(d) } });
  const minutes = (sets: number) => Math.round((sets * (profile.restSeconds + 45)) / 60 / 5) * 5;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>GYMPLE</Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <IconButton name="stats-chart" label="Progress" onPress={() => router.push('/progress')} />
            <IconButton name="settings-sharp" label="Settings" onPress={() => router.push('/settings')} />
          </View>
        </View>

        <View style={styles.weekRow}>
          <View style={styles.weekRing}>
            <Text style={styles.weekRingLabel}>WK</Text>
            <Text style={styles.weekRingNum}>{week}</Text>
          </View>
          <View style={styles.dayDots}>
            {days.map((d) => {
              const isNext = next?.index === d.index;
              return (
                <Pressable key={d.index} onPress={() => open(d.index)} accessibilityLabel={`Open ${d.name}`} style={styles.dayDotWrap}>
                  <Text style={[styles.dayDotLabel, isNext && { color: colors.accent }]}>D{d.index + 1}</Text>
                  <View style={[styles.dayDot, d.status === 'done' && styles.dayDotDone, isNext && styles.dayDotNext]}>
                    {d.status === 'done' ? <Ionicons name="checkmark" size={16} color={colors.accentText} /> : null}
                    {d.status === 'in_progress' ? <View style={styles.dayDotPartial} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.weekSwitch}>
          <Pressable onPress={() => setWeek(Math.max(1, week - 1))} disabled={week === 1} accessibilityLabel="Previous week" hitSlop={10} style={week === 1 && { opacity: 0.25 }}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Display size={22}>
              Week {week} <Text style={{ color: colors.faint }}>/ {TOTAL_WEEKS}</Text>
            </Display>
            <Badge label={info.phase} tone={info.isDeload ? 'info' : info.isTest ? 'warning' : 'success'} />
          </View>
          <Pressable onPress={() => setWeek(Math.min(TOTAL_WEEKS, week + 1))} disabled={week === TOTAL_WEEKS} accessibilityLabel="Next week" hitSlop={10} style={week === TOTAL_WEEKS && { opacity: 0.25 }}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>
        <SegmentBar total={TOTAL_WEEKS} filled={weeksFilled} height={6} />
        <View style={styles.progressRow}>
          <Text style={text.small}>
            {GOAL_TITLES[program.goal]} · {program.name}
          </Text>
          <Text style={[text.small, { color: colors.accent, fontWeight: '800' }]}>
            {totalDone}/{program.days.length * TOTAL_WEEKS} WORKOUTS
          </Text>
        </View>
        {week !== activeWeek ? <Button title={`Go to current week (${activeWeek})`} variant="secondary" size="sm" onPress={() => setWeek(activeWeek)} /> : null}

        {next ? (
          <Pressable onPress={() => open(next.index)} accessibilityLabel={`${next.name} workout`}>
            <LinearGradient colors={['#2E3209', '#121212', '#0A0A0A']} locations={[0, 0.55, 1]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
              <View style={styles.heroTab}>
                <Text style={styles.heroTabText}>
                  DAY {next.index + 1} · {next.status === 'in_progress' ? 'IN PROGRESS' : 'UP NEXT'}
                </Text>
              </View>
              <View style={styles.heroIcons}>
                {next.exerciseIds.slice(0, 4).map((id, i) => (
                  <ExerciseIcon key={`${id}${i}`} exercise={getExercise(id)} size={46} />
                ))}
              </View>
              <Display size={34}>{next.name}</Display>
              <Text style={styles.heroMeta}>
                {next.focus} · ~{minutes(next.sets)} min
              </Text>
              <Text style={text.small}>{info.summary}</Text>
              <Button title={next.status === 'in_progress' ? 'Continue workout' : 'Start workout'} onPress={() => open(next.index)} style={{ marginTop: space.md }} />
            </LinearGradient>
          </Pressable>
        ) : (
          <LinearGradient colors={['#2E3209', '#0A0A0A']} style={styles.hero}>
            <Ionicons name="trophy" size={34} color={colors.accent} />
            <Display size={30}>Week {week} complete</Display>
            <Text style={text.muted}>Every workout this week is done. Nice work.</Text>
            {week < TOTAL_WEEKS ? <Button title={`Go to week ${week + 1}`} onPress={() => setWeek(week + 1)} style={{ marginTop: space.md }} /> : null}
          </LinearGradient>
        )}

        <SectionTitle right={`${doneThisWeek} of ${days.length} done`}>This week</SectionTitle>
        {days.map((d) => (
          <Pressable key={d.index} onPress={() => open(d.index)} style={({ pressed }) => [styles.dayRowItem, pressed && { opacity: 0.7 }]} accessibilityLabel={`${d.name}: ${d.focus}`}>
            <View style={[styles.dayBadge, d.status === 'done' && styles.dayBadgeDone]}>
              {d.status === 'done' ? <Ionicons name="checkmark" size={18} color={colors.accentText} /> : <Text style={styles.dayBadgeText}>{d.index + 1}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayName}>{d.name}</Text>
              <Text style={text.small} numberOfLines={1}>
                {d.focus} · {d.exerciseIds.length} exercises · ~{minutes(d.sets)} min
              </Text>
            </View>
            {d.status === 'in_progress' ? <Badge label="Started" tone="warning" /> : <Ionicons name="chevron-forward" size={18} color={colors.faint} />}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl * 2, gap: space.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm },
  brand: { color: colors.accent, fontFamily: fonts.display, fontSize: 20, letterSpacing: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.sm },
  weekRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  weekRingLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', marginBottom: -4 },
  weekRingNum: { color: colors.text, fontFamily: fonts.display, fontSize: 24 },
  dayDots: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  dayDotWrap: { alignItems: 'center', gap: 6 },
  dayDotLabel: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  dayDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dayDotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayDotNext: { borderColor: colors.accent },
  dayDotPartial: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  weekSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hero: { borderRadius: radius.lg, padding: space.xl, paddingTop: space.xl + space.lg, gap: space.sm, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.accent },
  heroTab: { position: 'absolute', top: 0, left: 0, backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 6, borderBottomRightRadius: radius.md },
  heroTabText: { color: colors.accentText, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  heroIcons: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  heroMeta: { color: colors.text, fontSize: 14, fontWeight: '700' },
  dayRowItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  dayBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  dayBadgeDone: { backgroundColor: colors.accent },
  dayBadgeText: { color: colors.text, fontFamily: fonts.display, fontSize: 16 },
  dayName: { color: colors.text, fontSize: 16, fontWeight: '800' },
});
