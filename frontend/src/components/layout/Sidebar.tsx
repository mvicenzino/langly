import type { ReactElement } from 'react';
import { commandCategories } from '../../config/commandCategories';

const iconMap: Record<string, (active: boolean) => ReactElement> = {
  dashboard: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-cyan-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 6a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5zM4 13a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
    </svg>
  ),
  sun: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-amber-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  dollar: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-emerald-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-blue-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  heart: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-rose-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  home: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-teal-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  plane: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-violet-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  book: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-orange-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  film: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-purple-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  ),
  briefcase: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-cyan-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  shield: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-red-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  bolt: (a) => (
    <svg className={`h-5 w-5 ${a ? 'text-orange-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

const colorMap: Record<string, string> = {
  amber: 'border-amber-500/30 bg-amber-500/10',
  emerald: 'border-emerald-500/30 bg-emerald-500/10',
  blue: 'border-blue-500/30 bg-blue-500/10',
  rose: 'border-rose-500/30 bg-rose-500/10',
  teal: 'border-teal-500/30 bg-teal-500/10',
  violet: 'border-violet-500/30 bg-violet-500/10',
  orange: 'border-orange-500/30 bg-orange-500/10',
  purple: 'border-purple-500/30 bg-purple-500/10',
  cyan: 'border-cyan-500/30 bg-cyan-500/10',
  red: 'border-red-500/30 bg-red-500/10',
};

interface Props {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeCategory, onSelectCategory, collapsed, onToggleCollapse }: Props) {
  const allItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', color: 'cyan' },
    { id: 'claude-skills', name: 'Claude Skills', icon: 'bolt', color: 'orange' },
    { id: '_divider', name: '', icon: '', color: '' },
    ...commandCategories,
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-white/5 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-52'
      }`}
      style={{ background: 'rgba(3, 7, 18, 0.6)', backdropFilter: 'blur(12px)' }}
    >
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-center h-10 border-b border-white/5 text-gray-600 hover:text-cyan-400 transition-colors"
      >
        <svg className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {allItems.map((item) => {
          if (item.id === '_divider') {
            return (
              <div key="_divider" className="my-2 mx-1 border-t border-white/5" />
            );
          }
          const active = activeCategory === item.id;
          const IconFn = iconMap[item.icon];
          return (
            <button
              key={item.id}
              onClick={() => onSelectCategory(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-all group ${
                active
                  ? `border ${colorMap[item.color] || colorMap.cyan}`
                  : 'border border-transparent hover:bg-white/[0.03] hover:border-white/5'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <span className="shrink-0">
                {IconFn ? IconFn(active) : null}
              </span>
              {!collapsed && (
                <span className={`text-[11px] font-medium tracking-wide truncate transition-colors ${
                  active ? 'text-gray-200' : 'text-gray-500 group-hover:text-gray-300'
                }`}>
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right edge accent */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent" />
    </aside>
  );
}
