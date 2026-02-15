import { useState, useRef, useEffect } from 'react';
import { useTrips } from '../../hooks/useTrips';
import { useTravelStore } from '../../store/travelStore';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { POPULAR_DESTINATIONS, AIRPORTS } from '../../data/travelSuggestions';
import type { Destination, Airport } from '../../data/travelSuggestions';
import type { Trip } from '../../types/travel';

function nightsBetween(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
  const nights = Math.round(ms / 86400000);
  if (nights <= 0) return null;
  return `${nights} night${nights !== 1 ? 's' : ''}`;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  planning: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  booked: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  completed: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
};

const STATUS_ORDER: Trip['status'][] = ['planning', 'booked', 'completed'];

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff === 0) return 'Today!';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days away`;
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'No dates set';
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

export function TripPlannerWidget() {
  const { trips, loading, refresh, create, update, remove } = useTrips();
  const { selectedTripId, selectTrip, clearTrip, setTripContext, hotelResults, flightResults } = useTravelStore();
  const [dest, setDest] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [airport, setAirport] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDest, setEditDest] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editAirport, setEditAirport] = useState('');
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [showAirportSuggestions, setShowAirportSuggestions] = useState(false);
  const [selectedDestIdx, setSelectedDestIdx] = useState(0);
  const [selectedAirportIdx, setSelectedAirportIdx] = useState(0);
  const destRef = useRef<HTMLInputElement>(null);
  const airportRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);
  const editReturnDateRef = useRef<HTMLInputElement>(null);

  // Auto-select first planning trip on initial load
  useEffect(() => {
    if (!loading && trips.length > 0 && !selectedTripId) {
      const planning = trips.find((t) => t.status === 'planning') || trips[0];
      selectTrip(
        planning.id,
        planning.destination,
        planning.start_date || '',
        planning.end_date || '',
        planning.airports || ''
      );
    }
  }, [loading, trips.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredDests: Destination[] = dest.trim().length > 0
    ? POPULAR_DESTINATIONS.filter((d) => d.name.toLowerCase().includes(dest.toLowerCase()))
    : [];

  const filteredAirports: Airport[] = airport.trim().length > 0
    ? AIRPORTS.filter((a) =>
        a.code.toLowerCase().includes(airport.toLowerCase()) ||
        a.name.toLowerCase().includes(airport.toLowerCase())
      )
    : [];

  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // Push to store when destination + both dates are set, show save prompt
  function pushContextIfReady(d: string, s: string, e: string, a: string) {
    if (d.trim() && s && e) {
      setTripContext(d.trim(), s, e, a);
      if (!selectedTripId) setShowSavePrompt(true);
    }
  }

  async function handleSaveTrip() {
    if (dest.trim()) {
      const trip = await create({
        destination: dest.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        airports: airport.toUpperCase() || 'EWR',
      });
      if (trip) {
        selectTrip(trip.id, trip.destination, trip.start_date || '', trip.end_date || '', trip.airports || '');
        setDest('');
        setStartDate('');
        setEndDate('');
        setAirport('');
      }
      setShowSavePrompt(false);
    }
  }

  function selectDestination(d: Destination) {
    setDest(d.name);
    setAirport(d.airport);
    setShowDestSuggestions(false);
    setSelectedDestIdx(0);
    pushContextIfReady(d.name, startDate, endDate, d.airport);
  }

  function selectAirport(a: Airport) {
    setAirport(a.code);
    setShowAirportSuggestions(false);
    setSelectedAirportIdx(0);
  }

  function handleDestKeyDown(e: React.KeyboardEvent) {
    if (!showDestSuggestions || filteredDests.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedDestIdx((i) => Math.min(i + 1, filteredDests.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedDestIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectDestination(filteredDests[selectedDestIdx]);
    } else if (e.key === 'Escape') {
      setShowDestSuggestions(false);
    }
  }

  function handleAirportKeyDown(e: React.KeyboardEvent) {
    if (!showAirportSuggestions || filteredAirports.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedAirportIdx((i) => Math.min(i + 1, filteredAirports.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedAirportIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectAirport(filteredAirports[selectedAirportIdx]);
    } else if (e.key === 'Escape') {
      setShowAirportSuggestions(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (dest.trim()) {
      const trip = await create({
        destination: dest.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        airports: airport.toUpperCase() || 'EWR',
      });
      // Auto-select the newly created trip
      if (trip) {
        selectTrip(
          trip.id,
          trip.destination,
          trip.start_date || '',
          trip.end_date || '',
          trip.airports || ''
        );
      }
      setDest('');
      setStartDate('');
      setEndDate('');
      setAirport('');
      setShowSavePrompt(false);
    }
  }

  function handleSelectTrip(trip: Trip) {
    if (selectedTripId === trip.id) {
      clearTrip();
    } else {
      selectTrip(
        trip.id,
        trip.destination,
        trip.start_date || '',
        trip.end_date || '',
        trip.airports || ''
      );
    }
  }

  function cycleStatus(trip: Trip) {
    const idx = STATUS_ORDER.indexOf(trip.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    update(trip.id, { status: next });
  }

  function startEdit(trip: Trip) {
    setEditingId(trip.id);
    setEditDest(trip.destination);
    setEditStart(trip.start_date || '');
    setEditEnd(trip.end_date || '');
    setEditAirport(trip.airports || '');
  }

  function saveEdit() {
    if (editingId && editDest.trim()) {
      update(editingId, {
        destination: editDest.trim(),
        start_date: editStart || undefined,
        end_date: editEnd || undefined,
        airports: editAirport.toUpperCase() || undefined,
      });
      // Update store if this is the selected trip
      if (editingId === selectedTripId) {
        selectTrip(editingId, editDest.trim(), editStart, editEnd, editAirport.toUpperCase());
      }
      setEditingId(null);
    }
  }

  function handleRemove(tripId: number) {
    remove(tripId);
    if (tripId === selectedTripId) {
      clearTrip();
    }
  }

  async function handleClearAll() {
    for (const trip of trips) {
      await remove(trip.id);
    }
    clearTrip();
  }

  const icon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <WidgetPanel
      title="Trip Planner"
      accentColor="violet"
      insightPrompt="Analyze upcoming travel plans, weather at destinations, and provide travel preparation recommendations."
      icon={icon}
      headerRight={
        loading ? <LoadingSpinner size="sm" /> : (
          <span className="text-[10px] font-mono text-violet-400/60">{trips.length} trips</span>
        )
      }
    >
      <div className="p-3 space-y-2">
        {/* Quick-add form */}
        <form onSubmit={handleAdd} className="space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={destRef}
                value={dest}
                onChange={(e) => { setDest(e.target.value); setShowDestSuggestions(true); setSelectedDestIdx(0); }}
                onFocus={() => { if (dest.trim()) setShowDestSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                onKeyDown={handleDestKeyDown}
                placeholder="Destination..."
                className="w-full rounded border border-violet-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-violet-500/40 focus:outline-none transition-all"
              />
              {showDestSuggestions && filteredDests.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded border border-violet-500/20 bg-slate-900/95 backdrop-blur shadow-lg shadow-black/50">
                  {filteredDests.map((d, idx) => (
                    <button
                      key={d.airport}
                      onMouseDown={(e) => { e.preventDefault(); selectDestination(d); }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                        idx === selectedDestIdx
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-xs truncate">{d.name}</span>
                      <span className="text-[10px] font-mono text-violet-400/50 shrink-0">{d.airport}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="absolute -top-1.5 left-1.5 text-[8px] text-violet-400/40 uppercase tracking-wider">Airport</label>
              <input
                ref={airportRef}
                value={airport}
                onChange={(e) => { setAirport(e.target.value.toUpperCase()); setShowAirportSuggestions(true); setSelectedAirportIdx(0); }}
                onFocus={() => setShowAirportSuggestions(true)}
                onBlur={() => setTimeout(() => setShowAirportSuggestions(false), 200)}
                onKeyDown={handleAirportKeyDown}
                placeholder="LAX"
                maxLength={3}
                title="Destination airport code (e.g. LAX, HNL)"
                className="w-14 rounded border border-violet-500/15 bg-slate-900/60 px-2 pt-2 pb-1 text-xs text-gray-200 placeholder-gray-600 focus:border-violet-500/40 focus:outline-none transition-all text-center font-mono uppercase"
              />
              {showAirportSuggestions && filteredAirports.length > 0 && (
                <div className="absolute right-0 top-full mt-1 z-50 max-h-48 w-52 overflow-y-auto rounded border border-violet-500/20 bg-slate-900/95 backdrop-blur shadow-lg shadow-black/50">
                  {filteredAirports.map((a, idx) => (
                    <button
                      key={a.code}
                      onMouseDown={(e) => { e.preventDefault(); selectAirport(a); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                        idx === selectedAirportIdx
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-[11px] font-mono text-violet-400 shrink-0 w-8">{a.code}</span>
                      <span className="text-xs truncate">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!dest.trim()}
              className="rounded border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs text-violet-400 hover:bg-violet-500/20 disabled:opacity-30 transition-all"
            >
              +
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <label className="absolute -top-1.5 left-1.5 text-[8px] text-violet-400/40 uppercase tracking-wider">Depart</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); returnDateRef.current?.focus(); pushContextIfReady(dest, e.target.value, endDate, airport); }}
                className="w-full rounded border border-violet-500/15 bg-slate-900/60 px-2 pt-2 pb-1 text-[11px] text-gray-400 focus:border-violet-500/40 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
            <div className="relative flex-1">
              <label className="absolute -top-1.5 left-1.5 text-[8px] text-violet-400/40 uppercase tracking-wider">Return</label>
              <input
                ref={returnDateRef}
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => { setEndDate(e.target.value); pushContextIfReady(dest, startDate, e.target.value, airport); }}
                className="w-full rounded border border-violet-500/15 bg-slate-900/60 px-2 pt-2 pb-1 text-[11px] text-gray-400 focus:border-violet-500/40 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </div>
          {nightsBetween(startDate, endDate) && (
            <div className="text-[10px] font-mono text-violet-400/50 px-0.5">{nightsBetween(startDate, endDate)}</div>
          )}
        </form>

        {/* Save prompt */}
        {showSavePrompt && dest.trim() && (
          <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.08] px-3 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-violet-400/80 uppercase tracking-wider">Save this trip?</div>
              <div className="text-xs text-gray-300 truncate">{dest}</div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => setShowSavePrompt(false)}
                className="rounded px-2.5 py-1 text-[10px] text-gray-500 hover:text-gray-300 border border-white/5 hover:bg-white/5 transition-all"
              >
                Skip
              </button>
              <button
                onClick={handleSaveTrip}
                className="rounded px-2.5 py-1 text-[10px] text-violet-300 bg-violet-500/20 border border-violet-500/30 hover:bg-violet-500/30 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Saved trips */}
        {trips.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold mb-1.5 px-0.5">
              Saved Trips
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          {trips.map((trip) => {
            const isSelected = selectedTripId === trip.id;
            return (
              <div
                key={trip.id}
                onClick={() => handleSelectTrip(trip)}
                className={`group rounded-lg border px-3 py-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-violet-500/30 bg-violet-500/[0.06]'
                    : 'border-white/5 hover:bg-white/[0.02] hover:border-violet-500/10'
                }`}
              >
                {editingId === trip.id ? (
                  <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <input
                        value={editDest}
                        onChange={(e) => setEditDest(e.target.value)}
                        className="flex-1 rounded border border-violet-500/20 bg-slate-900/60 px-2 py-1 text-xs text-gray-200 focus:border-violet-500/40 focus:outline-none"
                        autoFocus
                      />
                      <input
                        value={editAirport}
                        onChange={(e) => setEditAirport(e.target.value.toUpperCase())}
                        placeholder="LAX"
                        maxLength={3}
                        title="Destination airport code"
                        className="w-14 rounded border border-violet-500/20 bg-slate-900/60 px-2 py-1 text-xs text-gray-200 focus:border-violet-500/40 focus:outline-none text-center font-mono uppercase"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <label className="absolute -top-1.5 left-1.5 text-[8px] text-violet-400/40 uppercase tracking-wider">Depart</label>
                        <input type="date" value={editStart} onChange={(e) => { setEditStart(e.target.value); editReturnDateRef.current?.focus(); }} className="w-full rounded border border-violet-500/15 bg-slate-900/60 px-2 pt-2 pb-1 text-[11px] text-gray-400 focus:outline-none [color-scheme:dark]" />
                      </div>
                      <div className="relative flex-1">
                        <label className="absolute -top-1.5 left-1.5 text-[8px] text-violet-400/40 uppercase tracking-wider">Return</label>
                        <input ref={editReturnDateRef} type="date" value={editEnd} min={editStart || undefined} onChange={(e) => setEditEnd(e.target.value)} className="w-full rounded border border-violet-500/15 bg-slate-900/60 px-2 pt-2 pb-1 text-[11px] text-gray-400 focus:outline-none [color-scheme:dark]" />
                      </div>
                    </div>
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => setEditingId(null)} className="text-[10px] text-gray-600 hover:text-gray-400">Cancel</button>
                      <button onClick={saveEdit} className="text-[10px] text-violet-400 hover:text-violet-300">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-gray-200 truncate">{trip.destination}</span>
                          {trip.airports && (
                            <span className="text-[9px] font-mono text-violet-400/50">{trip.airports}</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); cycleStatus(trip); }}
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider border ${STATUS_COLORS[trip.status]?.bg} ${STATUS_COLORS[trip.status]?.text} ${STATUS_COLORS[trip.status]?.border}`}
                          >
                            {trip.status}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-500 font-mono">{formatDateRange(trip.start_date, trip.end_date)}</span>
                          {trip.start_date && trip.status !== 'completed' && (
                            <span className="text-[10px] text-violet-400/70 font-mono">{daysUntil(trip.start_date)}</span>
                          )}
                        </div>
                      </div>
                      <div className="invisible group-hover:visible flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(trip); }} className="text-gray-700 hover:text-violet-400 transition-colors">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(trip.id); }} className="text-gray-700 hover:text-red-400 transition-colors">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Trip Analysis Panel */}
        {selectedTripId && (flightResults.length > 0 || hotelResults.length > 0) && (() => {
          const selectedTrip = trips.find((t) => t.id === selectedTripId);
          const nights = selectedTrip ? nightsBetween(selectedTrip.start_date, selectedTrip.end_date) : null;
          const dateRange = selectedTrip ? formatDateRange(selectedTrip.start_date, selectedTrip.end_date) : '';
          const flightPrices = flightResults.map((f) => f.price);
          const flightMin = flightPrices.length ? Math.round(Math.min(...flightPrices)) : 0;
          const flightMax = flightPrices.length ? Math.round(Math.max(...flightPrices)) : 0;
          const hotelPrices = hotelResults.map((h) => h.price);
          const hotelMin = hotelPrices.length ? Math.round(Math.min(...hotelPrices)) : 0;
          const hotelMax = hotelPrices.length ? Math.round(Math.max(...hotelPrices)) : 0;

          return (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] px-3 py-2.5 space-y-1.5">
              <div className="text-[9px] uppercase tracking-wider text-violet-400/60 font-mono">Trip Analysis</div>
              <div className="text-[11px] text-gray-300 font-mono">
                {nights && <span>{nights} · </span>}{dateRange}
              </div>
              {flightResults.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Flights</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    ${flightMin.toLocaleString()}{flightMin !== flightMax ? ` – $${flightMax.toLocaleString()}` : ''}/pp
                  </span>
                </div>
              )}
              {hotelResults.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Hotels</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    ${hotelMin.toLocaleString()}{hotelMin !== hotelMax ? ` – $${hotelMax.toLocaleString()}` : ''}/nt
                  </span>
                </div>
              )}
              <div className="border-t border-violet-500/10 pt-1.5 flex gap-3">
                {flightResults.length > 0 && (
                  <button
                    onClick={() => document.getElementById('flight-search-results')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-[10px] text-violet-400/70 hover:text-violet-400 font-mono transition-colors"
                  >
                    View {flightResults.length} Flight{flightResults.length !== 1 ? 's' : ''} &rarr;
                  </button>
                )}
                {hotelResults.length > 0 && (
                  <button
                    onClick={() => document.getElementById('hotel-search-results')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-[10px] text-violet-400/70 hover:text-violet-400 font-mono transition-colors"
                  >
                    View {hotelResults.length} Hotel{hotelResults.length !== 1 ? 's' : ''} &rarr;
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {trips.length === 0 && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            No trips planned yet
          </p>
        )}

        <div className="flex justify-center gap-3 pt-1">
          <button onClick={refresh} className="text-[10px] uppercase tracking-wider text-gray-700 hover:text-violet-400 transition-colors">
            Sync
          </button>
          {trips.length > 0 && (
            <button onClick={handleClearAll} className="text-[10px] uppercase tracking-wider text-gray-700 hover:text-red-400 transition-colors">
              Clear All
            </button>
          )}
        </div>
      </div>
    </WidgetPanel>
  );
}
