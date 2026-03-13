import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityProfileId } from '../types/hazard';
import {
  DEFAULT_SELECTED_PROFILES,
  getPrimaryProfile,
  normalizeSelectedProfiles,
} from '../utils/profileSelection';

interface ProfileState {
  selectedProfiles: AccessibilityProfileId[];
  selectedProfile: AccessibilityProfileId;
  setProfiles: (profiles: AccessibilityProfileId[]) => void;
  resetProfiles: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      selectedProfiles: DEFAULT_SELECTED_PROFILES,
      selectedProfile: DEFAULT_SELECTED_PROFILES[0],
      setProfiles: (profiles) => {
        const nextProfiles = normalizeSelectedProfiles(profiles);
        set({
          selectedProfiles: nextProfiles,
          selectedProfile: getPrimaryProfile(nextProfiles),
        });
      },
      resetProfiles: () =>
        set({
          selectedProfiles: DEFAULT_SELECTED_PROFILES,
          selectedProfile: DEFAULT_SELECTED_PROFILES[0],
        }),
    }),
    {
      name: 'accessatlas-profile',
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => {
        const state = (persistedState || {}) as Partial<ProfileState> & {
          selectedProfile?: AccessibilityProfileId;
        };
        const nextProfiles = normalizeSelectedProfiles(
          state.selectedProfiles && state.selectedProfiles.length > 0
            ? state.selectedProfiles
            : state.selectedProfile
              ? [state.selectedProfile]
              : undefined
        );
        return {
          ...state,
          selectedProfiles: nextProfiles,
          selectedProfile: getPrimaryProfile(nextProfiles),
        };
      },
    }
  )
);
