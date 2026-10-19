import { Linking } from 'react-native';

import type { Exercise } from '@/lib/types';

export interface ExerciseVideo {
  url: string;
  title: string;
  channel: string | null;
}

/**
 * Hand-picked YouTube how-to videos, keyed by exercise id. Exercises without an entry
 * fall back to a YouTube search for the exercise's form.
 */
export const EXERCISE_VIDEOS: Partial<Record<string, ExerciseVideo>> = {};

export function videoSearchUrl(exercise: Exercise): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} proper form`)}`;
}

export function videoUrlFor(exercise: Exercise): string {
  return EXERCISE_VIDEOS[exercise.id]?.url ?? videoSearchUrl(exercise);
}

/** Opens the how-to video in the YouTube app if installed, otherwise the browser. */
export function openVideo(exercise: Exercise): void {
  Linking.openURL(videoUrlFor(exercise)).catch(() => {});
}
