import { StyleSheet, Text, View } from 'react-native';

import type { Plan } from '@/lib/types';
import { colors, fonts } from '@/theme';

const LETTERING: Record<string, string[]> = {
  full_body_3: ['FULL', 'BODY', '×3'],
  full_body_2: ['FULL', 'BODY', '×2'],
  upper_lower_4: ['UPPER', 'LOWER'],
  ppl_3: ['PUSH', 'PULL', 'LEGS'],
  ppl_6: ['PUSH', 'PULL', 'LEGS', '×2'],
  push_pull_4: ['PUSH', 'PULL'],
  bro_split_5: ['BODY', 'PART', 'SPLIT'],
  upper_lower_core_5: ['UPPER', 'LOWER', 'ABS'],
  core_3: ['ABS', 'CORE'],
};

/** Big stacked split name, alternating yellow and white, used in place of a cover photo. */
export function PlanLettering({ plan, size = 22 }: { plan: Plan; size?: number }) {
  const lines = LETTERING[plan.id] ?? plan.name.toUpperCase().split(' ').slice(0, 3);
  return (
    <View>
      {lines.map((line, i) => (
        <Text
          key={i}
          style={[styles.line, { fontSize: size, lineHeight: Math.round(size * 1.05), color: i % 2 === 0 ? colors.accent : colors.text }]}
          numberOfLines={1}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { fontFamily: fonts.display, letterSpacing: -0.5 },
});
