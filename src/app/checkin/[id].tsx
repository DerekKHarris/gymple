import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Display, SectionTitle, Stat, text } from '@/components/ui';
import { bodyComposition, effectiveWeight } from '@/lib/coach';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, space } from '@/theme';

const round1 = (n: number) => Math.round(n * 10) / 10;
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${round1(Math.abs(n))}`;

export default function CoachReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const checkIns = useStore((s) => s.checkIns);
  const index = checkIns.findIndex((c) => c.id === id);
  const checkIn = checkIns[index];
  if (!checkIn) return null;

  const { report, units } = checkIn;
  const weight = effectiveWeight(checkIn.weight, checkIn.health);
  const comp = bodyComposition(checkIn.weight, checkIn.bodyFat, checkIn.leanMass, checkIn.health);
  const bodyFat = checkIn.health?.bodyFat ?? checkIn.bodyFat;
  const history = checkIns
    .slice(0, index + 1)
    .map((c) => ({ id: c.id, w: effectiveWeight(c.weight, c.health) }))
    .filter((c): c is { id: string; w: number } => c.w !== undefined)
    .slice(-8);
  const max = Math.max(...history.map((h) => h.w));
  const min = Math.min(...history.map((h) => h.w));
  const trendColor = report.weightTrend === 'on_track' ? colors.accent : report.weightTrend === 'baseline' || report.weightTrend === 'no_data' ? colors.text : colors.warning;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={['#2E3209', '#0A0A0A']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
          <Text style={styles.eyebrow}>
            WEEK {checkIn.week} · {new Date(checkIn.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
          </Text>
          <Display size={28}>{report.headline}</Display>
        </LinearGradient>

        <View style={styles.stats}>
          <Stat value={weight !== undefined ? `${round1(weight)}` : '—'} label={`Weight (${units})`} />
          <View style={styles.divider} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.bigValue, { color: trendColor }]}>{report.weeklyChangePct !== undefined ? `${signed(report.weeklyChangePct)}%` : '—'}</Text>
            <Text style={text.small}>Per week</Text>
          </View>
          <View style={styles.divider} />
          <Stat value={`${report.workoutsDone}/${report.workoutsPlanned}`} label="Workouts" accent={report.workoutsDone >= report.workoutsPlanned} />
        </View>

        {comp || bodyFat !== undefined ? (
          <View style={styles.compRow}>
            {bodyFat !== undefined ? <CompStat label="Body fat" value={`${round1(bodyFat)}%`} /> : null}
            {comp ? <CompStat label={`Lean mass (${units})`} value={`${round1(comp.leanMass)}`} change={report.leanMassChange} good={(report.leanMassChange ?? 0) >= 0} /> : null}
            {comp ? <CompStat label={`Fat mass (${units})`} value={`${round1(comp.fatMass)}`} change={report.fatMassChange} good={(report.fatMassChange ?? 0) <= 0} /> : null}
          </View>
        ) : null}

        {report.holdProgression ? (
          <View style={styles.hold}>
            <Ionicons name="pause-circle" size={22} color={colors.accentText} />
            <Text style={styles.holdText}>Weights are on hold for 7 days: your suggested weights won’t go up until you’ve recovered.</Text>
          </View>
        ) : null}

        {report.actions.length ? (
          <>
            <SectionTitle right={`${report.actions.length}`}>Next week’s focus</SectionTitle>
            {report.actions.map((a, i) => (
              <View key={i} style={styles.item}>
                <View style={styles.num}>
                  <Text style={styles.numText}>{i + 1}</Text>
                </View>
                <Text style={[text.body, { flex: 1 }]}>{a}</Text>
              </View>
            ))}
          </>
        ) : null}

        {report.wins.length ? (
          <>
            <SectionTitle>Wins</SectionTitle>
            {report.wins.map((w, i) => (
              <View key={i} style={styles.item}>
                <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                <Text style={[text.body, { flex: 1 }]}>{w}</Text>
              </View>
            ))}
          </>
        ) : null}

        {history.length > 1 ? (
          <>
            <SectionTitle right={`${history.length} check-ins`}>Weight trend</SectionTitle>
            <View style={styles.bars}>
              {history.map((h, i) => (
                <View key={h.id} style={styles.barCol}>
                  <View style={[styles.bar, { height: `${20 + ((h.w - min) / (max - min || 1)) * 80}%` }, i === history.length - 1 && styles.barLast]} />
                  <Text style={styles.barLabel}>{round1(h.w)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {checkIn.health && (checkIn.health.stepsPerDay || checkIn.health.sleepHours || checkIn.health.restingHr) ? (
          <>
            <SectionTitle>From Apple Health</SectionTitle>
            <View style={styles.stats}>
              {checkIn.health.stepsPerDay !== undefined ? <Stat value={Math.round(checkIn.health.stepsPerDay).toLocaleString()} label="Steps / day" size={20} /> : null}
              {checkIn.health.sleepHours !== undefined ? <Stat value={`${round1(checkIn.health.sleepHours)} h`} label="Sleep / night" size={20} /> : null}
              {checkIn.health.restingHr !== undefined ? <Stat value={`${Math.round(checkIn.health.restingHr)}`} label="Resting HR" size={20} /> : null}
            </View>
          </>
        ) : null}

        {checkIn.notes ? (
          <>
            <SectionTitle>Your notes</SectionTitle>
            <Text style={text.muted}>{checkIn.notes}</Text>
          </>
        ) : null}

        <Text style={[text.small, { marginTop: space.lg }]}>
          Coaching here is general guidance from training research, not medical advice. Talk to a doctor before big changes to diet or training.
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Done" onPress={() => (router.canGoBack() ? router.back() : router.replace('/program'))} />
      </View>
    </SafeAreaView>
  );
}

function CompStat({ label, value, change, good }: { label: string; value: string; change?: number; good?: boolean }) {
  return (
    <View style={styles.comp}>
      <Text style={styles.compValue}>{value}</Text>
      {change !== undefined ? <Text style={[styles.compChange, { color: good ? colors.accent : colors.warning }]}>{signed(change)}</Text> : null}
      <Text style={text.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  hero: { borderRadius: radius.lg, padding: space.xl, gap: space.sm, borderWidth: 1.5, borderColor: colors.accent },
  eyebrow: { color: colors.accent, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  bigValue: { fontFamily: fonts.display, fontSize: 26, lineHeight: 34 },
  compRow: { flexDirection: 'row', gap: space.sm },
  comp: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, gap: 2 },
  compValue: { color: colors.text, fontFamily: fonts.display, fontSize: 20 },
  compChange: { fontWeight: '900', fontSize: 13 },
  hold: { flexDirection: 'row', gap: space.sm, alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, padding: space.md },
  holdText: { color: colors.accentText, fontWeight: '700', flex: 1 },
  item: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  numText: { color: colors.accentText, fontWeight: '900', fontSize: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 },
  barCol: { flex: 1, maxWidth: 48, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  bar: { width: '100%', backgroundColor: '#3A3A40', borderRadius: 4 },
  barLast: { backgroundColor: colors.accent },
  barLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  footer: { paddingHorizontal: space.lg, paddingVertical: space.md },
});
