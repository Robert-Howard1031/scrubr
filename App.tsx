import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as MediaLibrary from 'expo-media-library';
import { RootStackParamList } from './src/types';
import { StatsProvider } from './src/context/StatsContext';
import { PermissionScreen } from './src/screens/PermissionScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SwipeScreen } from './src/screens/SwipeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { colors } from './src/utils/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

type InitialRoute = 'Permission' | 'Home';

function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);

  useEffect(() => {
    let isActive = true;
    const checkPermissions = async () => {
      const result = await MediaLibrary.getPermissionsAsync();
      const allowed = result.status === 'granted' || result.accessPrivileges === 'limited';
      if (isActive) {
        setInitialRoute(allowed ? 'Home' : 'Permission');
      }
    };
    void checkPermissions();
    return () => {
      isActive = false;
    };
  }, []);

  const navTheme = useMemo<Theme>(() => {
    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.background,
      },
    };
  }, []);

  if (!initialRoute) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Permission" component={PermissionScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Swipe" component={SwipeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatsProvider>
        <AppNavigator />
      </StatsProvider>
    </SafeAreaProvider>
  );
}
