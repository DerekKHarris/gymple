import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceSheet } from '@/components/Sheet';
import { Badge, Button, Card, SectionTitle, text } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { getPlan } from '@/data/plans';
import { formatReps, schemeFor, weekInfo } from '@/lib/periodization';
import { resolvePlanDays, schemeForExercise, sessionStatus } from '@/lib/program';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme';

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

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={{ title: plan.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={text.h1}>{plan.name}</Text>
        <View style={styles.meta}>
          <Badge label={`${plan.daysPerWeek} days / week`} tone="info" />
          <Badge label={plan.schedule} />
        </View>
        <Text style={text.body}>{plan.description}</Text>
        <Card style={{ gap: space.xs }}>
          <Text style={text.h3}>Why it works</Text>
          <Text style={text.muted}>{plan.basis}</Text>
        </Card>

        <SectionTitle>Your 12 weeks</SectionTitle>
        {blocks.map(({ info, main, acc }, i) => (
          <View key={info.block} style={styles.block}>
            <Text style={styles.blockWeeks}>Weeks {i * 4 + 1}–{i * 4 + 4}</Text>
            <View style={{ flex: 1 }}>
              <Text style={text.h3}>{info.phase}</Text>
              <Text style={text.small}>{info.summary}</Text>
              <Text style={[text.small, { color: colors.text }]}>
                Main lifts {main.sets}×{formatReps(main)} · Accessories {acc.sets}×{formatReps(acc)} · Week {i * 4 + 4}: {weekInfo(profile.goal, i * 4 + 4).phase.toLowerCase()}
              </Text>
            </View>
          </View>
        ))}

        <SectionTitle>Week 1 with your equipment</SectionTitle>
        {days.map((day, i) => (
          <Card key={i} style={{ gap: space.sm }}>
            <Text style={text.h3}>{day.name}</Text>
            <Text style={text.small}>{day.focus}</Text>
            {day.exercises.map((ex) => {
              const exercise = getExercise(ex.exerciseId);
              const scheme = schemeForExercise(profile.goal, 1, ex.role, exercise);
              return (
                <View key={ex.slotId} style={styles.exRow}>
                  <Text style={[text.body, { flex: 1 }]}>{exercise.name}</Text>
                  <Text style={text.muted}>
                    {scheme.sets} × {formatReps(scheme, exercise.timed)}
                  </Text>
                </View>
              );
            })}
          </Card>
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
  meta: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  block: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  blockWeeks: { color: colors.accent, fontWeight: '800', width: 84, fontSize: 13, paddingTop: 2 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  footer: { padding: space.lg, borderTopWidth: 1, borderColor: colors.border },
});
