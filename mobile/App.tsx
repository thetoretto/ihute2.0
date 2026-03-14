import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { isApiConfigured } from './src/services/api';
import { AuthProvider } from './src/context/AuthContext';
import { RoleProvider } from './src/context/RoleContext';
import { RoleThemeProvider } from './src/context/RoleThemeContext';
import { ResponsiveThemeProvider } from './src/context/ResponsiveThemeContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import StatusBarTheme from './src/components/StatusBarTheme';

function ConfigRequiredScreen() {
  return (
    <View style={styles.configContainer}>
      <Text style={styles.configTitle}>API not configured</Text>
      <Text style={styles.configText}>
        Set EXPO_PUBLIC_API_BASE_URL in mobile/.env{'\n'}
        (e.g. http://localhost:3000 or your PC IP for device).{'\n'}
        Android emulator: http://10.0.2.2:3000
      </Text>
    </View>
  );
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (!isApiConfigured()) {
    return (
      <SafeAreaProvider>
        <ConfigRequiredScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RoleProvider>
          <ResponsiveThemeProvider>
            <ThemeProvider>
              <RoleThemeProvider>
                <StatusBarTheme />
                <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                  <OfflineBanner />
                  <AppNavigator />
                </View>
              </RoleThemeProvider>
            </ThemeProvider>
          </ResponsiveThemeProvider>
        </RoleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  configContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  configText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
