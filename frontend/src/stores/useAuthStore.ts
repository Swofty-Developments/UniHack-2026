import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  userId: string | null;
  displayName: string | null;
  isOnboarded: boolean;
  setUser: (userId: string, displayName: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      displayName: null,
      isOnboarded: false,
      setUser: (userId, displayName) => set({ userId, displayName, isOnboarded: true }),
      clear: () => set({ userId: null, displayName: null, isOnboarded: false }),
    }),
    {
      name: 'accessatlas-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
