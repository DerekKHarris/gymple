# Research behind Gymple's plans and progression

This document records the programs and guidelines the app's plans, rep schemes and
weight suggestions are based on, and where each one shows up in the code.

## Programs included

| Plan in the app | Modelled on | Days | Who it suits |
| --- | --- | --- | --- |
| Full Body 3-Day | StrongLifts 5×5 / Starting Strength | 3 | Beginners, strength |
| Minimalist Full Body 2-Day | ACSM "each muscle group 2×/week" guidance | 2 | Busy lifters, general fitness, fat loss |
| Upper / Lower 4-Day | PHUL (Power Hypertrophy Upper Lower, Brandon Campbell) | 4 | Intermediates, strength + size |
| Push / Pull / Legs 3-Day | Classic PPL | 3 | Beginners–intermediates, muscle |
| Push / Pull / Legs 6-Day | High-frequency PPL rotation | 6 | Intermediates–advanced, muscle |
| Push / Pull 4-Day | Anterior/posterior "powerbuilding" split | 4 | All levels |
| Body Part Split 5-Day | Traditional bodybuilding "bro split" | 5 | Intermediates–advanced, muscle |
| Upper / Lower / Abs 5-Day | Upper/lower split plus a dedicated core day | 5 | Balanced training with extra core focus |
| Abs & Core 3-Day | Anti-movement core training (flexion, anti-extension, anti-rotation, carries) | 3 | Anyone; works with no equipment |

Plan templates live in `src/data/plans.ts`. Each slot names a movement pattern and a
list of preferred exercises; `resolveSlot` in `src/lib/program.ts` picks the first one
the user has equipment for, falling back to any exercise with the same pattern.

## Rep schemes by goal (`src/lib/periodization.ts`)

The ACSM position stand on progression models in resistance training (2009) recommends:

- **Novices / general fitness:** loads of about 8–12 repetition maximum (RM).
- **Strength (intermediate/advanced):** a wider 1–12 RM range, periodized, with emphasis
  shifting to heavy 1–6 RM loads, and 3–5 minutes of rest between heavy sets.
- **Muscular endurance:** light-to-moderate loads for higher reps with short rest.
- **Progression:** add 2–10% load when you can do 1–2 reps more than the target.

For hypertrophy, a 2017 meta-analysis by Schoenfeld et al. found muscle growth is similar
across a wide range of loads when sets are taken close to failure, while maximal strength
favours heavier loads. The app therefore uses 6–15 reps for muscle-building and keeps
heavier sets for the strength goal.

| Goal | Main lifts (weeks 1–3 / 5–7 / 9–11) | Accessories |
| --- | --- | --- |
| Get stronger | 5×5 → 4×4 → 5×3, week 12 is a 1–3 rep test | 3×8–10 → 3×6–8 |
| Build muscle | 3×8–10 → 4×6–8 → 4×8–10 | 3×10–12 → 4×12–15 |
| Lose fat & tone up | 3×10–12 → 3×8–10 → 4×10–12 | 3×12–15 → 3×15–20 |
| General fitness | 3×8–10 → 3×6–8 → 3×8–10 | 3×10–12 |

Each block also sets a reps-in-reserve (RIR) target that tightens through the 12 weeks.

### Deloads

The 12 weeks are three 4-week blocks: three hard weeks then a lighter week (one fewer set,
about 90% of working weight). The controlled evidence suggests periodic deloads don't hurt
strength or muscle gains; the "every 4–6 weeks" interval comes mainly from coaching
practice rather than a trial. For the strength goal, week 12 is a test week instead.

### Rest

The rest timer defaults to 2 minutes, as requested. Settings offers 1–4 minutes, with a
note that research supports 2–5 minutes for heavy compound lifts.

## Weight suggestions (`src/lib/progression.ts`)

Every suggestion uses all sets the user has ever logged for that exercise, across plans.

- **Strength goal: linear progression.** If every set hit the target, add weight next
  session (+10 lb / 5 kg for a beginner's squat, deadlift or leg press; +5 lb / 2.5 kg
  otherwise). If reps were missed, repeat the weight. After **three consecutive stalled
  sessions**, reset 10% and build back. This is the StrongLifts / Starting Strength rule.
- **Other goals: double progression.** Keep the weight and add reps until every set reaches
  the top of the range, then add weight and drop back to the bottom of the range. Two
  sessions in a row below the range triggers a 10% drop.
