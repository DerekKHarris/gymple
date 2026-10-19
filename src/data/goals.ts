import type { Equipment, Experience, Goal } from '@/lib/types';

export const GOALS: { value: Goal; title: string; description: string; detail: string }[] = [
  {
    value: 'strength',
    title: 'Get stronger',
    description: 'Lift heavier on the big lifts',
    detail: 'Heavy sets of 3–5 reps on compound lifts, with weight added every session you hit your reps.',
  },
  {
    value: 'hypertrophy',
    title: 'Build muscle',
    description: 'Gain size and shape',
    detail: 'Moderate weights for 6–15 reps taken close to failure, with total weekly sets climbing over the 12 weeks.',
  },
  {
    value: 'fat_loss',
    title: 'Lose fat & tone up',
    description: 'Keep muscle while leaning out',
    detail: 'Higher-rep work (10–20) that keeps strength and muscle while you eat in a calorie deficit.',
  },
  {
    value: 'general',
    title: 'General fitness',
    description: 'Feel fit, strong and healthy',
    detail: 'Balanced 8–12 rep training, the range recommended for new lifters by the ACSM.',
  },
];

export const EXPERIENCE: { value: Experience; title: string; description: string }[] = [
  { value: 'beginner', title: 'Beginner', description: 'Less than 6 months of consistent lifting' },
  { value: 'intermediate', title: 'Intermediate', description: '6 months to 2 years, comfortable with the main lifts' },
  { value: 'advanced', title: 'Advanced', description: '2+ years of structured training' },
];

export const EQUIPMENT_PRESETS: { id: string; title: string; description: string; equipment: Equipment[] }[] = [
  {
    id: 'full_gym',
    title: 'Full gym',
    description: 'Barbells, racks, dumbbells, cables and machines',
    equipment: ['barbell', 'rack', 'bench', 'dumbbell', 'kettlebell', 'cable', 'machine', 'pullup_bar', 'bands'],
  },
  {
    id: 'home_gym',
    title: 'Home gym',
    description: 'Barbell, rack, bench, dumbbells and a pull-up bar',
    equipment: ['barbell', 'rack', 'bench', 'dumbbell', 'pullup_bar'],
  },
  { id: 'dumbbells', title: 'Dumbbells', description: 'Dumbbells and a bench', equipment: ['dumbbell', 'bench'] },
  { id: 'minimal', title: 'Bodyweight & bands', description: 'Resistance bands and a pull-up bar, or nothing at all', equipment: ['bands', 'pullup_bar'] },
];

export const GOAL_TITLES: Record<Goal, string> = Object.fromEntries(GOALS.map((g) => [g.value, g.title])) as Record<Goal, string>;
