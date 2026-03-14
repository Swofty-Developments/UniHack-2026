export type RootStackParamList = {
  MainTabs: undefined;
  TerritoryDetail: { territoryId: string };
  TerritoryHazards: { territoryId: string };
  Wayfinding: { territoryId: string };
  Settings: undefined;
  AccessibilityModes: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Discover: undefined;
  Scan: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};
