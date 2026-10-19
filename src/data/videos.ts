import { Linking } from 'react-native';

import type { Exercise } from '@/lib/types';

export interface ExerciseVideo {
  url: string;
  title: string;
  channel: string | null;
}

/**
 * YouTube how-to videos, keyed by exercise id. Found via web search (Oct 2026); each URL
 * appeared in search results for that exercise. Exercises without an entry, or added
 * later, fall back to a YouTube search for the exercise's form.
 */
export const EXERCISE_VIDEOS: Partial<Record<string, ExerciseVideo>> = {
  back_squat: { url: 'https://www.youtube.com/watch?v=_vNjV8teHW0', title: 'Barbell Back Squat: How To (3 steps to proper form)', channel: null },
  front_squat: { url: 'https://www.youtube.com/watch?v=v-mQm_droHg', title: 'HOW TO FRONT SQUAT: Build Bigger Quads & A Stronger Squat', channel: 'Jeff Nippard' },
  leg_press: { url: 'https://www.youtube.com/watch?v=K5n2vg3oZa4', title: 'How to PROPERLY Leg Press (FIX YOUR FORM NOW)', channel: null },
  hack_squat: { url: 'https://www.youtube.com/watch?v=hglQExHCM9Q', title: 'Hack Squat Machine (Exercise Tutorial + Form Tips)', channel: null },
  goblet_squat: { url: 'https://www.youtube.com/watch?v=zsN2WvklwDk', title: 'Dumbbell Goblet Squat: Correct Form & Common Mistakes', channel: null },
  kb_goblet_squat: { url: 'https://www.youtube.com/watch?v=MWHIs0zxkCU', title: 'How to do a Kettlebell Goblet Squat', channel: null },
  band_squat: { url: 'https://www.youtube.com/watch?v=duP-UZsfOaQ', title: 'How To Do Resistance Band Squat', channel: null },
  bw_squat: { url: 'https://www.youtube.com/watch?v=ZLJBfYF_oO0', title: 'Bodyweight Squat: How To (3 steps to proper form)', channel: null },
  deadlift: { url: 'https://www.youtube.com/watch?v=8luF-t9o1AM', title: 'How to Deadlift (Best Setup) in Five Easy Steps', channel: 'Barbell Logic' },
  rdl: { url: 'https://www.youtube.com/watch?v=Roe2hOnzXf4', title: 'Barbell Romanian Deadlift (Exercise Tutorial + Form Tips)', channel: null },
  db_rdl: { url: 'https://www.youtube.com/watch?v=hQgFixeXdZo', title: 'Dumbbell Romanian (RDL) Deadlift |TECHNIQUE for Beginners', channel: null },
  kb_swing: { url: 'https://www.youtube.com/watch?v=bDCeXbMJVNs', title: 'How To Kettlebell Swing (in 3 minutes)', channel: null },
  kb_deadlift: { url: 'https://www.youtube.com/watch?v=9eVB3V3YFcg', title: 'How to Do a Kettlebell Deadlift (Perfect Form for Beginners)', channel: null },
  band_good_morning: { url: 'https://www.youtube.com/watch?v=fJA39ZOVaEQ', title: 'How To Do Banded Good Mornings', channel: null },
  single_leg_rdl: { url: 'https://www.youtube.com/watch?v=y4SxoMHInr0', title: 'Single-Leg RDL (Bodyweight)', channel: null },
  bulgarian_split_squat: { url: 'https://www.youtube.com/watch?v=Ozv-OPuVw6A', title: 'Dumbbell Bulgarian Split Squat Tutorial', channel: null },
  db_lunge: { url: 'https://www.youtube.com/watch?v=qJ--a4eVsXY', title: 'How To: Dumbbell Walking Lunges', channel: null },
  bb_lunge: { url: 'https://www.youtube.com/watch?v=H31sX4Bkbj4', title: 'Barbell Reverse Lunge (Exercise Library)', channel: null },
  bw_lunge: { url: 'https://www.youtube.com/watch?v=-Nr6dqEvz3Q', title: 'How To Do A Reverse Lunge Correctly', channel: null },
  bw_split_squat: { url: 'https://www.youtube.com/watch?v=REflwhg0jNs', title: 'Bodyweight Split Squat (Exercise Library)', channel: null },
  hip_thrust: { url: 'https://www.youtube.com/watch?v=LM8XHLYJoYs', title: 'Proper Hip Thrust Form', channel: null },
  db_hip_thrust: { url: 'https://www.youtube.com/watch?v=_cZE6a1zw08', title: 'How To Do The Dumbbell Hip Thrust (Tutorial)', channel: null },
  glute_bridge: { url: 'https://www.youtube.com/watch?v=Q_Bpj91Yiis', title: 'Glute Bridge Exercise - The correct way of doing it', channel: null },
  cable_pull_through: { url: 'https://www.youtube.com/watch?v=fbF4_pn_0xc', title: 'How To Do A CABLE PULL THROUGH', channel: null },
  bench_press: { url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', title: 'How To: Barbell Bench Press', channel: null },
  db_bench_press: { url: 'https://www.youtube.com/watch?v=sTYWWaunX8o', title: 'Dumbbell Bench Press: How To (3 steps to proper form)', channel: null },
  machine_chest_press: { url: 'https://www.youtube.com/watch?v=4YpxZXFADmc', title: 'How to Adjust & Use the Chest Press Machine Correctly', channel: null },
  db_floor_press: { url: 'https://www.youtube.com/watch?v=T0Y3OBF1bNI', title: 'How To Do A Dumbbell Floor Press', channel: null },
  band_chest_press: { url: 'https://www.youtube.com/watch?v=8aQL3sguvV8', title: 'Resistance Band Chest Press Tutorial', channel: null },
  push_up: { url: 'https://www.youtube.com/watch?v=zF0jbubK_jU', title: 'How To Do A Push-Up: Proper Form & Technique', channel: null },
  dip: { url: 'https://www.youtube.com/watch?v=U7HeutDqS_w', title: 'How To Do Parallel Bar Dips', channel: null },
  incline_bench: { url: 'https://www.youtube.com/watch?v=kQtx01Qz6s8', title: 'Incline Bench Press: A Simple Tutorial', channel: null },
  incline_db_press: { url: 'https://www.youtube.com/watch?v=awEEyL5zGvU', title: 'How To PROPERLY Dumbbell Incline Press Like A Pro', channel: null },
  incline_machine_press: { url: 'https://www.youtube.com/watch?v=ig0NyNlSce4', title: 'How To: Incline Chest Press (Hammer Strength)', channel: null },
  decline_push_up: { url: 'https://www.youtube.com/watch?v=9yoySai9DuI', title: 'How To Do A Decline Push Up', channel: null },
  ohp: { url: 'https://www.youtube.com/watch?v=nNMR9fRGRjQ', title: 'How to Press: Proper Overhead Press Form (Step-by-Step)', channel: 'Barbell Logic' },
  db_shoulder_press: { url: 'https://www.youtube.com/watch?v=guW_ENwLOMI', title: 'How To Do Dumbbell Shoulder Press Safely', channel: null },
  machine_shoulder_press: { url: 'https://www.youtube.com/shorts/Gkk-6q7Rq-s', title: 'How to Perform the Machine Shoulder Press', channel: null },
  kb_press: { url: 'https://www.youtube.com/watch?v=X-uFqWtjpGI', title: 'How to do a Kettlebell Overhead Press', channel: null },
  band_overhead_press: { url: 'https://www.youtube.com/watch?v=_E94vW5y_Lw', title: 'How to Do the Resistance Band Standing Overhead Press', channel: null },
  pike_push_up: { url: 'https://www.youtube.com/watch?v=CDBKxS-a4qQ', title: 'How to Do Pike Push Ups', channel: null },
  barbell_row: { url: 'https://www.youtube.com/watch?v=RQU8wZPbioA', title: 'How To Barbell Row', channel: 'Alan Thrall (Untamed Strength)' },
  db_row: { url: 'https://www.youtube.com/watch?v=fURsHPHgssI', title: 'Single-Arm Dumbbell Row on a Bench: Perfect Form Tutorial', channel: null },
  chest_supported_row: { url: 'https://www.youtube.com/watch?v=2ByilQ4NaAs', title: 'The PERFECT Chest-Supported Dumbbell Rows', channel: null },
  seated_cable_row: { url: 'https://www.youtube.com/watch?v=f_r95UajQcg', title: 'How to Do a Seated Cable Row', channel: null },
  machine_row: { url: 'https://www.youtube.com/watch?v=HFOZTQ9b5Ko', title: 'Instructional Fitness - Seated Machine Rows', channel: 'Instructional Fitness' },
  kb_row: { url: 'https://www.youtube.com/watch?v=k5BC9d6pR3A', title: 'Kettlebell Row - Proper Form & Technique [4K]', channel: null },
  band_row: { url: 'https://www.youtube.com/watch?v=b8xlsUOIJVc', title: 'How To Do A Proper Resistance Band Row', channel: null },
  towel_row: { url: 'https://www.youtube.com/watch?v=SwaQJctxcGk', title: 'Towel Row', channel: null },
  inverted_row: { url: 'https://www.youtube.com/watch?v=sHeLHRd_nCs', title: 'How to do an Inverted Row with Proper Form', channel: null },
  pull_up: { url: 'https://www.youtube.com/watch?v=sIvJTfGxdFo', title: 'The Official Pull-Up Checklist (AVOID MISTAKES!)', channel: null },
  chin_up: { url: 'https://www.youtube.com/watch?v=r4PGhnfiEdU', title: 'Chin Ups For Bigger Biceps & Back: Step-By-Step Form Tutorial', channel: null },
  lat_pulldown: { url: 'https://www.youtube.com/watch?v=RTNmVfnRitA', title: 'How to Do Lat Pulldowns Correctly', channel: 'Physical Therapy First' },
  machine_pulldown: { url: 'https://www.youtube.com/watch?v=RwEEOEs71OA', title: 'How to do plate loaded lat pulldowns correctly.', channel: null },
  band_pulldown: { url: 'https://www.youtube.com/watch?v=VxCt-KKvzBQ', title: 'Resistance Band Lat Pulldown (At Home): How To', channel: null },
  db_pullover: { url: 'https://www.youtube.com/watch?v=Ydpy886udzo', title: 'How to Perform Dumbbell Pullovers - Chest Exercise', channel: 'Buff Dudes' },
  superman_pull: { url: 'https://www.youtube.com/watch?v=OmgJCA_lzrs', title: 'Prone Y-W-T', channel: null },
  cable_fly: { url: 'https://www.youtube.com/watch?v=XNf6TBErGys', title: 'How to do a Two-Arm Standing Cable Fly', channel: null },
  db_fly: { url: 'https://www.youtube.com/watch?v=rNBSb6OZJfI', title: 'Proper Form For Dumbbell Flyes', channel: null },
  pec_deck: { url: 'https://www.youtube.com/watch?v=hZ0CGRaKwbQ', title: 'Pec Deck / Chest Fly: How To', channel: null },
  band_fly: { url: 'https://www.youtube.com/watch?v=UpyX0O740Gg', title: 'Standing Chest Fly Using Resistance Bands', channel: null },
  wide_push_up: { url: 'https://www.youtube.com/watch?v=Z8nUVpSZAhE', title: 'How To Do A WIDE GRIP PUSH UP', channel: null },
  db_lateral_raise: { url: 'https://www.youtube.com/watch?v=OK1k6NdNo1I', title: 'Dumbbell Lateral Raise - Proper Form', channel: null },
  cable_lateral_raise: { url: 'https://www.youtube.com/watch?v=qghfvzcoS2I', title: 'Cable Lateral Raise (Exercise Library)', channel: null },
  band_lateral_raise: { url: 'https://www.youtube.com/watch?v=gfEyrmxbCbw', title: 'How To: Resistance Band Lateral Raise', channel: null },
  face_pull: { url: 'https://www.youtube.com/watch?v=eQaSpG7aMYQ', title: 'Face Pull - Proper Form & Technique [4K]', channel: null },
  reverse_db_fly: { url: 'https://www.youtube.com/watch?v=dA4iqyTgx5I', title: 'Dumbbell Bent Over Rear Delt Flye', channel: null },
  reverse_pec_deck: { url: 'https://www.youtube.com/watch?v=hmtnyIGgR9A', title: 'How To: Reverse Pec Deck Rear Delt Fly', channel: null },
  band_pull_apart: { url: 'https://www.youtube.com/watch?v=smSSXITNpCI', title: 'How To Do Band Pull Aparts', channel: null },
  prone_t_raise: { url: 'https://www.youtube.com/watch?v=3GJoiYUYwr0', title: 'Prone T Raise', channel: null },
  barbell_curl: { url: 'https://www.youtube.com/watch?v=dDI8ClxRS04', title: 'Barbell Curl - Biceps Exercise - Bodybuilding.com', channel: 'Bodybuilding.com' },
  db_curl: { url: 'https://www.youtube.com/watch?v=nBzLCE-dcRQ', title: 'Dumbbell Biceps Curl (Both Arms & Alternate)', channel: null },
  hammer_curl: { url: 'https://www.youtube.com/watch?v=3nqezx8BEv0', title: 'Dumbbell Hammer Curl - Proper Form & Technique [4K]', channel: null },
  cable_curl: { url: 'https://www.youtube.com/watch?v=pEVXvlVKm80', title: 'Cable Bicep Curl: How To', channel: null },
  kb_curl: { url: 'https://www.youtube.com/watch?v=OfgQrQCLJsk', title: 'How to Do a Bicep Curl With a Kettlebell', channel: null },
  band_curl: { url: 'https://www.youtube.com/watch?v=RyWX9e7imhc', title: 'How to Do Bicep Curls with Resistance Bands', channel: null },
  towel_curl: { url: 'https://www.youtube.com/watch?v=p8z4fhUWhP4', title: 'How to Train the Biceps Without Weights - Towel Bicep Curls', channel: null },
  triceps_pushdown: { url: 'https://www.youtube.com/watch?v=nMqQNGo4Jtg', title: 'HOW TO DO A TRICEP PUSHDOWN', channel: null },
  skull_crusher: { url: 'https://www.youtube.com/watch?v=GaK2da6B2zM', title: 'EZ Bar Skull Crushers: How To', channel: null },
  db_overhead_ext: { url: 'https://www.youtube.com/watch?v=IJ6J7EKprsc', title: 'Two-Arm Overhead Triceps Extension with Dumbbells Tutorial', channel: null },
  band_pushdown: { url: 'https://www.youtube.com/watch?v=qjPN6ElNqpc', title: 'How To Do Banded Tricep Pushdowns', channel: null },
  bench_dip: { url: 'https://www.youtube.com/watch?v=zcHaDdf4sEM', title: 'How to do a triceps dip on a bench', channel: null },
  diamond_push_up: { url: 'https://www.youtube.com/watch?v=_4EGPVJuqfA', title: 'Diamond Push-Ups Tutorial (with correct form)', channel: null },
  leg_extension: { url: 'https://www.youtube.com/watch?v=ljO4jkwv8wQ', title: 'How To Do Leg Extensions With Perfect Technique (Grow Every Quad Head)', channel: null },
  band_leg_ext: { url: 'https://www.youtube.com/watch?v=W9OeRJbsTro', title: 'Resistance Band Leg Extension - Do Seated Leg Extensions with Bands!', channel: null },
  wall_sit: { url: 'https://www.youtube.com/watch?v=JaZNYM3zAP0', title: 'How To Do a Wall Sit', channel: null },
  leg_curl: { url: 'https://www.youtube.com/watch?v=SbSNUXPRkc8', title: 'How To Do A Lying Leg Curl (Prone Leg Curl)', channel: null },
  cable_leg_curl: { url: 'https://www.youtube.com/watch?v=e4Q0yVoqYew', title: 'Cable Single Leg Curl Tutorial', channel: null },
  db_leg_curl: { url: 'https://www.youtube.com/watch?v=ZHlBSI6JPsA', title: 'How to: Lying Leg Curl With a Dumbbell at Home', channel: null },
  band_leg_curl: { url: 'https://www.youtube.com/watch?v=Bm4vc7n8Rsw', title: 'How To Do Lying Leg Curls with Resistance Bands At Home! Best Resistance Bands Exercises For Legs!', channel: null },
  slider_leg_curl: { url: 'https://www.youtube.com/watch?v=HAQpsaX3s2o', title: 'Slider Hamstring Curls (How To!)', channel: null },
  standing_calf_raise: { url: 'https://www.youtube.com/watch?v=yYBAQGtpIyM', title: 'How To: Standing Machine Calf Raise', channel: null },
  db_calf_raise: { url: 'https://www.youtube.com/watch?v=wxwY7GXxL4k', title: 'Standing Dumbbell Calf Raises - Calf Exercise - Bodybuilding.com', channel: 'Bodybuilding.com' },
  bw_calf_raise: { url: 'https://www.youtube.com/watch?v=IphGZ8OlfYg', title: 'How To Do A Single Leg Calf Raise', channel: null },
  hanging_leg_raise: { url: 'https://www.youtube.com/watch?v=Nw0LOKe3_l8', title: 'Hanging Leg Raise - Ab Exercise - Bodybuilding.com', channel: 'Bodybuilding.com' },
  cable_crunch: { url: 'https://www.youtube.com/watch?v=ToJeyhydUxU', title: 'Cable Crunch: Do It Right!', channel: null },
  ab_crunch_machine: { url: 'https://www.youtube.com/watch?v=JSBuaT1tHfM', title: 'Ab Crunch Machine - Core / Abs - Bodybuilding.com', channel: 'Bodybuilding.com' },
  db_crunch: { url: 'https://www.youtube.com/watch?v=9qaHEqgHH1E', title: 'Weighted Crunch with Weight Plate', channel: null },
  reverse_crunch: { url: 'https://www.youtube.com/watch?v=nYcE7-Dhpzk', title: 'Reverse Crunch: How To (3 steps to proper form)', channel: null },
  crunch: { url: 'https://www.youtube.com/watch?v=M6yAoJJQvGY', title: 'How to Do a Crunch Correctly, Ab Exercise, Fit How To', channel: null },
  lying_leg_raise: { url: 'https://www.youtube.com/watch?v=xJJu-WiROM8', title: 'How To Perform The Lying Leg Raise Exercise', channel: null },
  plank: { url: 'https://www.youtube.com/watch?v=6LqqeBtFn9M', title: 'How to do the perfect PLANK: technique and common mistakes', channel: null },
  side_plank: { url: 'https://www.youtube.com/watch?v=oaJ15vYERoU', title: 'How to Do a Side Plank Correctly (For Beginners)', channel: null },
  dead_bug: { url: 'https://www.youtube.com/watch?v=-gRN_JyVTLY', title: 'How To Do The Dead Bug Correctly', channel: null },
  ab_wheel: { url: 'https://www.youtube.com/watch?v=NbudTqiwguk', title: 'Ab Wheel Rollout - Proper Form & Technique', channel: null },
  suitcase_carry: { url: 'https://www.youtube.com/watch?v=y-hn_Ha1-RE', title: 'How To Perform The Suitcase Carry', channel: null },
  pallof_press: { url: 'https://www.youtube.com/watch?v=h66babJLO74', title: 'How To Do the Cable Pallof Press Correctly', channel: null },
  band_pallof_press: { url: 'https://www.youtube.com/watch?v=lqPrSGXfL1Q', title: 'How To: Resistance Band Pallof Press', channel: null },
  cable_woodchop: { url: 'https://www.youtube.com/watch?v=yPvAj_X_5NM', title: 'How To Do a Cable Wood Chop', channel: null },
  russian_twist: { url: 'https://www.youtube.com/watch?v=jjyR6Z1U4dA', title: 'Russian Twist - Proper Form & Technique', channel: null },
  bicycle_crunch: { url: 'https://www.youtube.com/watch?v=kDPxFoCmb-w', title: 'Bicycle Crunch Tutorial', channel: null },
};

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
