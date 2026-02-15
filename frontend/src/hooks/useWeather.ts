import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchWeather } from '../api/weather';
import { useSettingsStore } from '../store/settingsStore';
import { useTravelStore } from '../store/travelStore';
import type { WeatherData } from '../types/weather';

/** Extract city name for weather lookup from destination like "Florida - Fort Myers" → "Fort Myers" */
function extractCity(dest: string): string {
  if (!dest) return '';
  const parts = dest.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1].trim() : dest.trim();
}

export function useWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locations = useSettingsStore((s) => s.locations);
  const travelDestination = useTravelStore((s) => s.destination);

  const travelCity = useMemo(() => extractCity(travelDestination), [travelDestination]);

  // Combine permanent locations with travel destination (deduplicated)
  const allLocations = useMemo(() => {
    const base = [...locations];
    if (travelCity && !base.some((l) => l.toLowerCase() === travelCity.toLowerCase())) {
      base.push(travelCity);
    }
    return base;
  }, [locations, travelCity]);

  const refresh = useCallback(async () => {
    if (allLocations.length === 0) {
      setWeatherData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(allLocations.map(fetchWeather));
      const successful = results
        .filter((r): r is PromiseFulfilledResult<WeatherData> => r.status === 'fulfilled')
        .map((r) => r.value);
      setWeatherData(successful);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [allLocations]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 300000); // 5 min
    return () => clearInterval(interval);
  }, [refresh]);

  return { weatherData, loading, error, refresh, travelCity };
}
