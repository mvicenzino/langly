import { apiGet } from './client';
import type { WeatherData } from '../types/weather';

export function fetchWeather(location: string) {
  return apiGet<WeatherData>(`/api/weather/${encodeURIComponent(location)}`);
}
