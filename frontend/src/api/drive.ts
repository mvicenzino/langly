import { apiGet } from './client';
import type { DriveResponse, DriveMultiResponse } from '../types/drive';

export function fetchDriveFiles(limit = 20, folderId?: string, recursive = false) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (folderId) params.set('folder_id', folderId);
  if (recursive) params.set('recursive', 'true');
  return apiGet<DriveResponse>(`/api/drive/files?${params}`);
}

export function fetchDriveMulti(folders: { id: string; label: string }[], limit = 50, recursive = false) {
  const folderStr = folders.map((f) => `${f.id}:${f.label}`).join(',');
  const params = new URLSearchParams({ folders: folderStr, limit: String(limit) });
  if (recursive) params.set('recursive', 'true');
  return apiGet<DriveMultiResponse>(`/api/drive/multi?${params}`);
}
