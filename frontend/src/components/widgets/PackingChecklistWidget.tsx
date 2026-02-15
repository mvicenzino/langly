import { useState, useEffect } from 'react';
import { useTrips } from '../../hooks/useTrips';
import { usePacking } from '../../hooks/usePacking';
import { useTravelStore } from '../../store/travelStore';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const CATEGORY_LABELS: Record<string, string> = {
  essentials: 'Essentials',
  clothing: 'Clothing',
  'baby-kids': 'Baby / Kids',
  'dog-supplies': 'Dog Supplies',
  pregnancy: 'Pregnancy',
  toiletries: 'Toiletries',
  tech: 'Tech',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

export function PackingChecklistWidget() {
  const { trips } = useTrips();
  const storeSelectedTripId = useTravelStore((s) => s.selectedTripId);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const { items, loading, toggle, add, remove, generate } = usePacking(selectedTripId);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('essentials');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  // Sync from travel store when trip selection changes
  useEffect(() => {
    if (storeSelectedTripId) {
      setSelectedTripId(storeSelectedTripId);
    }
  }, [storeSelectedTripId]);

  // Auto-select first trip if nothing selected
  if (!selectedTripId && !storeSelectedTripId && trips.length > 0) {
    setSelectedTripId(trips[0].id);
  }

  const packed = items.filter((i) => i.packed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;

  // Group by category
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  // Sort categories
  const sortedCats = CATEGORY_ORDER.filter((c) => grouped[c]);
  // Add any extra categories not in our predefined list
  for (const c of Object.keys(grouped)) {
    if (!sortedCats.includes(c)) sortedCats.push(c);
  }

  function toggleCat(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (newItem.trim() && selectedTripId) {
      add(newItem.trim(), newCategory);
      setNewItem('');
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generate();
    } finally {
      setGenerating(false);
    }
  }

  const icon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  return (
    <WidgetPanel
      title="Packing Checklist"
      accentColor="violet"
      icon={icon}
      headerRight={
        total > 0 ? (
          <span className="text-[10px] font-mono text-violet-400/60">
            {packed}<span className="text-gray-600">/{total}</span>
          </span>
        ) : null
      }
    >
      <div className="p-3 space-y-3">
        {/* Trip selector + generate */}
        <div className="flex gap-2 items-center">
          <select
            value={selectedTripId ?? ''}
            onChange={(e) => setSelectedTripId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 rounded border border-violet-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-300 focus:border-violet-500/40 focus:outline-none transition-all [color-scheme:dark]"
          >
            <option value="">Select trip...</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.destination}</option>
            ))}
          </select>
          {selectedTripId && items.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="shrink-0 rounded border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs text-violet-400 hover:bg-violet-500/20 disabled:opacity-50 transition-all"
            >
              {generating ? 'Generating...' : 'Generate List'}
            </button>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-gray-500">Progress</span>
              <span className="text-violet-400/70">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {/* Add item */}
        {selectedTripId && (
          <form onSubmit={handleAdd} className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-24 rounded border border-violet-500/15 bg-slate-900/60 px-1.5 py-1.5 text-[10px] text-gray-400 focus:border-violet-500/40 focus:outline-none transition-all [color-scheme:dark]"
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add item..."
              className="flex-1 rounded border border-violet-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-violet-500/40 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newItem.trim()}
              className="rounded border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs text-violet-400 hover:bg-violet-500/20 disabled:opacity-30 transition-all"
            >
              +
            </button>
          </form>
        )}

        {/* Category sections */}
        <div className="space-y-1">
          {sortedCats.map((cat) => {
            const catItems = grouped[cat];
            const catPacked = catItems.filter((i) => i.packed).length;
            const isCollapsed = collapsedCats.has(cat);

            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCat(cat)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`h-3 w-3 text-gray-600 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-wider text-violet-400/70 font-mono">
                      {CATEGORY_LABELS[cat] || cat}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-600">
                    {catPacked}/{catItems.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="ml-5 space-y-0.5 pb-1">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-2 rounded px-2 py-1 hover:bg-white/[0.02] transition-all"
                      >
                        <button
                          onClick={() => toggle(item.id, !item.packed)}
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded transition-all ${
                            item.packed
                              ? 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                              : 'border border-gray-700 hover:border-violet-500/30'
                          }`}
                        >
                          {item.packed && (
                            <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className={`flex-1 text-xs transition-colors ${item.packed ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                          {item.item}
                        </span>
                        <button
                          onClick={() => remove(item.id)}
                          className="invisible text-gray-700 hover:text-red-400 group-hover:visible transition-colors"
                        >
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!selectedTripId && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            Select a trip to manage packing
          </p>
        )}

        {selectedTripId && items.length === 0 && !loading && !generating && (
          <p className="text-center text-[11px] text-gray-600 py-4 uppercase tracking-wider">
            No items yet — generate a list or add items manually
          </p>
        )}
      </div>
    </WidgetPanel>
  );
}
