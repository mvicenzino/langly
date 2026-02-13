export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  memberIds: string[];
  color: string;
  completed: boolean;
  noteCount: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface CalendarMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  memberId: string;
  isActive: boolean;
}

export interface CareDocument {
  id: string;
  title: string;
  category: string;
  memberId: string;
  fileUrl: string;
  createdAt: string;
}
