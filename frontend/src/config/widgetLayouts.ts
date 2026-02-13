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
  // ─── Dashboard ───────────────────────────────────────
  'dashboard-overview': {
    rowHeight: 61,
    layouts: responsive([
      item('calendar', 0, 0, 4, 4),
      item('weather', 4, 0, 4, 4),
      item('stocks', 8, 0, 4, 4),
      item('todos', 0, 4, 4, 4),
      item('notes', 4, 4, 4, 4),
      item('contacts', 8, 4, 4, 4),
    ]),
  },

  'dashboard-activity': {
    rowHeight: 91,
    layouts: responsive([
      item('activity', 0, 0, 6, 4),
      item('todos', 6, 0, 6, 4),
    ]),
  },

  'dashboard-monitoring': {
    rowHeight: 71,
    layouts: responsive([
      item('system', 0, 0, 6, 4),
      item('system-monitor', 6, 0, 6, 4),
    ]),
  },

  // ─── Daily Briefs ────────────────────────────────────
  'daily-briefs-widgets': {
    rowHeight: 61,
    layouts: responsive([
      item('weather', 0, 0, 4, 4),
      item('stocks', 4, 0, 4, 4),
      item('activity', 8, 0, 4, 4),
    ]),
  },

  // ─── Personal Finance ────────────────────────────────
  'personal-finance-finances': {
    rowHeight: 71,
    layouts: responsive([
      item('net-worth', 0, 0, 4, 4),
      item('net-worth-trend', 4, 0, 4, 4),
      item('cashflow', 8, 0, 4, 4),
      item('spending', 0, 4, 4, 4),
      item('transactions', 4, 4, 4, 4),
      item('budget', 8, 4, 4, 4),
    ]),
  },

  'personal-finance-widgets': {
    rowHeight: 71,
    layouts: responsive([
      item('stocks', 0, 0, 6, 4),
      item('activity', 6, 0, 6, 4),
    ]),
  },

  // ─── Family Calendar ─────────────────────────────────
  'family-calendar-schedule': {
    rowHeight: 71,
    layouts: responsive([
      item('calendar', 0, 0, 4, 4),
      item('weather', 4, 0, 4, 4),
      item('todos', 8, 0, 4, 4),
    ]),
  },

  'family-calendar-widgets': {
    rowHeight: 61,
    layouts: responsive([
      item('todos', 0, 0, 4, 4),
      item('notes', 4, 0, 4, 4),
      item('weather', 8, 0, 4, 4),
    ]),
  },

  // ─── Health & Wellness ───────────────────────────────
  'health-wellness-widgets': {
    rowHeight: 61,
    layouts: responsive([
      item('todos', 0, 0, 6, 4),
      item('weather', 6, 0, 6, 4),
    ]),
  },

  // ─── Travel Planning ─────────────────────────────────
  'travel-planning-widgets': {
    rowHeight: 61,
    layouts: responsive([
      item('weather', 0, 0, 6, 4),
      item('notes', 6, 0, 6, 4),
    ]),
  },

  // ─── Kids & Education ────────────────────────────────
  'kids-education-widgets': {
    rowHeight: 61,
    layouts: responsive([
      item('todos', 0, 0, 6, 4),
      item('notes', 6, 0, 6, 4),
    ]),
  },

  // ─── Career Growth ───────────────────────────────────
  'career-growth-widgets': {
    rowHeight: 61,
    layouts: responsive([
      item('contacts', 0, 0, 4, 4),
      item('notes', 4, 0, 4, 4),
      item('stocks', 8, 0, 4, 4),
    ]),
  },
};
