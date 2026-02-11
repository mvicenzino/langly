import { apiGet } from './client';
import type { Skill } from '../types/skills';

export function fetchSkills() {
  return apiGet<Skill[]>('/api/skills');
}
