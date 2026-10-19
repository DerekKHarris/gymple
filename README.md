# Gymple

A React Native (Expo) workout tracker with 12-week lifting plans and automatic weight
suggestions. All data is stored on the device.

## What it does

1. **Onboarding** asks for your goal (strength, muscle, fat loss, general fitness),
   experience, days per week, equipment and units.
2. **Plans:** nine 12-week plans modelled on common programs (full body 5×5,
   PHUL upper/lower, push/pull/legs, push/pull, body-part split, upper/lower/abs, core).
   The best matches for your answers are recommended, and every exercise is swapped
   for one your equipment supports.
3. **Program:** browse weeks 1–12 (with deload and test weeks marked) and pick a day.
4. **Workout:** see every exercise with sets × reps. Add, change or delete exercises
   (for today only, or for this day in every later week) and add or remove sets.
5. **Logging:** enter weight and reps for each set and tap ✓. A 2-minute rest timer
   appears (adjustable, and it asks how the set felt).
6. **Progression:** the weight for the next set and for future workouts is worked out
   from everything you've logged, using rules that match your goal. See
   [docs/RESEARCH.md](docs/RESEARCH.md) for the research and the exact rules.
7. **Progress:** estimated 1RM trend, history and totals for each exercise.

## Running it

```sh
npm install
npx expo start        # then press i (iOS), a (Android) or w (web), or scan with Expo Go
```

## Checks

```sh
npm test              # Jest unit tests (progression engine, plans, store)
npm run typecheck     # TypeScript
npm run lint          # ESLint (expo config)
```

## Project layout

```
src/
  app/                 Expo Router screens
    onboarding.tsx     goal / experience / days / equipment / units
    plans/             plan list with recommendations, plan details
    program.tsx        12-week overview and days
    workout/[week]/[day].tsx   the workout logger
    progress.tsx, settings.tsx
  components/          UI building blocks, rest timer, exercise picker, exercise card
  data/                exercise library, plan templates, goal copy
  lib/
    periodization.ts   sets/reps per goal and week, deloads
    progression.ts     weight suggestion engine
    program.ts         plan → program resolution, sessions, history, recommendations
  store/useStore.ts    Zustand store persisted to AsyncStorage
__tests__/             Jest tests
```

## Design

Black and neon-yellow look inspired by the Ladder app: heavy uppercase Archivo Black headlines,
yellow pill buttons, a full-screen rest timer with the next set's weight, and a workout-complete
screen with stats. Tokens live in `src/theme.ts`; shared components in `src/components/ui.tsx`.

## Credits

Exercise data by [RepDB](https://repdb.co): the exercise illustrations in `assets/exercises/` and the
instructions and tips in `src/data/exerciseMedia.ts` come from the
[RepDB free tier](https://github.com/RepDB/exercise-dataset) and may only be used inside this app
(see `assets/exercises/LICENSE.md`). How-to videos link out to YouTube (`docs/EXERCISE_VIDEOS.md`).

## Tech

Expo SDK 58, Expo Router, Zustand with AsyncStorage persistence, expo-linear-gradient,
`@expo-google-fonts/archivo-black`, TypeScript, Jest (`jest-expo`).
