import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { bodyComposition, effectiveWeight } from '@/lib/coach';
import type { Units } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';
import { Button, SectionTitle, Stat, text } from './ui';

const LB_PER_KG = 2.20462;
const round1 = (n: number) => Math.round(n * 10) / 10;
const toUnits = (value: number, from: Units, to: Units) => (from === to ? value : to === 'kg' ? value / LB_PER_KG : value * LB_PER_KG);

/** Body-weight and composition trend from weekly check-ins, plus the list of past reports. */
export function BodyProgress({ units }: { units: Units }) {
  const router = useRouter();
  const checkIns = useStore((s) => s.checkIns);

  if (!checkIns.length) {
    return (
      <>
        <SectionTitle>Body</SectionTitle>
        <Text style={text.muted}>Do a weekly check-in to track your weight, body fat and lean mass here.</Text>
        <Button title="Check in" size="sm" onPress={() => router.push('/checkin')} style={{ alignSelf: 'flex-start' }} />
      </>
    );
  }

  const points = checkIns
    .map((c) => {
      const w = effectiveWeight(c.weight, c.health);
      const comp = bodyComposition(c.weight, c.bodyFat, c.leanMass, c.health);
      return {
        id: c.id,
        date: c.date,
        headline: c.report.headline,
        weight: w !== undefined ? toUnits(w, c.units, units) : undefined,
        lean: comp ? toUnits(comp.leanMass, c.units, units) : undefined,
        bodyFat: c.health?.bodyFat ?? c.bodyFat,
      };
    });
  const weighed = points.filter((p): p is typeof p & { weight: number } => p.weight !== undefined);
  const first = weighed[0];
  const latest = weighed[weighed.length - 1];
  const withLean = points.filter((p) => p.lean !== undefined);
  const leanChange = withLean.length > 1 ? withLean[withLean.length - 1].lean! - withLean[0].lean! : undefined;
  const latestFat = [...points].reverse().find((p) => p.bodyFat !== undefined)?.bodyFat;
  const recent = weighed.slice(-12);
  const max = Math.max(...recent.map((p) => p.weight));
  const min = Math.min(...recent.map((p) => p.weight));

  return (
    <>
      <SectionTitle right={`${checkIns.length} check-in${checkIns.length === 1 ? '' : 's'}`}>Body</SectionTitle>
      <View style={styles.stats}>
        <Stat value={latest ? `${round1(latest.weight)}` : '—'} label={`Weight (${units})`} accent size={20} />
        <Stat value={latest && first && latest !== first ? `${latest.weight - first.weight > 0 ? '+' : ''}${round1(latest.weight - first.weight)}` : '—'} label="Since start" size={20} />
        {latestFat !== undefined ? <Stat value={`${round1(latestFat)}%`} label="Body fat" size={20} /> : null}
        {leanChange !== undefined ? <Stat value={`${leanChange > 0 ? '+' : ''}${round1(leanChange)}`} label="Lean mass" size={20} /> : null}
      </View>
      {recent.length > 1 ? (
        <View style={styles.bars}>
          {recent.map((p, i) => (
            <View key={p.id} style={[styles.bar, { height: `${20 + ((p.weight - min) / (max - min || 1)) * 80}%` }, i === recent.length - 1 && styles.barLast]} />
          ))}
        </View>
      ) : null}
      {[...checkIns].reverse().slice(0, 6).map((c) => (
        <Pressable
          key={c.id}
          onPress={() => router.push({ pathname: '/checkin/[id]', params: { id: c.id } })}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          accessibilityLabel={`Report from week ${c.week}`}
        >
          <View style={styles.week}>
            <Text style={styles.weekText}>W{c.week}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={text.h3} numberOfLines={1}>
              {c.report.headline}
            </Text>
            <Text style={text.small}>{new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.faint} />
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: space.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 64, marginVertical: space.sm },
  bar: { flex: 1, maxWidth: 28, backgroundColor: '#3A3A40', borderRadius: 4 },
  barLast: { backgroundColor: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.md, padding: space.md },
  week: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  weekText: { color: colors.accent, fontWeight: '900' },
});
