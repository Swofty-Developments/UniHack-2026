export interface User {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  totalAreaScanned: number;
  territoriesCount: number;
  selectedProfile: string;
  selectedProfiles: string[];
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  totalAreaScanned: number;
  territoriesCount: number;
  rank: number;
}
