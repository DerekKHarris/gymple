import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import type { Exercise } from '@/lib/types';
import { colors, radius } from '@/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function iconFor(exercise: Exercise): IconName {
  if (exercise.primary === 'abs') return 'stomach';
  if (exercise.primary === 'biceps' || exercise.primary === 'triceps') return 'arm-flex';
  switch (exercise.load) {
    case 'barbell':
      return 'weight-lifter';
    case 'dumbbell':
      return 'dumbbell';
    case 'kettlebell':
      return 'kettlebell';
    case 'machine':
    case 'cable':
      return 'weight';
    case 'band':
      return 'jump-rope';
    default:
      return 'human';
  }
}

/** Thumbnail tile standing in for an exercise photo. */
export function ExerciseIcon({ exercise, size = 52 }: { exercise: Exercise; size?: number }) {
  return (
    <LinearGradient colors={['#2A2A30', '#141416']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.tile, { width: size, height: size }]}>
      <MaterialCommunityIcons name={iconFor(exercise)} size={size * 0.5} color={colors.accent} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: colors.accent },
});
