export interface ActivityEntry {
  id: number;
  source: string;
  event_type: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
