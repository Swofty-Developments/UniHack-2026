import { create } from 'zustand';
import { Territory } from '../types/territory';
import { Hazard } from '../types/hazard';
import * as territoriesApi from '../services/territories';

interface TerritoryState {
  territories: Territory[];
  selectedTerritory: (Territory & { hazards: Hazard[] }) | null;
  isLoading: boolean;
  error: string | null;
  fetchTerritories: () => Promise<void>;
  selectTerritory: (id: string) => Promise<void>;
  addTerritory: (territory: Territory) => void;
  clearSelection: () => void;
}

export const useTerritoryStore = create<TerritoryState>((set) => ({
  territories: [],
  selectedTerritory: null,
  isLoading: false,
  error: null,

  fetchTerritories: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await territoriesApi.getAll();
      set({ territories: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  selectTerritory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await territoriesApi.getById(id);
      set({ selectedTerritory: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addTerritory: (territory) => {
    set((state) => ({ territories: [...state.territories, territory] }));
  },

  clearSelection: () => {
    set({ selectedTerritory: null });
  },
}));
