import { apiGet } from './client';

export interface ReminderItem {
  uid: string;
  task: string;
  done: boolean;
  due: string;
  priority: number;
  notes: string;
}

interface RemindersResponse {
  configured: boolean;
  items: ReminderItem[];
  error?: string;
}

export async function fetchReminders(): Promise<{ configured: boolean; items: ReminderItem[]; error?: string }> {
  const res = await apiGet<RemindersResponse>('/api/reminders');
  return {
    configured: res.configured,
    items: res.items ?? [],
    error: res.error,
  };
}
