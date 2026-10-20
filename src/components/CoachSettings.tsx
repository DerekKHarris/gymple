import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { connectHealth, healthAvailability } from '@/lib/health';
import { cancelCheckInReminder, scheduleCheckInReminder } from '@/lib/reminders';
import { useStore } from '@/store/useStore';
import { colors, space } from '@/theme';
import { Button, Chip, SectionTitle, text } from './ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Settings for weekly check-ins (day, reminder) and Apple Health. */
export function CoachSettings() {
  const coach = useStore((s) => s.coach);
  const updateCoach = useStore((s) => s.updateCoach);
  const [message, setMessage] = useState<string | null>(null);
  const availability = healthAvailability();

  const setDay = async (day: number) => {
    updateCoach({ checkInDay: day });
    if (coach.reminder) await scheduleCheckInReminder(day);
  };

  const setReminder = async (on: boolean) => {
    if (!on) {
      updateCoach({ reminder: false });
      await cancelCheckInReminder();
      return;
    }
    const ok = await scheduleCheckInReminder(coach.checkInDay);
    updateCoach({ reminder: ok });
    setMessage(ok ? null : 'Couldn’t schedule the reminder. Allow notifications for Gymple in your phone’s settings.');
  };

  const connect = async () => {
    const ok = await connectHealth();
    updateCoach({ healthConnected: ok });
    setMessage(ok ? null : 'Apple Health didn’t connect. You can allow access in the Health app under Sharing → Apps → Gymple.');
  };

  return (
    <>
      <SectionTitle>Weekly check-in</SectionTitle>
      <Text style={text.small}>Check-in day</Text>
      <View style={styles.chips}>
        {DAYS.map((d, i) => (
          <Chip key={d} label={d} selected={coach.checkInDay === i} onPress={() => setDay(i)} />
        ))}
      </View>
      <Text style={text.small}>Reminder at 9 am on check-in day</Text>
      <View style={styles.chips}>
        <Chip label="On" selected={coach.reminder} onPress={() => setReminder(true)} />
        <Chip label="Off" selected={!coach.reminder} onPress={() => setReminder(false)} />
      </View>

      <SectionTitle>Apple Health</SectionTitle>
      {availability === 'available' ? (
        coach.healthConnected ? (
          <>
            <View style={styles.connected}>
              <Ionicons name="heart" size={18} color={colors.danger} />
              <Text style={[text.body, { flex: 1 }]}>Connected. Check-ins read weight, body fat, lean mass, steps, sleep and resting heart rate.</Text>
            </View>
            <Text style={text.small}>Save check-in weight and finished workouts to Apple Health</Text>
            <View style={styles.chips}>
              <Chip label="On" selected={coach.saveToHealth} onPress={() => updateCoach({ saveToHealth: true })} />
              <Chip label="Off" selected={!coach.saveToHealth} onPress={() => updateCoach({ saveToHealth: false })} />
            </View>
            <Button title="Review permissions" variant="ghost" size="sm" onPress={connect} style={{ alignSelf: 'flex-start' }} />
          </>
        ) : (
          <>
            <Text style={text.muted}>Pull weight, body fat and lean mass from your smart scale, plus steps, sleep and resting heart rate, into your weekly check-in.</Text>
            <Button title="Connect Apple Health" variant="secondary" onPress={connect} icon={<Ionicons name="heart" size={18} color={colors.danger} />} />
          </>
        )
      ) : availability === 'expo_go' ? (
        <Text style={text.muted}>Apple Health needs the installed Gymple app (a development or App Store build). It isn’t available in Expo Go, but check-ins still work with numbers you type in.</Text>
      ) : (
        <Text style={text.muted}>Apple Health is available on iPhone. On this device, enter your check-in numbers by hand.</Text>
      )}
      {message ? <Text style={[text.small, { color: colors.warning }]}>{message}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  connected: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
});
