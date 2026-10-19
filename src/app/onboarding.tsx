import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, text } from '@/components/ui';
import { EQUIPMENT_LABELS } from '@/data/exercises';
import { EQUIPMENT_PRESETS, EXPERIENCE, GOALS } from '@/data/goals';
import type { Equipment, Experience, Goal, Units } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';

const STEPS = ['goal', 'experience', 'days', 'equipment', 'units'] as const;
const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABELS) as Equipment[];

function OptionCard({ title, description, detail, selected, onPress }: { title: string; description: string; detail?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && { opacity: 0.8 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={text.h3}>{title}</Text>
        <Text style={text.muted}>{description}</Text>
        {selected && detail ? <Text style={[text.small, { marginTop: space.sm, color: colors.text }]}>{detail}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]} />
    </Pressable>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const existing = useStore((s) => s.profile);
  const saveProfile = useStore((s) => s.saveProfile);

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | undefined>(existing?.goal);
  const [experience, setExperience] = useState<Experience | undefined>(existing?.experience);
  const [days, setDays] = useState<number>(existing?.daysPerWeek ?? 3);
  const [equipment, setEquipment] = useState<Equipment[]>(existing?.equipment ?? []);
  const [units, setUnits] = useState<Units>(existing?.units ?? 'lb');

  const current = STEPS[step];
  const canContinue = current === 'goal' ? !!goal : current === 'experience' ? !!experience : true;
  const presetMatch = EQUIPMENT_PRESETS.find((p) => p.equipment.length === equipment.length && p.equipment.every((e) => equipment.includes(e)));

  const toggleEquipment = (item: Equipment) =>
    setEquipment((list) => (list.includes(item) ? list.filter((e) => e !== item) : [...list, item]));

  const next = () => {
    if (step < STEPS.length - 1) return setStep(step + 1);
    saveProfile({ goal: goal!, experience: experience!, daysPerWeek: days, equipment, units, restSeconds: existing?.restSeconds ?? 120 });
    router.replace('/plans');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 ? <Text style={styles.brand}>GYMPLE</Text> : null}

        {current === 'goal' && (
          <>
            <Text style={text.h1}>What’s your main goal?</Text>
            <Text style={[text.muted, styles.lead]}>Your goal sets the reps, sets and how fast the weights go up.</Text>
            {GOALS.map((g) => (
              <OptionCard key={g.value} title={g.title} description={g.description} detail={g.detail} selected={goal === g.value} onPress={() => setGoal(g.value)} />
            ))}
          </>
        )}

        {current === 'experience' && (
          <>
            <Text style={text.h1}>How experienced are you?</Text>
            <Text style={[text.muted, styles.lead]}>Beginners can add weight faster; experienced lifters progress in smaller steps.</Text>
            {EXPERIENCE.map((e) => (
              <OptionCard key={e.value} title={e.title} description={e.description} selected={experience === e.value} onPress={() => setExperience(e.value)} />
            ))}
          </>
        )}

        {current === 'days' && (
          <>
            <Text style={text.h1}>How many days a week can you train?</Text>
            <Text style={[text.muted, styles.lead]}>We’ll recommend plans that fit your schedule.</Text>
            <View style={styles.dayRow}>
              {[2, 3, 4, 5, 6].map((d) => (
                <Pressable key={d} onPress={() => setDays(d)} style={[styles.dayBox, days === d && styles.dayBoxOn]} accessibilityRole="radio" accessibilityState={{ selected: days === d }}>
                  <Text style={[styles.dayNum, days === d && { color: colors.accentText }]}>{d}</Text>
                  <Text style={[text.small, days === d && { color: colors.accentText }]}>days</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {current === 'equipment' && (
          <>
            <Text style={text.h1}>What equipment do you have?</Text>
            <Text style={[text.muted, styles.lead]}>Exercises are swapped for ones you can do. Bodyweight moves are always included.</Text>
            {EQUIPMENT_PRESETS.map((p) => (
              <OptionCard key={p.id} title={p.title} description={p.description} selected={presetMatch?.id === p.id} onPress={() => setEquipment(p.equipment)} />
            ))}
            <Text style={[text.small, styles.customLabel]}>Or pick exactly what you have</Text>
            <View style={styles.chips}>
              {ALL_EQUIPMENT.map((e) => (
                <Chip key={e} label={EQUIPMENT_LABELS[e]} selected={equipment.includes(e)} onPress={() => toggleEquipment(e)} />
              ))}
            </View>
          </>
        )}

        {current === 'units' && (
          <>
            <Text style={text.h1}>Pounds or kilograms?</Text>
            <Text style={[text.muted, styles.lead]}>Used for logging and for rounding suggested weights to real plates.</Text>
            <View style={styles.dayRow}>
              {(['lb', 'kg'] as Units[]).map((u) => (
                <Pressable key={u} onPress={() => setUnits(u)} style={[styles.dayBox, styles.unitBox, units === u && styles.dayBoxOn]} accessibilityRole="radio" accessibilityState={{ selected: units === u }}>
                  <Text style={[styles.dayNum, units === u && { color: colors.accentText }]}>{u}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        {step > 0 ? <Button title="Back" variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
        <Button title={step === STEPS.length - 1 ? 'See my plans' : 'Continue'} onPress={next} disabled={!canContinue} style={{ flex: 2 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: space.lg, paddingTop: space.md },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.accent },
  content: { padding: space.lg, paddingBottom: space.xl, gap: space.md },
  brand: { color: colors.accent, fontWeight: '900', letterSpacing: 4, fontSize: 14 },
  lead: { marginBottom: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionSelected: { borderColor: colors.accent },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  dayRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  dayBox: {
    flex: 1,
    minWidth: 56,
    aspectRatio: 0.9,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBox: { aspectRatio: 1.6 },
  dayBoxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayNum: { color: colors.text, fontSize: 28, fontWeight: '800' },
  customLabel: { marginTop: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footer: { flexDirection: 'row', gap: space.sm, padding: space.lg, borderTopWidth: 1, borderColor: colors.border },
});
