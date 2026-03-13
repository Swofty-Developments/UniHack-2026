import api from './api';
import { Hazard } from '../types/hazard';
import { CompleteScanRequest, CompleteScanResponse } from '../types/scan';

export interface ScanResult {
  status: string;
  hazards: Hazard[];
  summary: {
    total: number;
    bySeverity: { high: number; medium: number; low: number };
  };
}

export async function analyzeScan(territoryId: string, imageUrls: string[]): Promise<ScanResult> {
  const { data } = await api.post('/scan/analyze', { territoryId, imageUrls });
  return data;
}

export async function completeScan(payload: CompleteScanRequest): Promise<CompleteScanResponse> {
  const { data } = await api.post('/scan/complete', payload);
  return data;
}
