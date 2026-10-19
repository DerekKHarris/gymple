import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, SectionTitle, text } from '@/components/ui';
import { GOAL_TITLES } from '@/data/goals';
import { recommendPlans, type PlanRecommendation } from '@/lib/program';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme';

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

function PlanCard({ rec, recommended, onPress }: { rec: PlanRecommendation; recommended: boolean; onPress: () => void }) {
  const { plan } = rec;
  return (
    <Card onPress={onPress} style={[styles.card, recommended && styles.recommended]}>
      <View style={styles.cardTop}>
        <Text style={[text.h3, { flex: 1 }]}>{plan.name}</Text>
        {recommended ? <Badge label="Recommended" tone="accent" /> : null}
      </View>
      <Text style={text.muted}>{plan.tagline}</Text>
      <View style={styles.meta}>
        <Badge label={`${plan.daysPerWeek} days / week`} tone="info" />
        <Badge label={plan.levels.map((l) => LEVEL[l]).join(' · ')} />
      </View>
      {recommended && rec.reasons.length ? <Text style={[text.small, { color: colors.accent }]}>✓ {rec.reasons.join('  ✓ ')}</Text> : null}
    </Card>
  );
}

export default function PlansScreen() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const recs = useMemo(() => (profile ? recommendPlans(profile) : []), [profile]);

  if (!profile) return null;
  const top = recs.slice(0, 2);
  const rest = recs.slice(2);
  const open = (id: string) => router.push({ pathname: '/plans/[planId]', params: { planId: id } });

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={text.h1}>Pick your 12-week plan</Text>
        <Text style={text.muted}>
          Goal: {GOAL_TITLES[profile.goal]} · {profile.daysPerWeek} days a week. Every plan runs 12 weeks in three 4-week blocks, each ending with a lighter
          deload week.
        </Text>
        <SectionTitle>Best matches for you</SectionTitle>
        {top.map((r) => (
          <PlanCard key={r.plan.id} rec={r} recommended onPress={() => open(r.plan.id)} />
        ))}
        <SectionTitle>All plans</SectionTitle>
        {rest.map((r) => (
          <PlanCard key={r.plan.id} rec={r} recommended={false} onPress={() => open(r.plan.id)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  card: { gap: space.sm },
  recommended: { borderColor: colors.accent },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meta: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
