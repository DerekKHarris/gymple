import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseIcon } from '@/components/ExerciseIcon';
import { PlanLettering } from '@/components/PlanLettering';
import { ChoiceSheet } from '@/components/Sheet';
import { Button, Display, SectionTitle, SegmentBar, Stat, text } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { LEVEL_TITLES } from '@/data/goals';
import { getPlan } from '@/data/plans';
import { formatReps, schemeFor, weekInfo } from '@/lib/periodization';
import { resolvePlanDays, schemeForExercise, sessionStatus } from '@/lib/program';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';

export default function PlanDetail() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();
  const plan = getPlan(planId);
  const profile = useStore((s) => s.profile);
  const program = useStore((s) => s.program);
  const sessions = useStore((s) => s.sessions);
  const startPlan = useStore((s) => s.startPlan);
  const [confirm, setConfirm] = useState(false);

  const days = useMemo(() => (plan && profile ? resolvePlanDays(plan, profile.equipment) : []), [plan, profile]);
  if (!plan || !profile) return null;

  const hasProgress = !!program && Object.values(sessions).some((s) => s.programId === program.id && sessionStatus(s) !== 'not_started');
  const start = () => {
    startPlan(plan.id);
    if (router.canDismiss()) router.dismissAll();
    router.replace('/program');
  };

  const blocks = [1, 5, 9].map((w) => ({ info: weekInfo(profile.goal, w), main: schemeFor(profile.goal, w, 'main'), acc: schemeFor(profile.goal, w, 'accessory') }));
  const level = plan.levels.includes(profile.experience) ? LEVEL_TITLES[profile.experience] : LEVEL_TITLES[plan.levels[0]];

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={['#2B2E0A', '#101010']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.hero}>
          <PlanLettering plan={plan} size={40} />
          <Text style={[text.h2, { marginTop: space.md }]}>{plan.name}</Text>
          <Text style={text.muted}>{plan.tagline}</Text>
        </LinearGradient>

        <View style={styles.stats}>
          <Stat value="12" label="Weeks" accent />
          <View style={styles.divider} />
          <Stat value={String(plan.daysPerWeek)} label="Days / week" accent />
          <View style={styles.divider} />
          <Stat value={level} label="Level" accent size={level.length > 8 ? 15 : 22} />
        </View>

        <Text style={text.body}>{plan.description}</Text>
        <Text style={[text.small, { color: colors.muted }]}>Schedule: {plan.schedule}</Text>

        <SectionTitle>Why it works</SectionTitle>
        <Text style={text.muted}>{plan.basis}</Text>

        <SectionTitle right="12 wks">Your 12 weeks</SectionTitle>
        {blocks.map(({ info, main, acc }, i) => (
          <View key={info.block} style={styles.block}>
            <View style={styles.blockHead}>
              <Display size={18}>{info.phase}</Display>
              <Text style={styles.blockWeeks}>
                WK {i * 4 + 1}–{i * 4 + 4}
              </Text>
            </View>
            <SegmentBar total={4} filled={3} />
            <Text style={text.small}>{info.summary}</Text>
            <Text style={[text.small, { color: colors.text }]}>
              Main lifts <Text style={text.accent}>{main.sets}×{formatReps(main)}</Text> · Accessories{' '}
              <Text style={text.accent}>
                {acc.sets}×{formatReps(acc)}
              </Text>{' '}
              · Week {i * 4 + 4} is a {weekInfo(profile.goal, i * 4 + 4).phase.toLowerCase()} week
            </Text>
          </View>
        ))}

        <Text style={[text.small, { marginTop: space.lg }]}>WEEK 1 WITH YOUR EQUIPMENT</Text>
        {days.map((day, i) => (
          <View key={i}>
            <SectionTitle right={`${day.exercises.length} exercises`}>{day.name}</SectionTitle>
            {day.exercises.map((ex) => {
              const exercise = getExercise(ex.exerciseId);
              const scheme = schemeForExercise(profile.goal, 1, ex.role, exercise);
              return (
                <View key={ex.slotId} style={styles.exRow}>
                  <ExerciseIcon exercise={exercise} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName} numberOfLines={1}>
                      <Text style={{ color: colors.accent }}>{scheme.sets}x </Text>
                      {exercise.name}
                    </Text>
                    <Text style={text.small}>
                      {formatReps(scheme, exercise.timed)} {exercise.timed ? 'sec' : 'reps'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Button title={program?.planId === plan.id ? 'Restart this plan' : 'Start this plan'} onPress={() => (hasProgress ? setConfirm(true) : start())} testID="start-plan" />
      </View>
      <ChoiceSheet
        visible={confirm}
        title="Switch plans?"
        message="Your current program will be archived. Everything you've logged is kept and still used to suggest your weights."
        choices={[{ label: `Start ${plan.name}`, variant: 'primary', onPress: start }]}
        onClose={() => setConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  hero: { borderRadius: radius.lg, padding: space.xl, gap: 2 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  block: { gap: space.sm, paddingVertical: space.sm },
  blockHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  blockWeeks: { color: colors.accent, fontWeight: '800', fontSize: 13 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  exName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  footer: { paddingHorizontal: space.lg, paddingVertical: space.md },
});
