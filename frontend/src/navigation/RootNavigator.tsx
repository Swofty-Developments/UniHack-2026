import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/colors';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import FloatingTabBar from '../components/navigation/FloatingTabBar';

import MapScreen from '../screens/MapScreen';
import ScanScreen from '../screens/ScanScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TerritoryDetailScreen from '../screens/TerritoryDetailScreen';
import ModelViewerScreen from '../screens/ModelViewerScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Campus' }} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan' }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Ranks' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
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
        component={TerritoryDetailScreen}
        options={{ title: 'Territory Details' }}
      />
      <Stack.Screen
        name="ModelViewer"
        component={ModelViewerScreen}
        options={{ title: '3D Model', headerTransparent: true }}
      />
    </Stack.Navigator>
  );
}
