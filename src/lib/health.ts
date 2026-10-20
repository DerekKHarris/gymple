import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { HealthSnapshot, Units } from './types';

/**
 * Apple Health (HealthKit) access. HealthKit needs native code, so it only works in an
 * installed iOS build of Gymple (a development or App Store build), not in Expo Go,
 * on Android or on the web. Everything here degrades to "unavailable" in those cases.
 */

type HealthKit = typeof import('@kingstinct/react-native-healthkit');

let cached: HealthKit | null | undefined;

function healthKit(): HealthKit | null {
  if (cached !== undefined) return cached;
  cached = null;
  if (Platform.OS !== 'ios' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: HealthKit = require('@kingstinct/react-native-healthkit');
    if (mod.isHealthDataAvailable()) cached = mod;
  } catch {
    cached = null;
  }
  return cached;
}

export type HealthAvailability = 'available' | 'expo_go' | 'unsupported';

export function healthAvailability(): HealthAvailability {
  if (Platform.OS !== 'ios') return 'unsupported';
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return 'expo_go';
  return healthKit() ? 'available' : 'unsupported';
}

const READ = [
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierBodyFatPercentage',
  'HKQuantityTypeIdentifierLeanBodyMass',
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKCategoryTypeIdentifierSleepAnalysis',
] as const;

const SHARE = ['HKQuantityTypeIdentifierBodyMass', 'HKQuantityTypeIdentifierBodyFatPercentage', 'HKWorkoutTypeIdentifier'] as const;

/** Shows the Apple Health permission sheet. Returns false if HealthKit isn't available. */
export async function connectHealth(): Promise<boolean> {
  const hk = healthKit();
  if (!hk) return false;
  try {
    await hk.requestAuthorization({ toRead: READ, toShare: SHARE });
    return true;
  } catch {
    return false;
  }
}

const DAY = 24 * 60 * 60 * 1000;
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined);

/** HealthKit reports percentages as fractions (0.185); some sources store 18.5. Normalise to 18.5. */
const asPercent = (value: number) => (value <= 1 ? value * 100 : value);

/** Total hours asleep, merging overlapping samples (iPhone and Apple Watch often both record). */
export function sleepHours(intervals: { start: number; end: number }[]): number {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let total = 0;
  let cursorStart = -Infinity;
  let cursorEnd = -Infinity;
  for (const { start, end } of sorted) {
    if (start > cursorEnd) {
      if (cursorEnd > cursorStart) total += cursorEnd - cursorStart;
      cursorStart = start;
      cursorEnd = end;
    } else {
      cursorEnd = Math.max(cursorEnd, end);
    }
  }
  if (cursorEnd > cursorStart) total += cursorEnd - cursorStart;
  return total / (60 * 60 * 1000);
}

/** Last 7 days of body and recovery data. Missing permissions or data simply leave fields empty. */
export async function readWeeklyHealth(units: Units, now = new Date()): Promise<HealthSnapshot | undefined> {
  const hk = healthKit();
  if (!hk) return undefined;
  const filter = { date: { startDate: new Date(now.getTime() - 7 * DAY), endDate: now } };
  const snapshot: HealthSnapshot = {};

  await Promise.all([
    hk
      .queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', { limit: 0, unit: units, filter, ascending: true })
      .then((samples) => {
        snapshot.weightAvg = average(samples.map((s) => s.quantity));
        snapshot.weightLatest = samples[samples.length - 1]?.quantity;
      })
      .catch(() => {}),
    hk
      .queryQuantitySamples('HKQuantityTypeIdentifierBodyFatPercentage', { limit: 0, unit: '%', filter })
      .then((samples) => {
        snapshot.bodyFat = average(samples.map((s) => asPercent(s.quantity)));
      })
      .catch(() => {}),
    hk
      .queryQuantitySamples('HKQuantityTypeIdentifierLeanBodyMass', { limit: 0, unit: units, filter })
      .then((samples) => {
        snapshot.leanMass = average(samples.map((s) => s.quantity));
      })
      .catch(() => {}),
    hk
      .queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], { filter, unit: 'count' })
      .then((stats) => {
        if (stats.sumQuantity) snapshot.stepsPerDay = stats.sumQuantity.quantity / 7;
      })
      .catch(() => {}),
    hk
      .queryStatisticsForQuantity('HKQuantityTypeIdentifierRestingHeartRate', ['discreteAverage'], { filter, unit: 'count/min' })
      .then((stats) => {
        if (stats.averageQuantity) snapshot.restingHr = stats.averageQuantity.quantity;
      })
      .catch(() => {}),
    hk
      .queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { limit: 0, filter })
      .then((samples) => {
        // 1 asleep (unspecified), 3 core, 4 deep, 5 REM. 0 in bed and 2 awake don't count.
        const asleep = samples.filter((s) => [1, 3, 4, 5].includes(Number(s.value)));
        if (asleep.length) {
          const hours = sleepHours(asleep.map((s) => ({ start: new Date(s.startDate).getTime(), end: new Date(s.endDate).getTime() })));
          const nights = new Set(asleep.map((s) => new Date(new Date(s.endDate).getTime() - 12 * 60 * 60 * 1000).toDateString())).size;
          snapshot.sleepHours = hours / Math.max(1, nights);
        }
      })
      .catch(() => {}),
  ]);

  return Object.values(snapshot).some((v) => v !== undefined) ? snapshot : undefined;
}

/** Writes a check-in's weight (and body fat, if entered) to Apple Health. */
export async function saveBodyMeasurements(units: Units, weight?: number, bodyFat?: number): Promise<void> {
  const hk = healthKit();
  if (!hk) return;
  const now = new Date();
  try {
    if (weight) await hk.saveQuantitySample('HKQuantityTypeIdentifierBodyMass', units, weight, now, now);
    if (bodyFat) await hk.saveQuantitySample('HKQuantityTypeIdentifierBodyFatPercentage', '%', bodyFat / 100, now, now);
  } catch {
    // Permission denied or HealthKit error: the check-in is still saved in Gymple.
  }
}

/** Saves a finished workout to Apple Health as strength training, so it counts toward Activity rings. */
export async function saveStrengthWorkout(start: Date, end: Date): Promise<void> {
  const hk = healthKit();
  if (!hk || end.getTime() - start.getTime() < 60 * 1000) return;
  try {
    const workout = await hk.saveWorkoutSample(hk.WorkoutActivityType.traditionalStrengthTraining, [], start, end);
    workout.dispose?.();
  } catch {
    // Ignore: the workout is still logged in Gymple.
  }
}
