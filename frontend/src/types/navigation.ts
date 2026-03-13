export type RootStackParamList = {
  MainTabs: undefined;
  TerritoryDetail: { territoryId: string };
  ModelViewer: { territoryId: string; modelUrl: string };
};

export type MainTabParamList = {
  Map: undefined;
  Scan: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};
