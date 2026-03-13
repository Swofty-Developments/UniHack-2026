import api from './api';
import { LeaderboardEntry } from '../types/user';

export async function getAll(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get('/leaderboard');
  return data;
}

export async function getUser(userId: string): Promise<LeaderboardEntry> {
  const { data } = await api.get(`/leaderboard/${userId}`);
  return data;
}
