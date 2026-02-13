export interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  title: string | null;
  contactType: string | null;
  companyName: string | null;
  relationshipStrength: number | null;
  lastContactDate: string | null;
  nextFollowupDate: string | null;
  notes: string | null;
  howWeMet: string | null;
  createdAt: string | null;
}

export interface ContactDetail extends Contact {
  updatedAt: string | null;
}

export interface ContactSearchResult {
  id: number;
  name: string;
  companyName: string | null;
  title: string | null;
}
