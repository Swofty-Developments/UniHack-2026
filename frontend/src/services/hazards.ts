import api from './api';
import { Hazard } from '../types/hazard';

export async function getByTerritory(territoryId: string): Promise<Hazard[]> {
  const { data } = await api.get(`/territories/${territoryId}/hazards`);
  return data;
}

export async function getByProfile(territoryId: string, profile: string): Promise<Hazard[]> {
  const { data } = await api.get(`/territories/${territoryId}/hazards/by-profile/${profile}`);
  return data;
}
