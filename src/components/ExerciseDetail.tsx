import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EQUIPMENT_LABELS, MUSCLE_LABELS, PATTERN_LABELS } from '@/data/exercises';
import { EXERCISE_MEDIA } from '@/data/exerciseMedia';
import { openVideo } from '@/data/videos';
import type { Exercise } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { ExerciseIcon } from './ExerciseIcon';
import { Button, Display, SectionTitle, text } from './ui';

function Pose({ source, label }: { source: ImageSourcePropType; label: string }) {
  return (
    <View style={styles.pose}>
      <Image source={source} style={styles.poseImage} resizeMode="cover" accessibilityLabel={`${label} position`} />
      <Text style={styles.poseLabel}>{label}</Text>
    </View>
  );
}

/** Full-screen how-to for one exercise: illustrations, steps, tips and the video link. */
export function ExerciseDetail({ exercise, visible, onClose }: { exercise: Exercise; visible: boolean; onClose: () => void }) {
  const media = EXERCISE_MEDIA[exercise.id];
  const needs = exercise.equipment.length ? exercise.equipment.map((e) => EQUIPMENT_LABELS[e]).join(' · ') : 'No equipment';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {MUSCLE_LABELS[exercise.primary].toUpperCase()} · {PATTERN_LABELS[exercise.pattern].toUpperCase()}
          </Text>
          <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={8} style={styles.close}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Display size={28}>{exercise.name}</Display>
          <Text style={text.muted}>{needs}</Text>

          {media?.start && media.peak ? (
            <View style={styles.poses}>
              <Pose source={media.start} label="START" />
              <Pose source={media.peak} label="FINISH" />
            </View>
          ) : media?.main ? (
            <View style={styles.poses}>
              <Pose source={media.main} label="HOLD" />
            </View>
          ) : (
            <View style={styles.noImage}>
              <ExerciseIcon exercise={exercise} size={72} />
              <Text style={[text.small, { flex: 1 }]}>No illustration for this one yet. The video below shows the movement.</Text>
            </View>
          )}

          <Button title="Watch how-to video" variant="secondary" icon={<Ionicons name="logo-youtube" size={18} color={colors.text} />} onPress={() => openVideo(exercise)} />

          {media?.instructions.length ? (
            <>
              <SectionTitle right={`${media.instructions.length} steps`}>How to</SectionTitle>
              {media.instructions.map((step, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[text.body, { flex: 1 }]}>{step}</Text>
                </View>
              ))}
            </>
          ) : null}

          {media?.tips.length || exercise.cue ? (
            <>
              <SectionTitle>Tips</SectionTitle>
              {[...(exercise.cue ? [exercise.cue] : []), ...(media?.tips ?? [])].map((tip, i) => (
                <View key={i} style={styles.step}>
                  <Ionicons name="flash" size={16} color={colors.accent} style={{ marginTop: 2 }} />
                  <Text style={[text.body, { flex: 1 }]}>{tip}</Text>
                </View>
              ))}
            </>
          ) : null}

          {media ? (
            <Pressable onPress={() => Linking.openURL('https://repdb.co').catch(() => {})} accessibilityRole="link">
              <Text style={styles.credit}>
                Exercise data by <Text style={{ color: colors.accent }}>RepDB (repdb.co)</Text>
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.md },
  eyebrow: { color: colors.accent, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  poses: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  pose: { flex: 1, aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#DAF1FD', borderBottomWidth: 3, borderBottomColor: colors.accent },
  poseImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  poseLabel: { position: 'absolute', top: space.sm, left: space.sm, backgroundColor: colors.accent, color: colors.accentText, fontWeight: '900', fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  noImage: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.accentText, fontWeight: '900', fontSize: 13 },
  credit: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: space.lg },
});
