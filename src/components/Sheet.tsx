import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space } from '@/theme';
import { Button, text } from './ui';

export function Sheet({ visible, onClose, children, title }: { visible: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <View style={styles.handle} />
          {title ? <Text style={[text.h2, styles.title]}>{title}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** iOS can't present a modal while another is still animating out, so wait for the dismissal. */
export function afterModalClose(fn: () => void) {
  if (Platform.OS === 'ios') setTimeout(fn, 400);
  else fn();
}

export interface Choice {
  label: string;
  description?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}

/** Cross-platform replacement for a multi-button Alert (Alert buttons don't work on web). */
export function ChoiceSheet({
  visible,
  title,
  message,
  choices,
  onClose,
}: {
  visible: boolean;
  title: string;
  message?: string;
  choices: Choice[];
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {message ? <Text style={[text.muted, styles.message]}>{message}</Text> : null}
      <View style={styles.choices}>
        {choices.map((c) => (
          <View key={c.label}>
            <Button
              title={c.label}
              variant={c.variant ?? 'secondary'}
              onPress={() => {
                onClose();
                afterModalClose(c.onPress);
              }}
            />
            {c.description ? <Text style={[text.small, styles.choiceDesc]}>{c.description}</Text> : null}
          </View>
        ))}
        <Button title="Cancel" variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg + 8,
    borderTopRightRadius: radius.lg + 8,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: space.md },
  title: { marginBottom: space.sm },
  message: { marginBottom: space.md },
  choices: { gap: space.sm },
  choiceDesc: { marginTop: 4, marginBottom: 4, textAlign: 'center' },
});
