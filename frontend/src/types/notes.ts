export interface NoteMention {
  id: number;
  name: string;
  company: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  mentions: NoteMention[];
  created_at: string;
  updated_at: string;
}
