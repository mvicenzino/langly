export interface StrideApplication {
  id: number;
  status: string;
  dateApplied: string | null;
  excitementLevel: number | null;
  fitScore: number | null;
  jobTitle: string;
  companyName: string;
  location: string | null;
  remoteType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

export interface StridePipeline {
  [status: string]: StrideApplication[];
}

export interface StrideStats {
  activeApplications: number;
  totalApplications: number;
  eventsToday: number;
  interviewRate: number;
  interviewedCount: number;
  responseRate: number;
  contactsNeedFollowup: number;
  appsAwaitingResponse: number;
  staleLeads: number;
  appsThisWeek: number;
  weeklyChange: number;
  byStatus: Record<string, number>;
}

export interface StrideEvent {
  id: number;
  title: string;
  eventType: string | null;
  startTime: string;
  endTime: string | null;
  location: string | null;
  meetingLink: string | null;
  applicationTitle: string | null;
  companyName: string | null;
}
