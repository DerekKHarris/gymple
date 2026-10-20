import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isCheckInDue } from '@/lib/coach';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';
import { Button, Display, text } from './ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Program-home card: prompts the weekly check-in when due, otherwise links the last report. */
export function CheckInCard() {
  const router = useRouter();
  const checkIns = useStore((s) => s.checkIns);
  const checkInDay = useStore((s) => s.coach.checkInDay);
  const [now] = useState(() => new Date());
  const last = checkIns[checkIns.length - 1];

  if (isCheckInDue(checkIns, now)) {
    return (
      <View style={styles.due}>
        <View style={styles.dueHead}>
          <Ionicons name="clipboard" size={18} color={colors.accent} />
          <Text style={styles.eyebrow}>{last ? 'WEEKLY CHECK-IN DUE' : 'FIRST CHECK-IN'}</Text>
        </View>
        <Display size={22}>{last ? 'Time to review your week' : 'Set your baseline'}</Display>
        <Text style={text.muted}>
          {last
            ? 'Log your weight and how the week felt. Your coach adjusts next week from it.'
            : 'Log your starting weight. Every week after, you’ll get a coach’s report on your progress.'}
        </Text>
        <Button title="Check in" onPress={() => router.push('/checkin')} size="sm" style={{ alignSelf: 'flex-start', marginTop: space.xs }} testID="start-checkin" />
      </View>
    );
  }

  if (!last) return null;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/checkin/[id]', params: { id: last.id } })}
      style={({ pressed }) => [styles.last, pressed && { opacity: 0.7 }]}
      accessibilityLabel="Last coach's report"
    >
      <Ionicons name="clipboard-outline" size={20} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={text.h3} numberOfLines={1}>
          {last.report.headline}
        </Text>
        <Text style={text.small}>
          Last check-in {new Date(last.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · next on {DAYS[checkInDay]}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  due: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.sm, borderWidth: 1.5, borderColor: colors.accent, borderStyle: 'dashed' },
  dueHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  eyebrow: { color: colors.accent, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  last: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md },
});
