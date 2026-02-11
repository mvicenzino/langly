export interface ForecastDay {
  date: string;
  maxTempF: number;
  minTempF: number;
  maxTempC: number;
  minTempC: number;
  description: string;
}

export interface WeatherData {
  location: string;
  region: string;
  country: string;
  tempF: number;
  tempC: number;
  feelsLikeF: number;
  feelsLikeC: number;
  humidity: number;
  description: string;
  windSpeedMph: number;
  windDir: string;
  uvIndex: number;
  visibility: number;
  weatherCode: number;
  forecast: ForecastDay[];
  error?: string;
}
