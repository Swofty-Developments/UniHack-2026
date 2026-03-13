import api from './api';
import { AccessibilityProfileId } from '../types/hazard';
import { User } from '../types/user';
import { getPrimaryProfile, normalizeSelectedProfiles } from '../utils/profileSelection';

export async function createUser(
  displayName: string,
  selectedProfiles: AccessibilityProfileId[]
): Promise<User> {
  const normalizedProfiles = normalizeSelectedProfiles(selectedProfiles);
  const { data } = await api.post('/users', {
    displayName,
    selectedProfile: getPrimaryProfile(normalizedProfiles),
    selectedProfiles: normalizedProfiles,
  });
  return data;
}

export async function getUser(userId: string): Promise<User> {
  const { data } = await api.get(`/users/${userId}`);
  return data;
}

export async function updateUserProfile(
  userId: string,
  selectedProfiles: AccessibilityProfileId[]
): Promise<User> {
  const normalizedProfiles = normalizeSelectedProfiles(selectedProfiles);
  const { data } = await api.patch(`/users/${userId}/profile`, {
    selectedProfile: getPrimaryProfile(normalizedProfiles),
    selectedProfiles: normalizedProfiles,
  });
  return data;
}
