import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/colors';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import FloatingTabBar from '../components/navigation/FloatingTabBar';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

import MapScreen from '../screens/MapScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ScanScreen from '../screens/ScanScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TerritoryDetailScreen from '../screens/TerritoryDetailScreen';
import TerritoryHazardsScreen from '../screens/TerritoryHazardsScreen';
import WayfindingScreen from '../screens/WayfindingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccessibilityModesScreen from '../screens/AccessibilityModesScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function withErrorBoundary(Screen: React.ComponentType, title: string) {
  return function WrappedScreen(props: any) {
    return (
      <ErrorBoundary fallbackTitle={title}>
        <Screen {...props} />
      </ErrorBoundary>
    );
  };
}

const SafeMapScreen = withErrorBoundary(MapScreen, 'Map failed to load');
const SafeDiscoverScreen = withErrorBoundary(DiscoverScreen, 'Discover failed to load');
const SafeScanScreen = withErrorBoundary(ScanScreen, 'Scanner failed to load');
const SafeLeaderboardScreen = withErrorBoundary(LeaderboardScreen, 'Leaderboard failed to load');
const SafeProfileScreen = withErrorBoundary(ProfileScreen, 'Profile failed to load');
const SafeTerritoryDetailScreen = withErrorBoundary(TerritoryDetailScreen, 'Territory details failed to load');
const SafeTerritoryHazardsScreen = withErrorBoundary(TerritoryHazardsScreen, 'Hazards failed to load');
const SafeWayfindingScreen = withErrorBoundary(WayfindingScreen, 'Wayfinding failed to load');
const SafeSettingsScreen = withErrorBoundary(SettingsScreen, 'Settings failed to load');
const SafeAccessibilityModesScreen = withErrorBoundary(AccessibilityModesScreen, 'Modes failed to load');
const SafeOnboardingScreen = withErrorBoundary(OnboardingScreen, 'Onboarding failed to load');

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Map" component={SafeMapScreen} options={{ title: 'Map' }} />
      <Tab.Screen name="Discover" component={SafeDiscoverScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Scan" component={SafeScanScreen} options={{ title: 'Scan' }} />
      <Tab.Screen name="Leaderboard" component={SafeLeaderboardScreen} options={{ title: 'Ranks' }} />
      <Tab.Screen name="Profile" component={SafeProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="TerritoryDetail"
        component={SafeTerritoryDetailScreen}
        options={{ title: 'Territory' }}
      />
      <Stack.Screen
        name="TerritoryHazards"
        component={SafeTerritoryHazardsScreen}
        options={{ title: 'Hazards' }}
      />
      <Stack.Screen
        name="Wayfinding"
        component={SafeWayfindingScreen}
        options={{ title: 'Wayfinding', headerTransparent: true }}
      />
      <Stack.Screen
        name="Settings"
        component={SafeSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="AccessibilityModes"
        component={SafeAccessibilityModesScreen}
        options={{ title: 'Accessibility Modes' }}
      />
      <Stack.Screen
        name="Onboarding"
        component={SafeOnboardingScreen}
        options={{ title: 'Get Started', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
