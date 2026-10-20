import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Display, SectionTitle, text } from '@/components/ui';
import { buildReport, trainingWeek } from '@/lib/coach';
import { healthAvailability, readWeeklyHealth, saveBodyMeasurements } from '@/lib/health';
import { newId } from '@/lib/id';
import { weekInfo } from '@/lib/periodization';
import { currentWeek } from '@/lib/program';
import type { CheckIn, CheckInRatings, HealthSnapshot, Rating } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, space } from '@/theme';

const RATINGS: { key: keyof CheckInRatings; label: string; low: string; high: string }[] = [
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Great' },
  { key: 'sleep', label: 'Sleep quality', low: 'Poor', high: 'Great' },
  { key: 'soreness', label: 'Soreness', low: 'None', high: 'Very sore' },
  { key: 'stress', label: 'Stress', low: 'Calm', high: 'Very stressed' },
  { key: 'nutrition', label: 'Ate to plan', low: 'Off plan', high: 'Spot on' },
  { key: 'motivation', label: 'Motivation', low: 'Low', high: 'Fired up' },
];

const parse = (value: string) => {
  const n = Number(value.replace(',', '.'));
  return value.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
};
const show = (n: number | undefined, digits = 1) => (n === undefined ? '' : String(Math.round(n * 10 ** digits) / 10 ** digits));

