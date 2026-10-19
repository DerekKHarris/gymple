import { Redirect } from 'expo-router';

import { useStore } from '@/store/useStore';

export default function Index() {
  const hasProfile = useStore((s) => !!s.profile);
  const hasProgram = useStore((s) => !!s.program);

  if (!hasProfile) return <Redirect href="/onboarding" />;
  if (!hasProgram) return <Redirect href="/plans" />;
  return <Redirect href="/program" />;
}
