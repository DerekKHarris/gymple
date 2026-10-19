import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  loading,
  style,
  icon,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'lg' | 'sm';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  testID?: string;
}) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        v.container,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <View style={styles.buttonInner}>
          {icon}
          <Text style={[styles.buttonText, size === 'sm' && styles.buttonTextSm, v.text]}>{title.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: StyleSheet.create({ container: { backgroundColor: colors.accent }, text: { color: colors.accentText } }),
  secondary: StyleSheet.create({ container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' }, text: { color: colors.text } }),
  ghost: StyleSheet.create({ container: { backgroundColor: 'transparent' }, text: { color: colors.accent } }),
  danger: StyleSheet.create({ container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.danger }, text: { color: colors.danger } }),
};

export function Chip({ label, selected, onPress, style }: { label: string; selected?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed, style]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Card({
  children,
  style,
  onPress,
  highlight,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  highlight?: boolean;
}) {
  const base = [styles.card, highlight && styles.cardHighlight];
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...base, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[...base, style]}>{children}</View>;
}

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const badgeTones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.cardAlt, fg: colors.muted },
  accent: { bg: colors.accent, fg: colors.accentText },
  success: { bg: colors.accentDim, fg: colors.accent },
  warning: { bg: colors.warningBg, fg: colors.warning },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  info: { bg: colors.cardAlt, fg: colors.info },
};

/** Heavy uppercase headline text. */
export function Display({ children, size = 30, color = colors.text, style, numberOfLines }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: fonts.display, fontSize: size, lineHeight: Math.round(size * 1.08), color, textTransform: 'uppercase', letterSpacing: -0.3 }, style]}
    >
      {children}
    </Text>
  );
}

/** Uppercase section heading with an optional yellow value on the right and a divider beneath. */
export function SectionTitle({ children, right }: { children: ReactNode; right?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
    </View>
  );
}

/** A row of segments, `filled` of them lit (fractions allowed), like Ladder's streak bars. */
export function SegmentBar({ total, filled, style, height = 5 }: { total: number; filled: number; style?: StyleProp<ViewStyle>; height?: number }) {
  return (
    <View style={[styles.segments, style]}>
      {Array.from({ length: total }, (_, i) => {
        const amount = Math.max(0, Math.min(1, filled - i));
        return (
          <View key={i} style={[styles.segment, { height, borderRadius: height / 2 }]}>
            {amount > 0 ? <View style={{ width: `${amount * 100}%`, height, borderRadius: height / 2, backgroundColor: colors.accent }} /> : null}
          </View>
        );
      })}
    </View>
  );
}

/** Big number with a small label, for stat rows. */
export function Stat({ value, label, accent, size = 26 }: { value: string; label: string; accent?: boolean; size?: number }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { fontSize: size, lineHeight: 34 }, accent && { color: colors.accent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export const text = StyleSheet.create({
  h1: { color: colors.text, fontSize: 30, lineHeight: 33, fontFamily: fonts.display, textTransform: 'uppercase' },
  h2: { color: colors.text, fontSize: 20, fontWeight: '800' },
  h3: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  accent: { color: colors.accent, fontWeight: '800' },
});

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: radius.pill, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center' },
  buttonSm: { minHeight: 40, paddingHorizontal: space.lg },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  buttonText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  buttonTextSm: { fontSize: 13 },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.75 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.cardAlt },
  chipSelected: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  chipTextSelected: { color: colors.accentText },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1.5, borderColor: 'transparent' },
  cardHighlight: { borderColor: colors.accent },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.lg,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionRight: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  stat: { flex: 1, gap: 2 },
  statValue: { color: colors.text, fontFamily: fonts.display, fontSize: 26 },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
