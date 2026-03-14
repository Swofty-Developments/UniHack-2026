import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  userId: string | null;
  displayName: string | null;
  email: string | null;
  token: string | null;
  isOnboarded: boolean;
  setUser: (user: { userId: string; displayName: string; email: string; token: string }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      displayName: null,
      email: null,
      token: null,
      isOnboarded: false,
      setUser: ({ userId, displayName, email, token }) =>
        set({ userId, displayName, email, token, isOnboarded: true }),
      clear: () =>
        set({ userId: null, displayName: null, email: null, token: null, isOnboarded: false }),
    }),
    {
      name: 'accessatlas-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
