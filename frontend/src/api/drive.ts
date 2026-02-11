import { apiGet } from './client';
import type { DriveResponse } from '../types/drive';

export function fetchDriveFiles(limit = 20) {
  return apiGet<DriveResponse>(`/api/drive/files?limit=${limit}`);
}
