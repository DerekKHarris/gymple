import { getExercise } from '@/data/exercises';
import { exerciseHistory, targetFor, toLoggedSet } from './program';
import { suggestNextSet, type ExerciseLog, type LoggedSet, type Suggestion } from './progression';
import type { Profile, Session } from './types';

/**
 * Suggestions for every set of one exercise in a session, using all sets the user has
 * ever logged for that exercise plus the sets already done earlier in this session.
 */
export function suggestionsForExercise(
  profile: Profile,
  sessions: Record<string, Session>,
  session: Session,
  exerciseIndex: number,
  history: ExerciseLog[] = exerciseHistory(sessions, session.exercises[exerciseIndex].exerciseId, session.id),
  hold = false,
): Suggestion[] {
  const se = session.exercises[exerciseIndex];
  const exercise = getExercise(se.exerciseId);
  return se.sets.map((set, i) => {
    const currentSets = se.sets
      .slice(0, i)
      .map(toLoggedSet)
      .filter((s): s is LoggedSet => s !== null);
    return suggestNextSet({
      goal: profile.goal,
      experience: profile.experience,
      units: profile.units,
      exercise,
      target: targetFor(profile.goal, session.week, se, set),
      history,
      currentSets,
      hold,
    });
  });
}
