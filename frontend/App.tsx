import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';

const darkTheme = {
  dark: true,
  colors: {
    primary: '#2563EB',
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    border: '#334155',
    notification: '#EF4444',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <NavigationContainer theme={darkTheme}>
            <RootNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
