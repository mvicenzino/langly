import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { watchlist, locations, addTicker, removeTicker, addLocation, removeLocation } =
    useSettingsStore();
  const [tickerInput, setTickerInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  function handleAddTicker(e: React.FormEvent) {
    e.preventDefault();
    if (tickerInput.trim()) {
      addTicker(tickerInput.trim());
      setTickerInput('');
    }
  }

  function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (locationInput.trim()) {
      addLocation(locationInput.trim());
      setLocationInput('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border border-cyan-500/15 shadow-2xl"
        style={{ background: 'rgba(3, 7, 18, 0.95)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Stock Watchlist */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-400 mb-3">
              Stock Watchlist
            </h3>
            <form onSubmit={handleAddTicker} className="flex gap-2 mb-3">
              <input
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                placeholder="Add ticker (e.g. AAPL)"
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 placeholder-gray-600 font-mono focus:border-emerald-500/40 focus:outline-none"
                maxLength={10}
              />
              <button
                type="submit"
                disabled={!tickerInput.trim()}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-all"
              >
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {watchlist.map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1"
                >
                  <span className="text-xs font-mono text-emerald-400">{t}</span>
                  <button
                    onClick={() => removeTicker(t)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Weather Locations */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-400 mb-3">
              Weather Locations
            </h3>
            <form onSubmit={handleAddLocation} className="flex gap-2 mb-3">
              <input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Add location (e.g. Miami, FL)"
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-amber-500/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!locationInput.trim()}
                className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 transition-all"
              >
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {locations.map((l) => (
                <div
                  key={l}
                  className="flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1"
                >
                  <span className="text-xs text-amber-400">{l}</span>
                  <button
                    onClick={() => removeLocation(l)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* System Info */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-400 mb-3">
              System
            </h3>
            <div className="space-y-2 text-[11px] text-gray-500">
              <div className="flex justify-between">
                <span>Agent Tools</span>
                <span className="text-cyan-400 font-mono">28 tools</span>
              </div>
              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-emerald-400 font-mono">PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span>Backend</span>
                <span className="text-emerald-400 font-mono">Flask + SocketIO</span>
              </div>
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-gray-400 font-mono">0.1.0</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
