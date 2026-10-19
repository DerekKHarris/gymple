import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlanLettering } from '@/components/PlanLettering';
import { Display, SectionTitle, text } from '@/components/ui';
import { GOAL_TITLES, LEVEL_TITLES } from '@/data/goals';
import { recommendPlans, type PlanRecommendation } from '@/lib/program';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';

function PlanCard({ rec, recommended, onPress }: { rec: PlanRecommendation; recommended: boolean; onPress: () => void }) {
  const { plan } = rec;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={plan.name} onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
      <LinearGradient colors={recommended ? ['#23250F', '#141416'] : ['#1C1C20', '#121214']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, recommended && styles.cardRecommended]}>
        {recommended ? (
          <View style={styles.tab}>
            <Text style={styles.tabText}>RECOMMENDED</Text>
          </View>
        ) : null}
        <View style={styles.cardBody}>
          <View style={styles.lettering}>
            <PlanLettering plan={plan} size={21} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={text.h3}>{plan.name}</Text>
            <Text style={text.small}>{plan.tagline}</Text>
            <Text style={styles.meta}>
              {plan.daysPerWeek} DAYS / WK · {plan.levels.map((l) => LEVEL_TITLES[l].toUpperCase()).join(' · ')}
            </Text>
          </View>
        </View>
        {recommended && rec.reasons.length ? (
          <View style={styles.reasons}>
            {rec.reasons.map((r) => (
              <Text key={r} style={styles.reason}>
                ✓ {r}
              </Text>
            ))}
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
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
        <Display size={32}>Choose your 12-week plan</Display>
        <Text style={text.muted}>
          <Text style={text.accent}>{GOAL_TITLES[profile.goal]}</Text> · {profile.daysPerWeek} days a week. Every plan runs three 4-week blocks, each ending with a lighter deload week.
        </Text>
        <SectionTitle right={`${top.length}`}>Best for you</SectionTitle>
        {top.map((r) => (
          <PlanCard key={r.plan.id} rec={r} recommended onPress={() => open(r.plan.id)} />
        ))}
        <SectionTitle right={`${rest.length}`}>All plans</SectionTitle>
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
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md, borderWidth: 1.5, borderColor: 'transparent', overflow: 'hidden' },
  cardRecommended: { borderColor: colors.accent, paddingTop: space.xl + space.md },
  tab: { position: 'absolute', top: 0, left: 0, backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 5, borderBottomRightRadius: radius.sm },
  tabText: { color: colors.accentText, fontWeight: '900', fontSize: 11, letterSpacing: 0.6 },
  cardBody: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  lettering: { width: 108 },
  meta: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginTop: 2 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  reason: { color: colors.text, fontSize: 12, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
});
