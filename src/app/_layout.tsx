import { ArchivoBlack_400Regular, useFonts } from '@expo-google-fonts/archivo-black';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useReminderRouting } from '@/lib/useReminderRouting';
import { useHydrated } from '@/store/useStore';
import { colors, fonts } from '@/theme';

export default function RootLayout() {
  const hydrated = useHydrated();
  const [fontsLoaded, fontError] = useFonts({ ArchivoBlack_400Regular });
  const ready = hydrated && (fontsLoaded || !!fontError);
  useReminderRouting(ready);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {ready ? (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: fonts.display, fontSize: 15 },
            headerTitleAlign: 'center',
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="plans/index" options={{ title: 'PLANS' }} />
          <Stack.Screen name="plans/[planId]" options={{ title: 'PLAN' }} />
          <Stack.Screen name="program" options={{ headerShown: false }} />
          <Stack.Screen name="workout/[week]/[day]" options={{ title: 'WORKOUT' }} />
          <Stack.Screen name="progress" options={{ title: 'PROGRESS' }} />
          <Stack.Screen name="settings" options={{ title: 'SETTINGS' }} />
          <Stack.Screen name="checkin/index" options={{ title: 'WEEKLY CHECK-IN' }} />
          <Stack.Screen name="checkin/[id]" options={{ title: "COACH'S REPORT" }} />
        </Stack>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </SafeAreaProvider>
  );
}
