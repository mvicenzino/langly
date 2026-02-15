import { useState, useEffect, useRef, useCallback } from 'react';
import { useTravelStore } from '../../store/travelStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSavedSearches } from '../../hooks/useSavedSearches';
import { searchFlights } from '../../api/travel';
import { WidgetPanel } from '../layout/WidgetPanel';
import type { FlightOffer } from '../../types/travel';

function buildGoogleFlightsUrl(from: string, to: string, depart: string, ret: string, passengers: number): string {
  const base = 'https://www.google.com/travel/flights';
  const searchParams = new URLSearchParams({
    q: `${from} to ${to}`,
    curr: 'USD',
  });
  if (depart) searchParams.set('d1', depart);
  if (ret) searchParams.set('d2', ret);
  if (passengers > 1) searchParams.set('px', String(passengers));
  return `${base}?${searchParams.toString()}`;
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : '';
  const m = match[2] ? `${match[2]}m` : '';
  return `${h} ${m}`.trim() || '0m';
}

function FlightCard({ flight, passengers }: { flight: FlightOffer; passengers: number }) {
  return (
    <div className="rounded-lg border border-white/5 px-3 py-2.5 hover:bg-white/[0.02] hover:border-violet-500/10 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-200">{flight.airlineName}</span>
            {flight.stops === 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/15">
                Nonstop
              </span>
            )}
            {flight.stops > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/70 border border-amber-500/15">
                {flight.stops} stop{flight.stops > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-gray-400">
              {flight.departureTime} &rarr; {flight.arrivalTime}
            </span>
            <span className="text-[10px] text-gray-600">&middot;</span>
            <span className="text-[10px] font-mono text-gray-500">{parseDuration(flight.duration)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-medium text-violet-400">${Math.round(flight.price)}/pp</div>
          {passengers > 1 && (
            <div className="text-[10px] text-gray-500 font-mono">
              ${Math.round(flight.totalPrice)} total
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FlightSearchWidget() {
  const {
    originAirport, destinationAirport, startDate, endDate, passengers, destination,
    flightResults, flightLoading, flightError,
    setFlightResults, setFlightLoading, setFlightError,
  } = useTravelStore();

  const { homeAirport, defaultPassengers } = useSettingsStore();
  const { searches, save, remove } = useSavedSearches('flight');
  const [localFrom, setLocalFrom] = useState(originAirport || homeAirport);
  const [localTo, setLocalTo] = useState(destinationAirport || '');
  const [localDepart, setLocalDepart] = useState(startDate || '');
  const [localReturn, setLocalReturn] = useState(endDate || '');
  const [localPax, setLocalPax] = useState(passengers || defaultPassengers);
  const prevAutoSearch = useRef('');

  // Sync from store → local when store changes (trip selection)
  useEffect(() => {
    setLocalFrom(originAirport || homeAirport);
    setLocalTo(destinationAirport || '');
    setLocalDepart(startDate || '');
    setLocalReturn(endDate || '');
    setLocalPax(passengers || defaultPassengers);
  }, [originAirport, destinationAirport, startDate, endDate, passengers, homeAirport, defaultPassengers]);

  const doSearch = useCallback(async (from: string, to: string, depart: string, ret: string, adults: number) => {
    if (!from || !to || !depart) return;
    setFlightLoading(true);
    setFlightError(null);
    try {
      const result = await searchFlights({
        origin: from,
        destination: to,
        date: depart,
        return: ret || undefined,
        adults,
      });
      setFlightResults(result.flights);
    } catch (e) {
      setFlightError(e instanceof Error ? e.message : 'Flight search failed');
    }
  }, [setFlightLoading, setFlightError, setFlightResults]);

  // Auto-search when store has origin + destination + date
  useEffect(() => {
    const from = originAirport || homeAirport;
    const key = `${from}|${destinationAirport}|${startDate}|${endDate}|${passengers}`;
    if (destinationAirport && startDate && key !== prevAutoSearch.current) {
      prevAutoSearch.current = key;
      doSearch(from, destinationAirport, startDate, endDate, passengers || defaultPassengers);
    }
  }, [originAirport, destinationAirport, startDate, endDate, passengers, homeAirport, defaultPassengers, doSearch]);

  function handleManualSearch() {
    if (!localTo.trim() || !localDepart) return;
    doSearch(localFrom || homeAirport, localTo.trim(), localDepart, localReturn, localPax);
  }

  function openGoogleFlights() {
    const from = localFrom || homeAirport;
    const to = localTo.trim() || 'anywhere';
    const url = buildGoogleFlightsUrl(from, to, localDepart, localReturn, localPax);
    window.open(url, '_blank');
  }

  function handleSave() {
    if (!localTo.trim()) return;
    const url = buildGoogleFlightsUrl(localFrom, localTo.trim(), localDepart, localReturn, localPax);
    save({
      search_type: 'flight',
      label: `${localFrom} → ${localTo.trim()}`,
      destination: localTo.trim(),
      url,
      metadata: { from: localFrom, to: localTo.trim(), depart: localDepart, ret: localReturn, passengers: localPax },
    });
  }

  const hasContext = !!(destinationAirport && startDate);

  const icon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );

  return (
    <WidgetPanel title="Flight Search" accentColor="violet" icon={icon} insightPrompt={`Analyze flight options from ${localFrom || 'EWR'} to ${localTo || 'destination'} for ${passengers} passengers. Compare prices, airlines, and travel times. Recommend the best value flights and optimal booking strategy.`}>
      <div id="flight-search-results" className="p-3 space-y-3">
        {/* Auto-filled indicator */}
        {destination && hasContext && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="h-1 w-1 rounded-full bg-violet-400/60" />
            <span className="text-[10px] text-violet-400/60 font-mono">
              {originAirport || homeAirport} &rarr; {destinationAirport}
            </span>
          </div>
        )}

        {/* Search form */}
        <div className="space-y-1.5">
          <div className="flex gap-2 items-center">
            <input
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value.toUpperCase())}
              placeholder="From"
              maxLength={3}
              className="w-14 rounded border border-violet-500/15 bg-slate-900/60 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-violet-500/40 focus:outline-none transition-all text-center font-mono uppercase"
            />
            <span className="text-gray-600 text-xs">&rarr;</span>
            <input
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value.toUpperCase())}
              placeholder="To"
              maxLength={3}
              className="w-14 rounded border border-violet-500/15 bg-slate-900/60 px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-violet-500/40 focus:outline-none transition-all text-center font-mono uppercase"
            />
            <input
              type="date"
              value={localDepart}
              onChange={(e) => setLocalDepart(e.target.value)}
              className="flex-1 rounded border border-violet-500/15 bg-slate-900/60 px-1.5 py-1 text-[11px] text-gray-400 focus:border-violet-500/40 focus:outline-none transition-all [color-scheme:dark]"
            />
            <input
              type="date"
              value={localReturn}
              onChange={(e) => setLocalReturn(e.target.value)}
              className="flex-1 rounded border border-violet-500/15 bg-slate-900/60 px-1.5 py-1 text-[11px] text-gray-400 focus:border-violet-500/40 focus:outline-none transition-all [color-scheme:dark]"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={9}
                value={localPax}
                onChange={(e) => setLocalPax(Number(e.target.value))}
                className="w-10 rounded border border-violet-500/15 bg-slate-900/60 px-1 py-1 text-[11px] text-gray-400 text-center focus:border-violet-500/40 focus:outline-none transition-all"
                title="Passengers"
              />
              <span className="text-[10px] text-gray-600">pax</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualSearch}
              disabled={!localTo.trim() || !localDepart || flightLoading}
              className="flex-1 rounded border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-500/20 disabled:opacity-30 transition-all"
            >
              {flightLoading ? 'Searching...' : 'Search Flights'}
            </button>
            <button
              onClick={openGoogleFlights}
              disabled={!localTo.trim()}
              className="rounded border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5 text-[10px] text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
              title="Open in Google Flights"
            >
              Google Flights &nearr;
            </button>
            <button
              onClick={handleSave}
              disabled={!localTo.trim()}
              className="rounded border border-violet-500/20 bg-violet-500/5 px-2 py-1.5 text-xs text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/10 disabled:opacity-30 transition-all"
              title="Save search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading */}
        {flightLoading && (
          <div className="flex items-center justify-center py-6 gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
            <span className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">Searching flights...</span>
          </div>
        )}

        {/* Error */}
        {flightError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
            <p className="text-[11px] text-red-400">{flightError}</p>
          </div>
        )}

        {/* Results */}
        {!flightLoading && flightResults.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-gray-600 font-mono">
                {flightResults.length} flight{flightResults.length !== 1 ? 's' : ''} found
              </span>
              <button
                onClick={openGoogleFlights}
                className="text-[9px] text-violet-400/60 hover:text-violet-400 font-mono transition-colors"
              >
                Compare on Google Flights &nearr;
              </button>
            </div>
            {flightResults.map((flight) => (
              <FlightCard key={flight.id} flight={flight} passengers={localPax} />
            ))}
          </div>
        )}

        {/* No results — has context but no data yet (not loading, no error) */}
        {!flightLoading && !flightError && flightResults.length === 0 && hasContext && (
          <div className="rounded-lg border border-violet-500/15 bg-violet-500/[0.04] px-3 py-2.5 text-center">
            <p className="text-[11px] text-gray-400">
              <span className="font-mono text-violet-400/70">{localFrom} &rarr; {localTo}</span>
              {localDepart && <span className="text-gray-600"> &middot; {localDepart}</span>}
              {localReturn && <span className="text-gray-600"> &ndash; {localReturn}</span>}
            </p>
            <button
              onClick={openGoogleFlights}
              className="mt-1.5 text-[10px] text-violet-400/70 hover:text-violet-400 font-mono transition-colors"
            >
              View real-time prices on Google Flights &nearr;
            </button>
          </div>
        )}

        {/* Empty state */}
        {!flightLoading && !flightError && flightResults.length === 0 && !hasContext && (
          <p className="text-center text-[11px] text-gray-600 py-4 uppercase tracking-wider">
            Select a trip or enter airports + dates
          </p>
        )}

        {/* Saved searches */}
        {searches.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] uppercase tracking-wider text-gray-600 font-mono">Saved Searches</div>
            {searches.map((s) => (
              <div key={s.id} className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all hover:bg-white/[0.02]">
                <button
                  onClick={() => window.open(s.url, '_blank')}
                  className="flex items-center gap-2 text-left min-w-0 flex-1"
                >
                  <svg className="h-3 w-3 text-violet-400/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="text-xs text-gray-300 truncate">{s.label}</span>
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="invisible text-gray-700 hover:text-red-400 group-hover:visible ml-2 transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetPanel>
  );
}
