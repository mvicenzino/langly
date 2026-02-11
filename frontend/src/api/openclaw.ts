import { apiGet } from './client';
import type { OpenClawStatus, CronJob, MemoryData, WorkspaceFile } from '../types/openclaw';

export function fetchOpenClawStatus() {
  return apiGet<OpenClawStatus>('/api/openclaw/status');
}

export function fetchCronJobs() {
  return apiGet<CronJob[]>('/api/openclaw/cron');
}

export function fetchMemory(limit = 20) {
  return apiGet<MemoryData>(`/api/openclaw/memory?limit=${limit}`);
}

export function fetchWorkspaceFiles() {
  return apiGet<WorkspaceFile[]>('/api/openclaw/workspace');
}
