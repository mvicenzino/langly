import { useState, useEffect, useCallback } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Brain, FileText, Cpu, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

interface FileStat {
  name: string;
  tokens: number;
  size_bytes: number;
  lines: number;
  exists: boolean;
  role: string;
}

interface Section {
  files: FileStat[];
  total_tokens: number;
  total_size_bytes?: number;
  file_count: number;
}

interface StatsData {
  boot: Section;
  memory: Section;
  workspace: Section;
  totals: {
    total_tokens: number;
    boot_tokens: number;
    memory_tokens: number;
    workspace_tokens: number;
  };
  top_files: FileStat[];
}

function fmtTokens(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function fmtBytes(n: number) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

const SECTION_COLORS = {
  boot:      { bar: '#3B82F6', label: 'Boot', bg: 'rgba(59,130,246,0.12)' },
  memory:    { bar: '#A78BFA', label: 'Memory', bg: 'rgba(167,139,250,0.12)' },
  workspace: { bar: '#F59E0B', label: 'Workspace', bg: 'rgba(245,158,11,0.12)' },
};

const FILE_COLORS: Record<string, string> = {
  'MEMORY.md':    '#A78BFA',
  'SOUL.md':      '#34D399',
  'TOOLS.md':     '#F59E0B',
  'BRAIN.md':     '#60A5FA',
  'AGENTS.md':    '#FB923C',
  'HEARTBEAT.md': '#F472B6',
  'USER.md':      '#2DD4BF',
  'IDENTITY.md':  '#818CF8',
};

function FileRow({ f, maxTokens }: { f: FileStat; maxTokens: number }) {
  const pct = maxTokens > 0 ? (f.tokens / maxTokens) * 100 : 0;
  const color = FILE_COLORS[f.name] || '#6B7280';
  return (
    <div className="flex items-center gap-2 py-1">
      <FileText size={11} className="flex-shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.name}</span>
          <span className="text-[11px] font-mono flex-shrink-0 ml-2" style={{ color }}>{fmtTokens(f.tokens)}</span>
        </div>
        <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-[3px] rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title, color, bg, tokens, fileCount, files, maxTokens
}: {
  title: string; color: string; bg: string; tokens: number;
  fileCount: number; files: FileStat[]; maxTokens: number;
}) {
  const [open, setOpen] = useState(title === 'Boot');
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid rgba(255,255,255,0.07)` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: bg }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[12px] font-semibold flex-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{title}</span>
        <span className="text-[11px] font-mono" style={{ color }}>{fmtTokens(tokens)} tok</span>
        <span className="text-[10px] text-gray-600 ml-1">({fileCount} files)</span>
        <div style={{ color: 'rgba(255,255,255,0.3)' }}>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-2 pt-1">
          {files.filter(f => f.exists).map(f => (
            <FileRow key={f.name} f={f} maxTokens={maxTokens} />
          ))}
          {files.filter(f => !f.exists).length > 0 && (
            <div className="text-[10px] text-gray-600 mt-1">
              {files.filter(f => !f.exists).map(f => f.name).join(', ')} — not found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OpenClawStatsWidget() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/openclaw/workspace-stats');
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tot = data?.totals;
  const maxTokens = data ? Math.max(...data.top_files.map(f => f.tokens), 1) : 1;

  return (
    <WidgetPanel
      title="OpenClaw Workspace"
      icon={<Brain size={14} className="text-purple-400" />}
      headerRight={
        <button onClick={load} className="p-1 rounded hover:bg-white/5 transition-colors" title="Refresh">
          <RefreshCw size={12} className="text-gray-500" />
        </button>
      }
      accentColor="purple"
    >
      {loading ? (
        <div className="flex justify-center py-6"><LoadingSpinner /></div>
      ) : error ? (
        <div className="text-red-400 text-xs py-4 text-center">{error}</div>
      ) : data && tot ? (
        <div className="space-y-4">

          {/* Total token summary */}
          <div className="rounded-lg p-3" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Cpu size={11} className="text-purple-400" />
                Total workspace context
              </div>
              <div className="text-sm font-bold font-mono text-purple-300">
                {fmtTokens(tot.total_tokens)} tokens
              </div>
            </div>

            {/* Stacked breakdown bar */}
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
              {(['boot', 'memory', 'workspace'] as const).map(key => {
                const pct = tot.total_tokens > 0
                  ? (tot[`${key}_tokens` as keyof typeof tot] as number / tot.total_tokens) * 100
                  : 0;
                return (
                  <div
                    key={key}
                    style={{ width: `${pct}%`, background: SECTION_COLORS[key].bar }}
                    title={`${key}: ${fmtTokens(tot[`${key}_tokens` as keyof typeof tot] as number)}`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-3 mt-2">
              {(['boot', 'memory', 'workspace'] as const).map(key => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: SECTION_COLORS[key].bar }} />
                  <span className="text-[10px] text-gray-500">{SECTION_COLORS[key].label}</span>
                  <span className="text-[10px] font-mono" style={{ color: SECTION_COLORS[key].bar }}>
                    {fmtTokens(tot[`${key}_tokens` as keyof typeof tot] as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top files */}
          <div>
            <div className="text-[10px] text-gray-500 mb-2">Largest files</div>
            {data.top_files.slice(0, 8).map(f => (
              <FileRow key={f.path} f={f} maxTokens={maxTokens} />
            ))}
          </div>

          {/* Collapsible sections */}
          <div className="space-y-2">
            <CollapsibleSection
              title="Boot Context"
              color={SECTION_COLORS.boot.bar}
              bg={SECTION_COLORS.boot.bg}
              tokens={tot.boot_tokens}
              fileCount={data.boot.file_count}
              files={data.boot.files}
              maxTokens={maxTokens}
            />
            <CollapsibleSection
              title="Memory Files"
              color={SECTION_COLORS.memory.bar}
              bg={SECTION_COLORS.memory.bg}
              tokens={tot.memory_tokens}
              fileCount={data.memory.file_count}
              files={data.memory.files.slice(0, 10)}
              maxTokens={maxTokens}
            />
          </div>

        </div>
      ) : null}
    </WidgetPanel>
  );
}
