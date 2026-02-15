import { useState } from 'react';
import { useDailyBrief } from '../../hooks/useDailyBrief';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { BriefSection, BriefNewsItem, BriefMarketItem, BriefWeather } from '../../types/briefs';

const SECTION_ICONS: Record<string, JSX.Element> = {
  weather: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  ),
  chart: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  newspaper: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
    </svg>
  ),
  briefcase: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  twitter: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  reddit: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  ),
  cloud: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  ),
};

// Default expanded sections
const DEFAULT_EXPANDED = new Set(['weather', 'markets', 'news']);

export function DailyBriefWidget() {
  const { data, loading, error, refresh } = useDailyBrief();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isExpanded = (id: string) => {
    if (id in collapsed) return !collapsed[id];
    return DEFAULT_EXPANDED.has(id);
  };

  const toggleSection = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: isExpanded(id) }));
  };

  const lastUpdated = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <WidgetPanel
      title="Daily Brief"
      accentColor="amber"
      insightPrompt="Create a comprehensive daily briefing: weather conditions, market movements, top news, job market trends, and notable AI discussions from X and Reddit. Provide actionable insights."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
        </svg>
      }
      headerRight={
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] text-gray-600 font-mono">{lastUpdated}</span>
          )}
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <button onClick={refresh} className="text-gray-600 hover:text-amber-400 transition-colors" title="Refresh">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      }
    >
      <div className="p-3 space-y-1">
        {loading && !data && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-xs text-gray-500 uppercase tracking-wider">Compiling brief...</span>
          </div>
        )}

        {error && !data && (
          <div className="text-center py-8">
            <p className="text-xs text-red-400/80">{error}</p>
            <button onClick={refresh} className="mt-2 text-[10px] text-amber-400/70 hover:text-amber-400 uppercase tracking-wider">
              Retry
            </button>
          </div>
        )}

        {data?.sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            expanded={isExpanded(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </WidgetPanel>
  );
}

// ── Section Block ──────────────────────────────────────────────────────────

function SectionBlock({ section, expanded, onToggle }: { section: BriefSection; expanded: boolean; onToggle: () => void }) {
  const icon = SECTION_ICONS[section.icon] || SECTION_ICONS.newspaper;
  const itemCount = section.items?.length || (section.weather ? 1 : 0);

  return (
    <div className="rounded-lg border border-white/5 overflow-hidden" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-400/70">{icon}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">{section.title}</span>
          {itemCount > 0 && (
            <span className="text-[9px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-full font-mono">{itemCount}</span>
          )}
          {section.error && (
            <span className="text-[9px] text-red-400/60">error</span>
          )}
        </div>
        <svg
          className={`h-3 w-3 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Section content */}
      {expanded && (
        <div className="border-t border-white/5 px-3 py-2">
          {section.id === 'weather' && section.weather && <WeatherRenderer weather={section.weather} />}
          {section.id === 'markets' && section.items && <MarketsRenderer items={section.items as BriefMarketItem[]} />}
          {(section.id === 'news') && section.items && <NewsRenderer items={section.items as BriefNewsItem[]} />}
          {(section.id === 'jobs' || section.id === 'social' || section.id === 'reddit') && section.items && (
            <LinkListRenderer items={section.items as BriefNewsItem[]} />
          )}
          {section.error && !section.items?.length && !section.weather && (
            <p className="text-[10px] text-gray-600 py-2">{section.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Weather Renderer ────────────────────────────────────────────────────────

function WeatherRenderer({ weather }: { weather: BriefWeather }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-white font-mono">{weather.tempF}°F</div>
          <div className="text-[10px] text-gray-500">
            Feels like {weather.feelsLikeF}°F &middot; {weather.description}
          </div>
        </div>
        <div className="text-right text-[10px] text-gray-500 space-y-0.5">
          <div>{weather.location}, {weather.region}</div>
          <div>Humidity {weather.humidity}%</div>
          <div>Wind {weather.windSpeedMph} mph {weather.windDir}</div>
        </div>
      </div>
      {weather.forecast.length > 0 && (
        <div className="flex gap-2 pt-1">
          {weather.forecast.map((f) => (
            <div key={f.date} className="flex-1 rounded border border-white/5 p-1.5 text-center" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="text-[9px] text-gray-600 font-mono">
                {new Date(f.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-[11px] text-white font-mono mt-0.5">{f.maxTempF}° / {f.minTempF}°</div>
              <div className="text-[8px] text-gray-600 truncate">{f.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Markets Renderer ────────────────────────────────────────────────────────

function MarketsRenderer({ items }: { items: BriefMarketItem[] }) {
  const indices = items.filter((i) => i.isIndex);
  const stocks = items.filter((i) => !i.isIndex);

  return (
    <div className="space-y-2">
      {/* Indices row */}
      {indices.length > 0 && (
        <div className="flex gap-2">
          {indices.map((idx) => (
            <div key={idx.ticker} className="flex-1 rounded border border-white/5 p-2" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">{idx.name}</div>
              <div className="text-sm font-mono font-medium text-white">{idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className={`text-[10px] font-mono ${idx.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Individual stocks */}
      {stocks.map((stock) => (
        <div key={stock.ticker} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
          <div>
            <span className="text-xs font-bold text-white font-mono tracking-wide">{stock.ticker}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white">${stock.price.toFixed(2)}</span>
            <span
              className={`text-[10px] font-mono font-medium min-w-[52px] text-right ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              style={stock.change >= 0
                ? { textShadow: '0 0 8px rgba(52, 211, 153, 0.3)' }
                : { textShadow: '0 0 8px rgba(248, 113, 113, 0.3)' }
              }
            >
              {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── News Renderer ───────────────────────────────────────────────────────────

function NewsRenderer({ items }: { items: BriefNewsItem[] }) {
  // Group by category
  const grouped: Record<string, BriefNewsItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category}>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-amber-400/50 mb-1">{category}</div>
          <div className="space-y-1.5">
            {catItems.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="text-[11px] text-gray-300 group-hover:text-amber-400 transition-colors leading-tight">
                  {item.title}
                </div>
                <div className="text-[9px] text-gray-600 mt-0.5">
                  {item.source}{item.date ? ` · ${item.date}` : ''}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-[10px] text-gray-600 py-1">No news available</p>
      )}
    </div>
  );
}

// ── Link List Renderer (jobs, social, reddit) ──────────────────────────────

function LinkListRenderer({ items }: { items: BriefNewsItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="text-[11px] text-gray-300 group-hover:text-amber-400 transition-colors leading-tight">
            {item.title}
          </div>
          {item.snippet && (
            <div className="text-[10px] text-gray-600 mt-0.5 line-clamp-2 leading-snug">{item.snippet}</div>
          )}
          <div className="text-[9px] text-gray-700 mt-0.5">
            {item.source}{item.date ? ` · ${item.date}` : ''}
          </div>
        </a>
      ))}
      {items.length === 0 && (
        <p className="text-[10px] text-gray-600 py-1">No items available</p>
      )}
    </div>
  );
}
