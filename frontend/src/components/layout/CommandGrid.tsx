import { useState, useRef, useEffect } from 'react';
import { commandCategories } from '../../config/commandCategories';
import type { Command } from '../../config/commandCategories';

const colorTextMap: Record<string, string> = {
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  rose: 'text-rose-400',
  teal: 'text-teal-400',
  violet: 'text-violet-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  cyan: 'text-cyan-400',
  red: 'text-red-400',
};

const colorBorderMap: Record<string, string> = {
  amber: 'border-amber-500/15 hover:border-amber-500/30',
  emerald: 'border-emerald-500/15 hover:border-emerald-500/30',
  blue: 'border-blue-500/15 hover:border-blue-500/30',
  rose: 'border-rose-500/15 hover:border-rose-500/30',
  teal: 'border-teal-500/15 hover:border-teal-500/30',
  violet: 'border-violet-500/15 hover:border-violet-500/30',
  orange: 'border-orange-500/15 hover:border-orange-500/30',
  purple: 'border-purple-500/15 hover:border-purple-500/30',
  cyan: 'border-cyan-500/15 hover:border-cyan-500/30',
  red: 'border-red-500/15 hover:border-red-500/30',
};

const colorFocusMap: Record<string, string> = {
  amber: 'focus:border-amber-500/40',
  emerald: 'focus:border-emerald-500/40',
  blue: 'focus:border-blue-500/40',
  rose: 'focus:border-rose-500/40',
  teal: 'focus:border-teal-500/40',
  violet: 'focus:border-violet-500/40',
  orange: 'focus:border-orange-500/40',
  purple: 'focus:border-purple-500/40',
  cyan: 'focus:border-cyan-500/40',
  red: 'focus:border-red-500/40',
};

interface Props {
  categoryId: string;
  onRunCommand: (prompt: string, commandName: string) => void;
}

export function CommandGrid({ categoryId, onRunCommand }: Props) {
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const category = commandCategories.find((c) => c.id === categoryId);

  // Reset search when category changes
  useEffect(() => {
    setSearch('');
  }, [categoryId]);

  // Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!category) return null;

  const textColor = colorTextMap[category.color] || colorTextMap.cyan;
  const borderColor = colorBorderMap[category.color] || colorBorderMap.cyan;
  const focusColor = colorFocusMap[category.color] || colorFocusMap.cyan;

  const filtered = search.trim()
    ? category.commands.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(search.toLowerCase()) ||
          cmd.prompt.toLowerCase().includes(search.toLowerCase())
      )
    : category.commands;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <h2 className={`text-xs font-semibold uppercase tracking-[0.15em] ${textColor}`}>
          {category.name}
        </h2>
        <span className="text-[9px] font-mono text-gray-600">
          {filtered.length} command{filtered.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands... (⌘K)"
            className={`w-56 rounded-md border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 ${focusColor} focus:outline-none transition-all`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((cmd: Command) => (
          <button
            key={cmd.id}
            onClick={() => onRunCommand(cmd.prompt, cmd.name)}
            className={`group text-left rounded-xl border ${borderColor} p-3.5 transition-all hover:bg-white/[0.02]`}
            style={{ background: 'rgba(15, 23, 42, 0.3)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-gray-300 group-hover:text-white transition-colors">
                  {cmd.name}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">
                  {cmd.prompt.slice(0, 80)}...
                </div>
              </div>
              <svg className="h-4 w-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[11px] text-gray-600 uppercase tracking-wider">
            No commands match "{search}"
          </p>
        </div>
      )}
    </div>
  );
}
