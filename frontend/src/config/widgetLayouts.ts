import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout';

interface PageLayout {
  rowHeight: number;
  layouts: ResponsiveLayouts<'lg' | 'md' | 'sm'>;
}

/** Build a LayoutItem with defaults */
function item(i: string, x: number, y: number, w: number, h: number): LayoutItem {
  return { i, x, y, w, h, minW: 3, minH: 3 };
}

/** Generate md (2-across) and sm (1-across) from lg layout */
function responsive(lg: LayoutItem[]): ResponsiveLayouts<'lg' | 'md' | 'sm'> {
  const md = lg.map((l, idx) => ({
    ...l,
    w: 6,
    x: (idx % 2) * 6,
    y: Math.floor(idx / 2) * l.h,
  }));
  const sm = lg.map((l, idx) => ({
    ...l,
    w: 12,
    x: 0,
    y: idx * l.h,
  }));
  return { lg, md, sm };
}

/**
 * Default layouts for every widget page.
 *
 * Row heights derived from CSS auto-rows:
 *   280px → rowHeight 61 (h=4 → 4*61 + 3*12 = 280)
 *   320px → rowHeight 71 (h=4 → 4*71 + 3*12 = 320)
 *   400px → rowHeight 91 (h=4 → 4*91 + 3*12 = 400)
 *
 * lg = 3-across (w=4, cols=12)
 * md = 2-across (w=6, cols=12)
 * sm = 1-across (w=12, cols=12)
 */
export const PAGE_LAYOUTS: Record<string, PageLayout> = {
  // ─── Dashboard (all widgets in one view) ───────────
  'dashboard-overview': {
    rowHeight: 61,
    layouts: responsive([
      item('calendar', 0, 0, 4, 4),
      item('weather', 4, 0, 4, 4),
      item('stocks', 8, 0, 4, 4),
      item('todos', 0, 4, 4, 4),
      item('notes', 4, 4, 4, 4),
      item('activity', 8, 4, 4, 4),
      item('key-docs', 0, 8, 6, 4),
      item('system', 6, 8, 6, 4),
    ]),
  },

  // ─── Personal Finance (finances + markets combined) ─
  'personal-finance-main': {
    rowHeight: 71,
    layouts: responsive([
      item('net-worth', 0, 0, 4, 4),
      item('net-worth-trend', 4, 0, 4, 4),
      item('cashflow', 8, 0, 4, 4),
      item('spending', 0, 4, 4, 4),
      item('transactions', 4, 4, 4, 4),
      item('stocks', 8, 4, 4, 4),
    ]),
  },

  // ─── Family Calendar ───────────────────────────────
  'family-calendar-main': {
    rowHeight: 71,
    layouts: responsive([
      { i: 'calendar', x: 0, y: 0, w: 8, h: 7, minW: 6, minH: 6 },
      { i: 'family-docs', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'pregnancy', x: 8, y: 4, w: 4, h: 8, minW: 3, minH: 5 },
    ]),
  },

  // ─── Career Growth ─────────────────────────────────
  'career-growth-main': {
    rowHeight: 71,
    layouts: responsive([
      { i: 'stride', x: 0, y: 0, w: 12, h: 5, minW: 6, minH: 4 },
    ]),
  },

  // ─── Travel Planning ───────────────────────────────
  'travel-planning-main': {
    rowHeight: 61,
    layouts: responsive([
      item('weather', 0, 0, 12, 4),
    ]),
  },
};
