import { useState } from 'react';
import { useWeather } from '../../hooks/useWeather';
import { useSettingsStore } from '../../store/settingsStore';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const WEATHER_ICONS: Record<string, string> = {
  'Sunny': '☀️', 'Clear': '🌙', 'Partly cloudy': '⛅', 'Partly Cloudy': '⛅',
  'Cloudy': '☁️', 'Overcast': '☁️', 'Mist': '🌫️', 'Fog': '🌫️',
  'Light rain': '🌦️', 'Moderate rain': '🌧️', 'Heavy rain': '🌧️',
  'Light snow': '🌨️', 'Moderate snow': '❄️', 'Heavy snow': '❄️',
  'Thunderstorm': '⛈️', 'Patchy rain nearby': '🌦️', 'Patchy rain possible': '🌦️',
  'Light drizzle': '🌦️', 'Clear sky': '☀️', 'Mainly clear': '🌤️',
  'Foggy': '🌫️', 'Rime fog': '🌫️', 'Drizzle': '🌦️', 'Heavy drizzle': '🌦️',
  'Rain': '🌧️', 'Snow': '❄️', 'Snow grains': '❄️',
  'Light showers': '🌦️', 'Showers': '🌧️', 'Heavy showers': '🌧️',
  'Light snow showers': '🌨️', 'Snow showers': '🌨️',
  'Thunderstorm w/ hail': '⛈️', 'Severe thunderstorm': '⛈️',
};

function getIcon(desc: string) {
  return WEATHER_ICONS[desc] || '🌤️';
}

export function WeatherWidget() {
  const { weatherData, loading, refresh, travelCity } = useWeather();
  const { addLocation, removeLocation } = useSettingsStore();
  const [input, setInput] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      addLocation(input.trim());
      setInput('');
    }
  }

  return (
    <WidgetPanel
      title="Weather Intel"
      accentColor="blue"
      insightPrompt="Analyze current weather conditions and forecast. Identify patterns, impacts on travel or outdoor plans, and preparation recommendations."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={refresh} className="text-gray-600 hover:text-blue-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="p-3 space-y-3">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add location..."
            className="flex-1 rounded border border-blue-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-blue-500/40 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 transition-all"
          >
            +
          </button>
        </form>

        {weatherData.map((w) => {
          const isTravelDest = !!(travelCity && w.location.toLowerCase().includes(travelCity.toLowerCase()));
          return (
            <div key={w.location} className="rounded-lg border border-white/5 p-3"
                 style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{w.location}</span>
                    {isTravelDest ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400/70 border border-violet-500/20">
                        Trip
                      </span>
                    ) : (
                      <button
                        onClick={() => removeLocation(w.location)}
                        className="text-gray-700 hover:text-red-400 text-[10px] transition-colors"
                      >
                        x
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-blue-400/60 uppercase tracking-wider">{w.description}</div>
                </div>
                <span className="text-2xl">{getIcon(w.description)}</span>
              </div>
              <div className="mt-2 flex items-end gap-4">
                <span className="text-2xl font-bold text-white font-mono"
                      style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}>
                  {w.tempF}°<span className="text-sm text-gray-400">F</span>
                </span>
                <div className="text-[10px] text-gray-500 space-y-0.5 font-mono">
                  <div>FEELS {w.feelsLikeF}°F</div>
                  <div>HUM {w.humidity}%</div>
                  <div>WIND {w.windSpeedMph}mph {w.windDir}</div>
                </div>
              </div>

              {w.forecast.length > 0 && (
                <div className="mt-2 flex gap-2 border-t border-white/5 pt-2">
                  {w.forecast.map((f) => (
                    <div key={f.date} className="flex-1 text-center">
                      <div className="text-[10px] text-gray-600 uppercase">
                        {new Date(f.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {f.maxTempF}°/{f.minTempF}°
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {weatherData.length === 0 && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            No locations tracked
          </p>
        )}
      </div>
    </WidgetPanel>
  );
}
