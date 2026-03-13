import api from './api';
import { Territory } from '../types/territory';
import { Hazard } from '../types/hazard';

export async function getAll(): Promise<Territory[]> {
  const { data } = await api.get('/territories');
  return data;
}

export async function getById(id: string): Promise<Territory & { hazards: Hazard[] }> {
  const { data } = await api.get(`/territories/${id}`);
  return data;
}

export async function create(territory: {
  name: string;
  description: string;
  buildingType: string;
  polygon: { coordinates: Array<{ latitude: number; longitude: number }> };
  center: { latitude: number; longitude: number };
  userId: string;
}): Promise<Territory> {
  const { data } = await api.post('/territories', territory);
  return data;
}
