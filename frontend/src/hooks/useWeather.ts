import { useState, useEffect, useCallback } from 'react';
import { fetchWeather } from '../api/weather';
import { useSettingsStore } from '../store/settingsStore';
import type { WeatherData } from '../types/weather';

export function useWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locations = useSettingsStore((s) => s.locations);

  const refresh = useCallback(async () => {
    if (locations.length === 0) {
      setWeatherData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(locations.map(fetchWeather));
      setWeatherData(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [locations]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 300000); // 5 min
    return () => clearInterval(interval);
  }, [refresh]);

  return { weatherData, loading, error, refresh };
}