- **Within a session:** if a set's reps go 2+ over the target, or the user rates it "Easy"
  at the top of the range, the next set goes up one step. Missing the minimum drops the
  next set 5% per missed rep (capped at 15%). A set rated "Failed" also drops the next set.
- **New rep range (block change or test week):** the weight is recalculated from the best
  recent estimated one-rep max (Epley: `1RM = weight × (1 + reps/30)`), aiming for the
  block's reps-in-reserve.
- **Deload weeks:** 90% of the current working weight.
- **Bodyweight moves:** progress by reps (or seconds for holds). Once every set reaches the
  top of the range, the app suggests adding load, and logged added weight then progresses
  like any loaded lift.
- **Rounding:** suggestions round to real jumps (5 lb / 2.5 kg plates, 5 lb / 2 kg
  dumbbells, 4 kg kettlebells) and never go below an empty bar.

Effort ratings ("Easy / Good / Hard / Failed") are optional and asked during the rest timer.
Mostly-easy sessions earn a double increment next time.

## Weekly check-in coach (`src/lib/coach.ts`)

| Goal | Healthy weekly body-weight change | Coach's response when outside it |
| --- | --- | --- |
| Lose fat | −0.5 to −1% of body weight | Faster: eat ~100–200 kcal more to protect muscle. Flat: trim ~200 kcal or add ~2,000 steps. |
| Build muscle | +0.25 to +0.5% | Faster than ~0.75%: ease back ~150 kcal (mostly fat). Flat: add ~200 kcal. |
| Get stronger | −0.25 to +0.5% | Losing more than 0.5%: eat at least maintenance. |
| General fitness | within ±0.5% | Flags bigger swings. |

- Garthe et al. (2011) found athletes losing ~0.7% of body weight a week kept or gained lean mass,
  while ~1.4% a week did not; Helms et al. (2014) recommend 0.5–1% a week for lifters cutting.
- Iraki et al. (2019) suggest gaining roughly 0.25–0.5% of body weight a week in a muscle-building phase.
- **Body composition:** with a smart scale's body fat % or lean mass, each week's change is split into
  fat mass and lean mass. Losing lean mass on a cut, or gaining mostly fat on a bulk, triggers advice
  (protein 1.6–2.2 g/kg, slower rate). Bioimpedance scales are noisy, so Apple Health's 7-day
  averages are preferred over single readings.
- **Recovery:** two or more of short sleep (< 6.5 h from Apple Health or a poor rating), low energy,
  heavy soreness or high stress hold weight increases for 7 days (the progression engine repeats
  weights instead of adding them), unless the next week is already a deload. Sleep target 7–9 h.
- **Consistency:** workouts done vs planned in the last 7 days; new estimated 1RM bests and
  week-over-week volume are reported as wins.
- Advice is capped at three actions a week so it stays doable.

Check-in sources:
- Garthe et al. (2011), weight-loss rate and body composition in athletes:
  https://www.sponet.de/sponet/Record/4017680
- Helms, Aragon & Fitschen (2014), evidence-based recommendations for natural bodybuilding contest
  preparation, and Helms on protein: https://mennohenselmans.com/eric-helms-protein/
- Iraki et al. (2019), nutrition recommendations for bodybuilders in the off-season (Sports, 7(7):154).

## Sources

- ACSM Position Stand, *Progression Models in Resistance Training for Healthy Adults* (2009):
  https://www.sportgeneeskunde.com/wp-content/uploads/ACSM-Position-Stand-Progression-Models-in-Resistance-Training-for-Healthy-Adults.pdf
- ExRx summary of ACSM guidelines: https://exrx.net/WeightTraining/Guidelines.html
- PHUL program outline: https://liftvault.com/wp-content/uploads/2019/08/phul-workout-program-routine.pdf
- PHUL vs PPL comparison: https://powerliftingtechnique.com/phul-vs-ppl/
- StrongLifts 5×5 progression and deload rule (third-party summaries):
  https://www.boostcamp.app/users/JYFbC3-stronglifts-5x5-assistance-work,
  https://startingstrength.com/resources/forum/general-programming/24517-5x5-deload.html
- Double vs linear progression: https://rippedbody.com/progression/,
  https://www.boostcamp.app/blogs/weight-training-progression-methods-guide
- Rep ranges and hypertrophy (Schoenfeld et al. 2017, PMID 28834797), summarised at
  https://biolayne.com/reps/issue-9/reps-vs-load-for-hypertrophy/
- Deload and reps-in-reserve studies: https://clinicaltrials.gov/study/NCT06825052,
  https://pmc.ncbi.nlm.nih.gov/articles/PMC10161210/
