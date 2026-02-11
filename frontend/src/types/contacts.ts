export interface Contact {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  mention_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContactSearchResult {
  id: number;
  name: string;
  company: string;
}

export interface ContactDetail extends Contact {
  mentioned_in: {
    id: number;
    title: string;
    content: string;
    mentioned_at: string;
  }[];
}
