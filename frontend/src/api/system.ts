import { apiGet } from './client';
import type { SystemInfo, RecentFile, RunningService } from '../types/system';

export function fetchSystemInfo() {
  return apiGet<SystemInfo>('/api/system/info');
}

export function fetchRecentFiles() {
  return apiGet<RecentFile[]>('/api/system/files');
}

export function fetchRunningServices() {
  return apiGet<RunningService[]>('/api/system/services');
}
