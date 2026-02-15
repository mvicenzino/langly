export interface ContentCalendarItem {
  id: number;
  batch_id: string;
  platform: 'newsletter' | 'linkedin' | 'twitter';
  scheduled_date: string;
  week_number: number;
  title: string;
  body: string;
  hashtags: string;
  status: 'draft' | 'scheduled' | 'published';
  notes: string;
  published_url: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialStatus {
  linkedin: { configured: boolean; connected: boolean };
  twitter: { configured: boolean; connected: boolean };
}

export interface ContentBatch {
  batch_id: string;
  start_date: string;
  end_date: string;
  item_count: number;
  created_at: string;
}

export interface GenerateResult {
  batch_id: string;
  count: number;
  items: ContentCalendarItem[];
}
