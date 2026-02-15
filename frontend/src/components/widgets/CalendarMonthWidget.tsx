import { useState, useEffect, useCallback, useMemo } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { calendarApi } from '../../api/client';
import type { CalendarEvent, FamilyMember } from '../../types/calendar';

// ── Calendar math helpers ────────────────────────────────────────────────────

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const gridStart = new Date(year, month, 1 - startDay);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return cells;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildEventMap(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = ev.startTime.slice(0, 10); // "YYYY-MM-DD"
    const list = map.get(key);
    if (list) list.push(ev);
    else map.set(key, [ev]);
  }
  return map;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MAX_DOTS = 3;

// ── Component ────────────────────────────────────────────────────────────────

export function CalendarMonthWidget() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toDateKey(now));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const memberMap = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const eventMap = useMemo(() => buildEventMap(events), [events]);
  const todayKey = toDateKey(now);

  // Fetch events for the visible 42-day grid range
  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const gridStart = grid[0];
      const gridEnd = grid[41];
      const startStr = toDateKey(gridStart);
      const endStr = toDateKey(gridEnd);
      const [evData, memData] = await Promise.all([
        calendarApi.getEvents(startStr, endStr),
        calendarApi.getMembers(),
      ]);
      setEvents(evData);
      setMembers(memData);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load calendar');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [grid]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => fetchEvents(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Navigation
  const goToday = () => {
    const n = new Date();
    setViewYear(n.getFullYear());
    setViewMonth(n.getMonth());
    setSelectedDate(toDateKey(n));
  };
  const goPrev = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return ''; }
  };

  const selectedEvents = selectedDate ? (eventMap.get(selectedDate) || []) : [];
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
  const selectedLabel = selectedDateObj
    ? selectedDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  return (
    <WidgetPanel
      title="Family Calendar"
      accentColor="blue"
      insightPrompt="Analyze my family's monthly schedule. Identify busy periods, scheduling conflicts, and suggest time management improvements."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={() => fetchEvents()} className="text-gray-600 hover:text-blue-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="flex h-full flex-col p-3">
        {/* ── MonthNav ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-semibold text-gray-200 tracking-wide min-w-[150px] text-center">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button onClick={goNext} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 transition-colors"
          >
            Today
          </button>
        </div>

        {error && <p className="text-center text-[11px] text-red-400/80 py-1 mb-1">{error}</p>}

        {/* ── Main area: grid + detail ────────────────────────── */}
        <div className="flex flex-1 gap-3 min-h-0">
          {/* Calendar grid */}
          <div className={`flex flex-col ${selectedDate ? 'flex-[65]' : 'flex-1'} min-w-0`}>
            {/* DayHeaders */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-600 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* MonthGrid — 6 rows × 7 cols */}
            <div className="grid grid-cols-7 flex-1 gap-px" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {grid.map((date, i) => {
                const key = toDateKey(date);
                const isCurrentMonth = date.getMonth() === viewMonth;
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const dayEvents = eventMap.get(key) || [];
                const dotEvents = dayEvents.slice(0, MAX_DOTS);
                const overflow = dayEvents.length - MAX_DOTS;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={`
                      relative flex flex-col items-center py-1.5 rounded-md transition-all text-center min-h-[38px]
                      ${isSelected ? 'border border-blue-500/30 bg-blue-500/5' : 'border border-transparent hover:bg-white/[0.03]'}
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                    `}
                    style={{ background: isSelected ? undefined : 'rgba(15, 23, 42, 0.3)' }}
                  >
                    {/* Day number */}
                    <span
                      className={`
                        text-xs font-medium leading-none
                        ${isToday ? 'bg-blue-500/20 ring-1 ring-blue-500/40 text-blue-300 rounded-full w-6 h-6 flex items-center justify-center' : ''}
                        ${!isToday && isCurrentMonth ? 'text-gray-300' : ''}
                        ${!isToday && !isCurrentMonth ? 'text-gray-700' : ''}
                      `}
                    >
                      {date.getDate()}
                    </span>

                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {dotEvents.map((ev, j) => {
                          const color = ev.memberIds.length > 0
                            ? memberMap[ev.memberIds[0]]?.color || ev.color
                            : ev.color;
                          return (
                            <span
                              key={j}
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: color || '#3B82F6' }}
                            />
                          );
                        })}
                        {overflow > 0 && (
                          <span className="text-[8px] text-gray-500 leading-none ml-0.5">+{overflow}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── DayDetail panel ──────────────────────────────── */}
          {selectedDate && (
            <div className="flex-[35] min-w-0 border-l border-white/5 pl-3 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-300 tracking-wide">{selectedLabel}</span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-0.5 rounded hover:bg-white/5 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {selectedEvents.length === 0 && (
                  <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">No events</p>
                )}
                {selectedEvents.map((ev) => {
                  const memberNames = ev.memberIds.map((id) => memberMap[id]?.name).filter(Boolean);
                  const memberColor = ev.memberIds.length > 0
                    ? memberMap[ev.memberIds[0]]?.color || ev.color
                    : ev.color;

                  return (
                    <div
                      key={ev.id}
                      className="flex items-start gap-2.5 rounded-lg border border-white/5 px-2.5 py-2 transition-all hover:border-blue-500/15"
                      style={{ background: 'rgba(15, 23, 42, 0.4)' }}
                    >
                      <div
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: memberColor || '#3B82F6' }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-medium ${ev.completed ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                          {ev.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-blue-400/70 font-mono">{formatTime(ev.startTime)}</span>
                          {memberNames.length > 0 && (
                            <span className="text-[10px] text-gray-600">{memberNames.join(', ')}</span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                      {ev.completed && (
                        <svg className="h-3 w-3 text-emerald-500/60 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── MemberLegend + footer ───────────────────────────── */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5">
          <div className="flex items-center gap-3 flex-wrap">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">{m.name}</span>
              </div>
            ))}
          </div>
          <a
            href="https://calendora.replit.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-blue-500/50 hover:text-blue-400 uppercase tracking-wider transition-colors shrink-0"
          >
            Kindora
          </a>
        </div>
      </div>
    </WidgetPanel>
  );
}