function RatingRow({ label, low, high, value, onChange }: { label: string; low: string; high: string; value: Rating; onChange: (r: Rating) => void }) {
  return (
    <View style={styles.rating}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.ratingDots}>
        {([1, 2, 3, 4, 5] as Rating[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            style={[styles.dot, r === value && styles.dotOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: r === value }}
            accessibilityLabel={`${label} ${r} of 5`}
          >
            <Text style={[styles.dotText, r === value && { color: colors.accentText }]}>{r}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.ratingEnds}>
        <Text style={text.small}>{low}</Text>
        <Text style={text.small}>{high}</Text>
      </View>
    </View>
  );
}

function Field({ label, unit, value, onChange, fromHealth }: { label: string; unit: string; value: string; onChange: (v: string) => void; fromHealth?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={colors.faint}
          style={styles.fieldInput}
          accessibilityLabel={label}
        />
        <Text style={styles.fieldUnit}>{unit}</Text>
      </View>
      {fromHealth ? (
        <Text style={styles.fromHealth}>
          <Ionicons name="heart" size={11} color={colors.danger} /> 7-day avg from Apple Health
        </Text>
      ) : null}
    </View>
  );
}

export default function CheckInScreen() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const program = useStore((s) => s.program);
  const sessions = useStore((s) => s.sessions);
  const checkIns = useStore((s) => s.checkIns);
  const coach = useStore((s) => s.coach);
  const addCheckIn = useStore((s) => s.addCheckIn);

  const units = profile?.units ?? 'lb';
  const healthReady = coach.healthConnected && healthAvailability() === 'available';
  const [health, setHealth] = useState<HealthSnapshot | undefined>();
  const [loadingHealth, setLoadingHealth] = useState(healthReady);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [leanMass, setLeanMass] = useState('');
  const [waist, setWaist] = useState('');
  const [notes, setNotes] = useState('');
  const [ratings, setRatings] = useState<CheckInRatings>({ energy: 3, sleep: 3, soreness: 3, stress: 3, nutrition: 3, motivation: 3 });

  useEffect(() => {
    if (!healthReady) return;
    let cancelled = false;
    readWeeklyHealth(units).then((snapshot) => {
      if (cancelled) return;
      setHealth(snapshot);
      if (snapshot?.weightAvg) setWeight(show(snapshot.weightAvg));
      if (snapshot?.bodyFat) setBodyFat(show(snapshot.bodyFat));
      if (snapshot?.leanMass) setLeanMass(show(snapshot.leanMass));
      setLoadingHealth(false);
    });
    return () => {
      cancelled = true;
    };
  }, [healthReady, units]);

  if (!profile) return null;
  const last = checkIns[checkIns.length - 1];
  const week = program ? currentWeek(program, sessions) : 1;
  const sameAsHealth = (typed: number | undefined, fromHealth: number | undefined) => typed !== undefined && fromHealth !== undefined && Math.abs(typed - fromHealth) < 0.05;

  const submit = () => {
    const now = new Date();
    const values = { weight: parse(weight), bodyFat: parse(bodyFat), leanMass: parse(leanMass), waist: parse(waist) };
    // Only treat Health numbers as averages if the user didn't overwrite them.
    const healthUsed: HealthSnapshot | undefined = health && {
      ...health,
      weightAvg: sameAsHealth(values.weight, health.weightAvg) ? health.weightAvg : undefined,
      bodyFat: sameAsHealth(values.bodyFat, health.bodyFat) ? health.bodyFat : undefined,
      leanMass: sameAsHealth(values.leanMass, health.leanMass) ? health.leanMass : undefined,
    };
    const report = buildReport({
      goal: profile.goal,
      units,
      now,
      ...values,
      ratings,
      health: healthUsed,
      previous: last,
      training: trainingWeek(program, sessions, now),
      nextWeek: weekInfo(profile.goal, week),
    });
    const checkIn: CheckIn = { id: newId(), date: now.toISOString(), week, units, ...values, ratings, notes: notes.trim() || undefined, health: healthUsed, report };
    addCheckIn(checkIn);
    if (healthReady && coach.saveToHealth) {
      const typedWeight = healthUsed?.weightAvg ? undefined : values.weight;
      const typedFat = healthUsed?.bodyFat ? undefined : values.bodyFat;
      void saveBodyMeasurements(units, typedWeight, typedFat);
    }
    router.replace({ pathname: '/checkin/[id]', params: { id: checkIn.id } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text style={styles.eyebrow}>WEEK {week} · CHECK-IN</Text>
        <Display size={30}>How was your week?</Display>
        <Text style={text.muted}>Two minutes. Be honest: your answers decide next week’s plan.</Text>

        {healthReady ? (
          <Card style={styles.healthCard}>
            <View style={styles.healthHead}>
              <Ionicons name="heart" size={16} color={colors.danger} />
              <Text style={text.h3}>Apple Health · last 7 days</Text>
              {loadingHealth ? <ActivityIndicator color={colors.accent} size="small" /> : null}
            </View>
            {!loadingHealth && !health ? <Text style={text.small}>No recent data found. Enter your numbers below.</Text> : null}
            {health ? (
              <View style={styles.healthGrid}>
                {health.stepsPerDay !== undefined ? <HealthStat label="Steps / day" value={Math.round(health.stepsPerDay).toLocaleString()} /> : null}
                {health.sleepHours !== undefined ? <HealthStat label="Sleep / night" value={`${show(health.sleepHours)} h`} /> : null}
                {health.restingHr !== undefined ? <HealthStat label="Resting HR" value={`${Math.round(health.restingHr)} bpm`} /> : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        <SectionTitle right={last?.weight ? `last: ${show(last.weight)} ${last.units}` : undefined}>Body</SectionTitle>
        <View style={styles.fields}>
          <Field label="Weight" unit={units} value={weight} onChange={setWeight} fromHealth={!!health?.weightAvg && sameAsHealth(parse(weight), health.weightAvg)} />
          <Field label="Body fat (optional)" unit="%" value={bodyFat} onChange={setBodyFat} fromHealth={!!health?.bodyFat && sameAsHealth(parse(bodyFat), health.bodyFat)} />
        </View>
        <View style={styles.fields}>
          <Field label="Lean mass (optional)" unit={units} value={leanMass} onChange={setLeanMass} fromHealth={!!health?.leanMass && sameAsHealth(parse(leanMass), health.leanMass)} />
          <Field label="Waist (optional)" unit={units === 'kg' ? 'cm' : 'in'} value={waist} onChange={setWaist} />
        </View>
        <Text style={text.small}>Weigh in first thing in the morning, after the bathroom, for the most consistent numbers. Smart-scale body fat swings day to day, so trends matter more than single readings.</Text>

        <SectionTitle>Rate the week</SectionTitle>
        {RATINGS.map((r) => (
          <RatingRow key={r.key} label={r.label} low={r.low} high={r.high} value={ratings[r.key]} onChange={(v) => setRatings({ ...ratings, [r.key]: v })} />
        ))}

        <SectionTitle>Anything else?</SectionTitle>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Tweaked my shoulder, travelling next week, felt strong on squats…"
          placeholderTextColor={colors.faint}
          multiline
          style={styles.notes}
          accessibilityLabel="Notes"
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Get my report" onPress={submit} disabled={!parse(weight) && !health} testID="submit-checkin" />
      </View>
    </SafeAreaView>
  );
}

function HealthStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.healthValue}>{value}</Text>
      <Text style={text.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  eyebrow: { color: colors.accent, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  healthCard: { gap: space.sm },
  healthHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  healthGrid: { flexDirection: 'row', gap: space.md },
  healthValue: { color: colors.text, fontFamily: fonts.display, fontSize: 18 },
  fields: { flexDirection: 'row', gap: space.md },
  field: { flex: 1, gap: 4 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: space.md },
  fieldInput: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.display, fontSize: 24, paddingVertical: 12 },
  fieldUnit: { color: colors.muted, fontWeight: '800' },
  fromHealth: { color: colors.muted, fontSize: 11 },
  rating: { gap: 6, paddingVertical: space.xs },
  ratingLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  ratingDots: { flexDirection: 'row', gap: space.sm },
  dot: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.accent },
  dotText: { color: colors.text, fontFamily: fonts.display, fontSize: 16 },
  ratingEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  notes: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, color: colors.text, fontSize: 15, minHeight: 90, textAlignVertical: 'top' },
  footer: { paddingHorizontal: space.lg, paddingVertical: space.md },
});
