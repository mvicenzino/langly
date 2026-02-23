import { apiGet } from './client';

export interface GitHubRepo {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
  private: boolean;
}

export function fetchRepos() {
  return apiGet<GitHubRepo[]>('/api/github/repos');
}
