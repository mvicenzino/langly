export interface OpenClawStatus {
  alive: boolean;
  version: string;
  model: string;
  workspace: string;
  maxConcurrent: number;
  channels: string[];
  gatewayMode: string;
  port: number;
}

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  timezone: string;
  lastStatus: string;
  lastRunAt: number | null;
  nextRunAt: number | null;
  lastDurationMs: number | null;
  consecutiveErrors: number;
  channel: string;
  description: string;
}

export interface MemoryData {
  tables: string[];
  entries: Record<string, unknown>[];
}

export interface WorkspaceFile {
  name: string;
  isDir: boolean;
  size: number;
  modified: number;
}
