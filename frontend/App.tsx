import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { TRPCProvider } from './src/providers/TRPCProvider';
import RootNavigator from './src/navigation/RootNavigator';

const darkTheme = {
  dark: true,
  colors: {
    primary: '#00D4AA',
    background: '#0B0B14',
    card: '#161625',
    text: '#EEEDF5',
    border: '#2A2A42',
    notification: '#FF4757',
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
          <TRPCProvider>
            <NavigationContainer theme={darkTheme}>
              <RootNavigator />
              <StatusBar style="light" />
            </NavigationContainer>
          </TRPCProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
