import { useState, useEffect, useCallback } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { calendarApi } from '../../api/client';
import type { CalendarEvent, FamilyMember } from '../../types/calendar';

export function CalendarWidget() {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'today' | 'week' | 'month'>('today');

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [todayData, upcomingData, monthData, membersData] = await Promise.all([
        calendarApi.getToday(),
        calendarApi.getUpcoming(7),
        calendarApi.getUpcoming(30),
        calendarApi.getMembers(),
      ]);
      setTodayEvents(todayData);
      setUpcomingEvents(upcomingData);
      setMonthEvents(monthData);
      setMembers(membersData);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load calendar');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatDateHeader = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const events = view === 'today' ? todayEvents : view === 'week' ? upcomingEvents : monthEvents;
  
  // Group events by date for week/month views
  const groupEventsByDate = (evts: CalendarEvent[]) => {
    const grouped: Record<string, CalendarEvent[]> = {};
    evts.forEach((ev) => {
      const dateKey = new Date(ev.startTime).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(ev);
    });
    return grouped;
  };

  const eventsByDate = view !== 'today' ? groupEventsByDate(events) : null;
  const sortedDates = eventsByDate ? Object.keys(eventsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) : [];

  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <WidgetPanel
      title="Family Calendar"
      accentColor="blue"
      insightPrompt="Review my upcoming calendar events. Identify scheduling conflicts, busy periods, and suggest time management improvements."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={() => fetchData()} className="text-gray-600 hover:text-blue-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="p-3 space-y-2">
        {/* View toggle */}
        <div className="flex gap-1 rounded-lg border border-white/5 p-0.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
          <button
            onClick={() => setView('today')}
            className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-all ${
              view === 'today'
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : 'text-gray-600 hover:text-gray-400 border border-transparent'
            }`}
          >
            Today ({todayEvents.length})
          </button>
          <button
            onClick={() => setView('week')}
            className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-all ${
              view === 'week'
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : 'text-gray-600 hover:text-gray-400 border border-transparent'
            }`}
          >
            Week ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setView('month')}
            className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-all ${
              view === 'month'
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : 'text-gray-600 hover:text-gray-400 border border-transparent'
            }`}
          >
            Month ({monthEvents.length})
          </button>
        </div>

        {error && (
          <p className="text-center text-[11px] text-red-400/80 py-2">{error}</p>
        )}

        {/* Events list */}
        <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100% - 60px)' }}>
          {view === 'today' ? (
            // Today view - flat list
            events.map((ev) => {
              const memberNames = ev.memberIds
                .map((id) => memberMap[id]?.name)
                .filter(Boolean);
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
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium ${ev.completed ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                        {ev.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-blue-400/70 font-mono">
                        {formatTime(ev.startTime)}
                      </span>
                      {memberNames.length > 0 && (
                        <span className="text-[10px] text-gray-600">
                          {memberNames.join(', ')}
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-[10px] text-gray-600 mt-0.5 truncate">{ev.description}</p>
                    )}
                  </div>
                  {ev.completed && (
                    <svg className="h-3 w-3 text-emerald-500/60 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              );
            })
          ) : (
            // Week/Month view - grouped by date with headers
            sortedDates.map((dateKey) => (
              <div key={dateKey} className="space-y-1">
                {/* Date header */}
                <div className="sticky top-0 px-2.5 py-1.5 bg-slate-900/60 rounded-md border-l-2 border-blue-400/50">
                  <div className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                    {formatDateHeader(dateKey)}
                  </div>
                </div>
                {/* Events for this date */}
                <div className="space-y-1 pl-2">
                  {eventsByDate![dateKey].map((ev) => {
                    const memberNames = ev.memberIds
                      .map((id) => memberMap[id]?.name)
                      .filter(Boolean);
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
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-medium ${ev.completed ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                              {ev.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-blue-400/70 font-mono">
                              {formatTime(ev.startTime)}
                            </span>
                            {memberNames.length > 0 && (
                              <span className="text-[10px] text-gray-600">
                                {memberNames.join(', ')}
                              </span>
                            )}
                          </div>
                          {ev.description && (
                            <p className="text-[10px] text-gray-600 mt-0.5 truncate">{ev.description}</p>
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
            ))
          )}
        </div>

        {events.length === 0 && !loading && !error && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            {view === 'today' ? 'No events today' : view === 'week' ? 'No upcoming events this week' : 'No events this month'}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[9px] text-gray-700 uppercase tracking-wider">{todayLabel}</span>
          <a
            href="https://calendora.replit.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-blue-500/50 hover:text-blue-400 uppercase tracking-wider transition-colors"
          >
            Kindora
          </a>
        </div>
      </div>
    </WidgetPanel>
  );
}
