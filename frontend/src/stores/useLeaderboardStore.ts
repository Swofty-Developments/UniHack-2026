import { create } from 'zustand';
import { LeaderboardEntry } from '../types/user';
import * as leaderboardApi from '../services/leaderboard';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchLeaderboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await leaderboardApi.getAll();
      set({ entries: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
