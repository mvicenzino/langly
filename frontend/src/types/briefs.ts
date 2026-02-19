export interface BriefNewsItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
  date: string;
  category?: string;
  isHeadline?: boolean;
  score?: number;
  comments?: number;
}

export interface BriefMarketItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isIndex: boolean;
}

export interface BriefWeather {
  location: string;
  region: string;
  tempF: number;
  feelsLikeF: number;
  humidity: number;
  description: string;
  windSpeedMph: number;
  windDir: string;
  forecast: {
    date: string;
    maxTempF: number;
    minTempF: number;
    description: string;
  }[];
}

export interface BriefPipelineEvent {
  title: string;
  date: string;
  type: string;
  company: string;
}

export interface BriefPipeline {
  statusCounts: Record<string, number>;
  upcoming: BriefPipelineEvent[];
  totalActive: number;
}

export interface BriefSection {
  id: string;
  title: string;
  icon: string;
  items?: BriefNewsItem[] | BriefMarketItem[];
  weather?: BriefWeather;
  pipeline?: BriefPipeline;
  error?: string;
}

export interface DailyBriefResponse {
  sections: BriefSection[];
  generatedAt: string;
}
