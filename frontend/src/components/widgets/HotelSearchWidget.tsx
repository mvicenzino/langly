import { useState, useEffect, useRef, useCallback } from 'react';
import { useTravelStore } from '../../store/travelStore';
import { useSavedSearches } from '../../hooks/useSavedSearches';
import { searchHotels } from '../../api/travel';
import { WidgetPanel } from '../layout/WidgetPanel';
import type { HotelOffer } from '../../types/travel';

type SortKey = 'price' | 'rating' | 'stars';

function buildGoogleHotelsUrl(dest: string, checkIn: string, checkOut: string, guests: number, rooms: number): string {
  const params = new URLSearchParams({ q: dest, curr: 'USD' });
  if (checkIn) params.set('d1', checkIn);
  if (checkOut) params.set('d2', checkOut);
  if (guests > 1) params.set('px', String(guests));
  if (rooms > 1) params.set('rooms', String(rooms));
  return `https://www.google.com/travel/hotels?${params.toString()}`;
}

function buildBookingUrl(dest: string, checkIn: string, checkOut: string, guests: number, rooms: number): string {
  const params = new URLSearchParams({ ss: dest });
  if (checkIn) params.set('checkin', checkIn);
  if (checkOut) params.set('checkout', checkOut);
  params.set('group_adults', String(guests));
  params.set('no_rooms', String(rooms));
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

function StarRating({ stars }: { stars: number }) {
  if (!stars) return null;
  return (
    <span className="text-[10px] text-amber-400/80">
      {'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 5 - stars))}
    </span>
  );
}

function HotelCard({ hotel }: { hotel: HotelOffer }) {
  return (
    <div className="rounded-lg border border-white/5 px-3 py-2.5 hover:bg-white/[0.02] hover:border-violet-500/10 transition-all">
      <div className="flex gap-2.5">
        {hotel.thumbnailUrl && (
          <img
            src={hotel.thumbnailUrl}
            alt={hotel.name}
            className="h-14 w-14 rounded object-cover shrink-0 bg-slate-800"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-200 truncate">{hotel.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StarRating stars={hotel.stars} />
                {hotel.rating > 0 && (
                  <span className="text-[10px] font-mono text-emerald-400/70">{hotel.rating}</span>
                )}
                {hotel.reviews > 0 && (
                  <span className="text-[10px] text-gray-600 font-mono">({hotel.reviews.toLocaleString()})</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-medium text-violet-400">${Math.round(hotel.price)}/nt</div>
              {hotel.totalPrice > hotel.price && (
                <div className="text-[10px] text-gray-500 font-mono">
                  {hotel.totalPriceFormatted} total
                </div>
              )}
            </div>
          </div>
          {hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {hotel.amenities.map((a, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/8 text-violet-400/60 border border-violet-500/10">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HotelSearchWidget() {
  const {
    destination, startDate, endDate, passengers, selectedTripId,
    hotelResults, hotelLoading, hotelError,
    setHotelResults, setHotelLoading, setHotelError,
  } = useTravelStore();
  const { searches, save, remove } = useSavedSearches('hotel');
  const [dest, setDest] = useState(destination || '');
  const [checkIn, setCheckIn] = useState(startDate || '');
  const [checkOut, setCheckOut] = useState(endDate || '');
  const [guests, setGuests] = useState(passengers || 3);
  const [rooms, setRooms] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>('price');
  const prevAutoSearch = useRef('');

  // Sync from travel store when trip selection changes
  useEffect(() => {
    if (destination) setDest(destination);
    if (startDate) setCheckIn(startDate);
    if (endDate) setCheckOut(endDate);
    if (passengers) setGuests(passengers);
  }, [destination, startDate, endDate, passengers]);

  const doSearch = useCallback(async (searchDest: string, ci: string, co: string, adults: number) => {
    if (!searchDest.trim() || !ci || !co) return;
    setHotelLoading(true);
    setHotelError(null);
    try {
      const result = await searchHotels({
        destination: searchDest.trim(),
        check_in: ci,
        check_out: co,
        adults,
      });
      setHotelResults(result.hotels);
    } catch (e) {
      setHotelError(e instanceof Error ? e.message : 'Hotel search failed');
    }
  }, [setHotelLoading, setHotelError, setHotelResults]);

  // Auto-search when store has destination + dates
  useEffect(() => {
    const key = `${destination}|${startDate}|${endDate}|${passengers}`;
    if (destination && startDate && endDate && key !== prevAutoSearch.current) {
      prevAutoSearch.current = key;
      doSearch(destination, startDate, endDate, passengers);
    }
  }, [destination, startDate, endDate, passengers, doSearch]);

  function handleManualSearch() {
    if (!dest.trim()) return;
    doSearch(dest, checkIn, checkOut, guests);
  }

  function handleGoogleSearch() {
    if (!dest.trim()) return;
    window.open(buildGoogleHotelsUrl(dest.trim(), checkIn, checkOut, guests, rooms), '_blank');
  }

  function handleBookingSearch() {
    if (!dest.trim()) return;
    window.open(buildBookingUrl(dest.trim(), checkIn, checkOut, guests, rooms), '_blank');
  }

  function handleSave() {
    if (!dest.trim()) return;
    save({
      search_type: 'hotel',
      label: dest.trim(),
      destination: dest.trim(),
      url: buildGoogleHotelsUrl(dest.trim(), checkIn, checkOut, guests, rooms),
      metadata: { destination: dest.trim(), checkIn, checkOut, guests, rooms },
    });
  }

  // Sort results
  const sorted = [...hotelResults].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (b.stars || 0) - (a.stars || 0);
  });

  const icon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  return (
    <WidgetPanel
      title="Hotel Search"
      accentColor="violet"
      icon={icon}
      insightPrompt="Analyze hotel options for my trip. Compare prices, ratings, locations, and amenities. Recommend the best value hotels and suggest the ideal area to stay."
      headerRight={
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="bg-transparent border-none text-[10px] text-violet-400/60 font-mono focus:outline-none cursor-pointer [color-scheme:dark]"
        >
          <option value="price">Cheapest</option>
          <option value="rating">Top Rated</option>
          <option value="stars">Most Stars</option>
        </select>
      }
    >
      <div id="hotel-search-results" className="p-3 space-y-3">
        {/* Auto-filled indicator */}
        {selectedTripId && destination && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="h-1 w-1 rounded-full bg-violet-400/60" />
            <span className="text-[10px] text-violet-400/60 font-mono">From: {destination}</span>
          </div>
        )}

        {/* Search form */}
        <div className="space-y-1.5">
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            placeholder="Destination..."
            className="w-full rounded border border-violet-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-violet-500/40 focus:outline-none transition-all"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="flex-1 rounded border border-violet-500/15 bg-slate-900/60 px-2 py-1 text-[11px] text-gray-400 focus:border-violet-500/40 focus:outline-none transition-all [color-scheme:dark]"
              title="Check-in"
            />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="flex-1 rounded border border-violet-500/15 bg-slate-900/60 px-2 py-1 text-[11px] text-gray-400 focus:border-violet-500/40 focus:outline-none transition-all [color-scheme:dark]"
              title="Check-out"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-[10px] text-gray-600">Guests</span>
              <input
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-12 rounded border border-violet-500/15 bg-slate-900/60 px-2 py-1 text-[11px] text-gray-400 text-center focus:border-violet-500/40 focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-[10px] text-gray-600">Rooms</span>
              <input
                type="number"
                min={1}
                max={10}
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-12 rounded border border-violet-500/15 bg-slate-900/60 px-2 py-1 text-[11px] text-gray-400 text-center focus:border-violet-500/40 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualSearch}
              disabled={!dest.trim() || !checkIn || !checkOut || hotelLoading}
              className="flex-1 rounded border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-500/20 disabled:opacity-30 transition-all"
            >
              {hotelLoading ? 'Searching...' : 'Search Hotels'}
            </button>
            <button
              onClick={handleGoogleSearch}
              disabled={!dest.trim()}
              className="rounded border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5 text-[10px] text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
              title="Open in Google Hotels"
            >
              Google Hotels ↗
            </button>
            <button
              onClick={handleBookingSearch}
              disabled={!dest.trim()}
              className="rounded border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5 text-[10px] text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
              title="Open in Booking.com"
            >
              Booking ↗
            </button>
            <button
              onClick={handleSave}
              disabled={!dest.trim()}
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
        {hotelLoading && (
          <div className="flex items-center justify-center py-6 gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
            <span className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">Searching hotels...</span>
          </div>
        )}

        {/* Error */}
        {hotelError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
            <p className="text-[11px] text-red-400">{hotelError}</p>
          </div>
        )}

        {/* Results */}
        {!hotelLoading && sorted.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[9px] uppercase tracking-wider text-gray-600 font-mono">
              {sorted.length} hotel{sorted.length !== 1 ? 's' : ''} found
            </div>
            {sorted.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}

        {/* No results */}
        {!hotelLoading && !hotelError && hotelResults.length === 0 && destination && startDate && endDate && (
          <p className="text-center text-[11px] text-gray-600 py-4 uppercase tracking-wider">
            No hotels found for this search
          </p>
        )}

        {/* Empty state */}
        {!hotelLoading && !hotelError && hotelResults.length === 0 && (!destination || !startDate || !endDate) && (
          <p className="text-center text-[11px] text-gray-600 py-4 uppercase tracking-wider">
            Select a trip or enter destination + dates to search
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
