import { useEffect, useRef } from 'react';
import { useTravelStore } from '../../store/travelStore';
import { useTravelInsights } from '../../hooks/useTravelInsights';
import { WidgetPanel } from '../layout/WidgetPanel';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

/** Friendly labels for agent tool names */
const TOOL_LABELS: Record<string, string> = {
  Search: 'Searching the web',
  Weather: 'Checking weather',
  Wikipedia: 'Looking up destination info',
  Calculator: 'Calculating costs',
  WebScraper: 'Reading travel sites',
  GetDateTime: 'Checking dates',
};

function toolLabel(tool: string, input: string): string {
  const base = TOOL_LABELS[tool] || `Using ${tool}`;
  // Try to extract a readable snippet from the input
  const short = input.length > 60 ? input.slice(0, 57) + '...' : input;
  return `${base}: ${short}`;
}

export function TravelInsightsWidget() {
  const {
    destination, startDate, endDate, passengers,
    originAirport, destinationAirport,
    flightResults, hotelResults, selectedTripId,
    insightRequestedAt,
  } = useTravelStore();

  const {
    content, isLoading, error, toolCalls, thinkingSteps,
    requestInsights, clear,
  } = useTravelInsights();

  const contentRef = useRef<HTMLDivElement>(null);
  const lastRequestRef = useRef<number>(0);

  const hasTrip = !!(destination && startDate && endDate);
  const hasResults = flightResults.length > 0 || hotelResults.length > 0;

  function handleGenerate() {
    requestInsights({
      destination,
      startDate,
      endDate,
      passengers,
      originAirport,
      destinationAirport,
      flights: flightResults,
      hotels: hotelResults,
    });
  }

  // Listen for external trigger (TabBar Insights button)
  useEffect(() => {
    if (insightRequestedAt && insightRequestedAt > lastRequestRef.current && hasTrip) {
      lastRequestRef.current = insightRequestedAt;
      handleGenerate();
    }
  }, [insightRequestedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear insights when trip changes
  useEffect(() => {
    clear();
  }, [selectedTripId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll content as it loads
  useEffect(() => {
    if (contentRef.current && content) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <WidgetPanel
      title="AI Travel Guide"
      accentColor="violet"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      }
      headerRight={
        content && !isLoading ? (
          <button
            onClick={handleGenerate}
            className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-violet-400 transition-colors"
            title="Regenerate insights"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        ) : undefined
      }
    >
      <div className="p-3" ref={contentRef}>
        {/* ── No trip selected ─────────────────────────────── */}
        {!hasTrip && !isLoading && !content && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="h-10 w-10 text-violet-500/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">
              Select a trip to get AI travel insights
            </p>
            <p className="text-[10px] text-gray-600 mt-1">
              Add a destination and dates to get started
            </p>
          </div>
        )}

        {/* ── Ready to generate ────────────────────────────── */}
        {hasTrip && !isLoading && !content && !error && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-[11px] text-gray-400 mb-3">
              <span className="text-white font-medium">{destination}</span>
              <span className="text-gray-600 mx-1.5">·</span>
              {new Date(startDate + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(endDate + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              <span className="text-gray-600 mx-1.5">·</span>
              {passengers} travelers
            </div>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate AI Travel Guide
              {hasResults && (
                <span className="text-[9px] text-violet-400/60 font-normal normal-case">
                  (incl. {flightResults.length} flights, {hotelResults.length} hotels)
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── Loading / Streaming ──────────────────────────── */}
        {isLoading && (
          <div className="space-y-3 py-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] text-violet-300 font-medium">
                Researching your trip to {destination}...
              </span>
            </div>

            {/* Tool activity feed */}
            {toolCalls.length > 0 && (
              <div className="space-y-1.5 pl-4 border-l border-violet-500/20">
                {toolCalls.map((tc, i) => (
                  <div
                    key={i}
                    className={`text-[10px] flex items-start gap-2 ${
                      i === toolCalls.length - 1 && !tc.output ? 'text-violet-300' : 'text-gray-600'
                    }`}
                  >
                    {i === toolCalls.length - 1 && !tc.output ? (
                      <svg className="h-3 w-3 mt-0.5 shrink-0 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className="leading-snug">{toolLabel(tc.tool, tc.input)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Skeleton pulse while waiting for first tool call */}
            {toolCalls.length === 0 && (
              <div className="space-y-2 animate-pulse">
                <div className="h-2.5 w-3/4 bg-white/5 rounded" />
                <div className="h-2.5 w-1/2 bg-white/5 rounded" />
                <div className="h-2.5 w-2/3 bg-white/5 rounded" />
              </div>
            )}
          </div>
        )}

        {/* ── Error ────────────────────────────────────────── */}
        {error && !isLoading && (
          <div className="flex flex-col items-center py-6 text-center">
            <p className="text-[11px] text-red-400 mb-3">{error}</p>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-all"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        )}

        {/* ── Content ──────────────────────────────────────── */}
        {content && !isLoading && (
          <div className="space-y-3">
            {/* Regenerate with latest results button */}
            {hasResults && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 text-[10px] text-violet-400/70 hover:text-violet-300 transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate with latest flight & hotel results
              </button>
            )}

            <MarkdownRenderer content={content} />

            {/* Tool calls summary */}
            {toolCalls.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">
                  Research sources ({toolCalls.length} lookups)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {toolCalls.map((tc, i) => (
                    <span
                      key={i}
                      className="text-[9px] text-gray-600 bg-white/5 rounded px-1.5 py-0.5"
                    >
                      {tc.tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </WidgetPanel>
  );
}
