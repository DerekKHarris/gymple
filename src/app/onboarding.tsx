import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Display, SegmentBar, text } from '@/components/ui';
import { EQUIPMENT_LABELS } from '@/data/exercises';
import { EQUIPMENT_PRESETS, EXPERIENCE, GOALS } from '@/data/goals';
import type { Equipment, Experience, Goal, Units } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, space } from '@/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const STEPS = ['goal', 'experience', 'days', 'equipment', 'units'] as const;
const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABELS) as Equipment[];

const GOAL_ICONS: Record<Goal, IconName> = { strength: 'weight-lifter', hypertrophy: 'arm-flex', fat_loss: 'fire', general: 'heart-pulse' };
const EXPERIENCE_ICONS: Record<Experience, IconName> = { beginner: 'sprout', intermediate: 'stairs', advanced: 'trophy' };
const PRESET_ICONS: Record<string, IconName> = { full_gym: 'warehouse', home_gym: 'home', dumbbells: 'dumbbell', minimal: 'human' };

function OptionCard({
  title,
  description,
  detail,
  icon,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  detail?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && { opacity: 0.8 }]}
    >
      {icon ? (
        <View style={[styles.optionIcon, selected && { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name={icon} size={22} color={selected ? colors.accentText : colors.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={text.muted}>{description}</Text>
        {selected && detail ? <Text style={[text.small, { marginTop: space.xs, color: colors.text }]}>{detail}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <Ionicons name="checkmark" size={15} color={colors.accentText} /> : null}</View>
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

  const toggleEquipment = (item: Equipment) => setEquipment((list) => (list.includes(item) ? list.filter((e) => e !== item) : [...list, item]));

  const next = () => {
    if (step < STEPS.length - 1) return setStep(step + 1);
    saveProfile({ goal: goal!, experience: experience!, daysPerWeek: days, equipment, units, restSeconds: existing?.restSeconds ?? 120 });
    router.replace('/plans');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Pressable onPress={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={[styles.back, step === 0 && { opacity: 0 }]} accessibilityLabel="Back" hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <SegmentBar total={STEPS.length} filled={step + 1} style={{ flex: 1 }} />
        <Text style={styles.stepCount}>
          {step + 1}/{STEPS.length}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 ? <Text style={styles.brand}>GYMPLE</Text> : null}

        {current === 'goal' && (
          <>
            <Display>What’s your main goal?</Display>
            <Text style={[text.muted, styles.lead]}>Your goal sets the reps, sets and how fast the weights go up.</Text>
            {GOALS.map((g) => (
              <OptionCard key={g.value} icon={GOAL_ICONS[g.value]} title={g.title} description={g.description} detail={g.detail} selected={goal === g.value} onPress={() => setGoal(g.value)} />
            ))}
          </>
        )}

        {current === 'experience' && (
          <>
            <Display>How experienced are you?</Display>
            <Text style={[text.muted, styles.lead]}>Beginners can add weight faster; experienced lifters progress in smaller steps.</Text>
            {EXPERIENCE.map((e) => (
              <OptionCard key={e.value} icon={EXPERIENCE_ICONS[e.value]} title={e.title} description={e.description} selected={experience === e.value} onPress={() => setExperience(e.value)} />
            ))}
          </>
        )}

        {current === 'days' && (
          <>
            <Display>How many days a week?</Display>
            <Text style={[text.muted, styles.lead]}>We’ll recommend plans that fit your schedule.</Text>
            <View style={styles.dayRow}>
              {[2, 3, 4, 5, 6].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDays(d)}
                  style={[styles.dayCircle, days === d && styles.dayCircleOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: days === d }}
                  accessibilityLabel={`${d} days`}
                >
                  <Text style={[styles.dayNum, days === d && { color: colors.accentText }]}>{d}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.dayCaption]}>
              <Text style={text.accent}>{days} days</Text> a week
            </Text>
          </>
        )}

        {current === 'equipment' && (
          <>
            <Display>What equipment do you have?</Display>
            <Text style={[text.muted, styles.lead]}>Exercises are swapped for ones you can do. Bodyweight moves are always included.</Text>
            {EQUIPMENT_PRESETS.map((p) => (
              <OptionCard key={p.id} icon={PRESET_ICONS[p.id]} title={p.title} description={p.description} selected={presetMatch?.id === p.id} onPress={() => setEquipment(p.equipment)} />
            ))}
            <Text style={styles.customLabel}>OR PICK EXACTLY WHAT YOU HAVE</Text>
            <View style={styles.chips}>
              {ALL_EQUIPMENT.map((e) => (
                <Chip key={e} label={EQUIPMENT_LABELS[e]} selected={equipment.includes(e)} onPress={() => toggleEquipment(e)} />
              ))}
            </View>
          </>
        )}

        {current === 'units' && (
          <>
            <Display>Pounds or kilograms?</Display>
            <Text style={[text.muted, styles.lead]}>Used for logging and for rounding suggested weights to real plates.</Text>
            <View style={styles.unitRow}>
              {(['lb', 'kg'] as Units[]).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUnits(u)}
                  style={[styles.unit, units === u && styles.unitOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: units === u }}
                  accessibilityLabel={u}
                >
                  <Text style={[styles.unitText, units === u && { color: colors.accentText }]}>{u}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button title={step === STEPS.length - 1 ? 'See my plans' : 'Continue'} onPress={next} disabled={!canContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.sm },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  stepCount: { color: colors.accent, fontWeight: '800', fontSize: 13, width: 28, textAlign: 'right' },
  content: { padding: space.lg, paddingBottom: space.xl, gap: space.md },
  brand: { color: colors.accent, fontFamily: fonts.display, fontSize: 16, letterSpacing: 3 },
  lead: { marginBottom: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.card,
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: '#17180F' },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg },
  dayCircle: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dayCircleOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayNum: { color: colors.text, fontFamily: fonts.display, fontSize: 24 },
  dayCaption: { color: colors.muted, textAlign: 'center', marginTop: space.md, fontSize: 16 },
  customLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginTop: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  unitRow: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  unit: { flex: 1, height: 110, borderRadius: radius.lg, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  unitOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  unitText: { color: colors.text, fontFamily: fonts.display, fontSize: 34, textTransform: 'uppercase' },
  footer: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md },
});
