import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceSheet } from '@/components/Sheet';
import { Button, Card, Chip, SectionTitle, text } from '@/components/ui';
import { EQUIPMENT_LABELS } from '@/data/exercises';
import { EXPERIENCE, GOALS } from '@/data/goals';
import type { Equipment } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme';

const REST_OPTIONS = [60, 90, 120, 180, 240];
const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABELS) as Equipment[];

const restLabel = (s: number) => (s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`);

export default function SettingsScreen() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const program = useStore((s) => s.program);
  const updateProfile = useStore((s) => s.updateProfile);
  const changeGoal = useStore((s) => s.changeGoal);
  const resetAll = useStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!profile) return null;

  const toggleEquipment = (item: Equipment) => {
    const list = profile.equipment.includes(item) ? profile.equipment.filter((e) => e !== item) : [...profile.equipment, item];
    updateProfile({ equipment: list });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle>Rest timer</SectionTitle>
        <View style={styles.chips}>
          {REST_OPTIONS.map((s) => (
            <Chip key={s} label={restLabel(s)} selected={profile.restSeconds === s} onPress={() => updateProfile({ restSeconds: s })} />
          ))}
        </View>
        <Text style={text.small}>Research suggests 2–5 minutes for heavy compound lifts and 1–2 minutes for lighter accessory work.</Text>

        <SectionTitle>Goal</SectionTitle>
        <View style={styles.chips}>
          {GOALS.map((g) => (
            <Chip key={g.value} label={g.title} selected={profile.goal === g.value} onPress={() => changeGoal(g.value)} />
          ))}
        </View>
        <Text style={text.small}>Changing your goal updates the sets and reps of workouts you haven’t started yet.</Text>

        <SectionTitle>Experience</SectionTitle>
        <View style={styles.chips}>
          {EXPERIENCE.map((e) => (
            <Chip key={e.value} label={e.title} selected={profile.experience === e.value} onPress={() => updateProfile({ experience: e.value })} />
          ))}
        </View>

        <SectionTitle>Units</SectionTitle>
        <View style={styles.chips}>
          {(['lb', 'kg'] as const).map((u) => (
            <Chip key={u} label={u} selected={profile.units === u} onPress={() => updateProfile({ units: u })} />
          ))}
        </View>
        <Text style={text.small}>Weights you’ve already logged aren’t converted.</Text>

        <SectionTitle>Equipment</SectionTitle>
        <View style={styles.chips}>
          {ALL_EQUIPMENT.map((e) => (
            <Chip key={e} label={EQUIPMENT_LABELS[e]} selected={profile.equipment.includes(e)} onPress={() => toggleEquipment(e)} />
          ))}
        </View>
        <Text style={text.small}>Used when you add or change exercises and when you start a new plan.</Text>

        <SectionTitle>Plan</SectionTitle>
        <Card style={{ gap: space.sm }}>
          <Text style={text.h3}>{program?.name ?? 'No plan selected'}</Text>
          <Button title="Change plan" variant="secondary" onPress={() => router.push('/plans')} />
        </Card>

        <SectionTitle>Data</SectionTitle>
        <Text style={text.small}>Everything is stored only on this device.</Text>
        <Button title="Reset all data" variant="danger" onPress={() => setConfirmReset(true)} />
      </ScrollView>
      <ChoiceSheet
        visible={confirmReset}
        title="Reset everything?"
        message="This deletes your profile, plan and all logged workouts from this device. It can't be undone."
        choices={[
          {
            label: 'Delete all data',
            variant: 'danger',
            onPress: () => {
              resetAll();
              if (router.canDismiss()) router.dismissAll();
              router.replace('/onboarding');
            },
          },
        ]}
        onClose={() => setConfirmReset(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.sm, paddingBottom: space.xl * 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
