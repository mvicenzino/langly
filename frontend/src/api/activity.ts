import { apiGet } from './client';
import type { ActivityEntry } from '../types/activity';

export function fetchActivity(limit = 30) {
  return apiGet<ActivityEntry[]>(`/api/activity?limit=${limit}`);
}
