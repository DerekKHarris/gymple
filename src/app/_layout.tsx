import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHydrated } from '@/store/useStore';
import { colors } from '@/theme';

export default function RootLayout() {
  const hydrated = useHydrated();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {hydrated ? (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="plans/index" options={{ title: 'Choose a plan' }} />
          <Stack.Screen name="plans/[planId]" options={{ title: 'Plan details' }} />
          <Stack.Screen name="program" options={{ title: 'Your program' }} />
          <Stack.Screen name="workout/[week]/[day]" options={{ title: 'Workout' }} />
          <Stack.Screen name="progress" options={{ title: 'Progress' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </SafeAreaProvider>
  );
}
