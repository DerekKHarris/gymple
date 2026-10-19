import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle, text } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { exerciseHistory } from '@/lib/program';
import { estimateOneRepMax, type ExerciseLog } from '@/lib/progression';
import { useStore } from '@/store/useStore';
import { colors, radius, space } from '@/theme';

interface ExerciseStats {
  id: string;
  name: string;
  logs: ExerciseLog[];
  points: number[];
  best: number;
  first: number;
  bestReps: number;
  loaded: boolean;
}

const round = (n: number) => Math.round(n * 10) / 10;

function Bars({ points }: { points: number[] }) {
  const recent = points.slice(-12);
  const max = Math.max(...recent, 1);
  const min = Math.min(...recent);
  const floor = min * 0.85;
  return (
    <View style={styles.bars}>
      {recent.map((p, i) => (
        <View key={i} style={[styles.bar, { height: `${Math.max(8, ((p - floor) / (max - floor || 1)) * 100)}%` }, i === recent.length - 1 && styles.barLast]} />
      ))}
    </View>
  );
}

export default function ProgressScreen() {
  const sessions = useStore((s) => s.sessions);
  const profile = useStore((s) => s.profile);
  const [open, setOpen] = useState<string | null>(null);

  const { stats, workouts, totalSets, volume } = useMemo(() => {
    const ids = new Set<string>();
    let totalSets = 0;
    let volume = 0;
    let workouts = 0;
    for (const s of Object.values(sessions)) {
      if (s.completedAt) workouts++;
      for (const e of s.exercises) {
        for (const set of e.sets) {
          if (!set.done) continue;
          ids.add(e.exerciseId);
          totalSets++;
          volume += (set.weight ?? 0) * (set.reps ?? 0);
        }
      }
    }
    const stats: ExerciseStats[] = [...ids].map((id) => {
      const logs = exerciseHistory(sessions, id);
      const loaded = logs.some((l) => l.sets.some((s) => s.weight > 0));
      const points = logs.map((l) =>
        loaded ? Math.max(...l.sets.map((s) => estimateOneRepMax(s.weight, s.reps))) : Math.max(...l.sets.map((s) => s.reps)),
      );
      return {
        id,
        name: getExercise(id).name,
        logs,
        points,
        best: Math.max(...points),
        first: points[0],
        bestReps: Math.max(...logs.flatMap((l) => l.sets.map((s) => s.reps))),
        loaded,
      };
    });
    stats.sort((a, b) => b.logs.length - a.logs.length || a.name.localeCompare(b.name));
    return { stats, workouts, totalSets, volume: Math.round(volume) };
  }, [sessions]);

  if (!profile) return null;
  const u = profile.units;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileNum}>{workouts}</Text>
            <Text style={text.small}>workouts</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileNum}>{totalSets}</Text>
            <Text style={text.small}>sets logged</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileNum}>{volume >= 10000 ? `${round(volume / 1000)}k` : volume}</Text>
            <Text style={text.small}>{u} lifted</Text>
          </View>
        </View>

        <SectionTitle>Exercises</SectionTitle>
        {stats.length === 0 ? (
          <Card>
            <Text style={text.muted}>Log your first set and your progress will show up here.</Text>
          </Card>
        ) : null}
        {stats.map((s) => {
          const change = s.first ? ((s.points[s.points.length - 1] - s.first) / s.first) * 100 : 0;
          const expanded = open === s.id;
          return (
            <Card key={s.id} onPress={() => setOpen(expanded ? null : s.id)} style={{ gap: space.sm }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={text.h3}>{s.name}</Text>
                  <Text style={text.small}>
                    {s.loaded ? `Best est. 1RM ${round(s.best)} ${u}` : `Best ${s.bestReps} ${getExercise(s.id).timed ? 'sec' : 'reps'}`} · {s.logs.length} session
                    {s.logs.length === 1 ? '' : 's'}
                  </Text>
                </View>
                {s.points.length > 1 ? (
                  <Text style={[styles.change, { color: change >= 0 ? colors.success : colors.warning }]}>
                    {change >= 0 ? '+' : ''}
                    {round(change)}%
                  </Text>
                ) : null}
              </View>
              {s.points.length > 1 ? <Bars points={s.points} /> : null}
              {expanded ? (
                <View style={styles.history}>
                  {[...s.logs].reverse().slice(0, 10).map((log) => (
                    <View key={log.sessionId} style={styles.logRow}>
                      <Text style={[text.small, { width: 70 }]}>{log.date ? new Date(log.date).toLocaleDateString() : ''}</Text>
                      <Text style={[text.small, { flex: 1, color: colors.text }]}>
                        {log.sets.map((set) => (set.weight ? `${round(set.weight)}×${set.reps}` : `${set.reps}`)).join('  ')}
                      </Text>
                      {log.isDeload ? <Text style={[text.small, { color: colors.info }]}>deload</Text> : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}
        <Text style={[text.small, { textAlign: 'center', marginTop: space.md }]}>Estimated 1RM uses the Epley formula: weight × (1 + reps ÷ 30).</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, alignItems: 'center' },
  tileNum: { color: colors.accent, fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  change: { fontWeight: '800', fontSize: 16 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 48 },
  bar: { flex: 1, backgroundColor: colors.border, borderRadius: 3 },
  barLast: { backgroundColor: colors.accent },
  history: { gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: space.sm },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
