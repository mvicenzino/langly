import { useState, useRef, useEffect } from 'react';
import { useSkills } from '../../hooks/useSkills';
import { extractTextFromFile, extractTextFromUrl } from '../../api/skills';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { Skill } from '../../types/skills';
import type { ReactNode } from 'react';

interface AttachedFile {
  name: string;
  text: string;
}

const iconMap: Record<string, ReactNode> = {
  eye: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  briefcase: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  search: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  target: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  rocket: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  cpu: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  user: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  chart: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

const colorStyles: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  violet: { border: 'border-violet-500/20', bg: 'bg-violet-500/5', text: 'text-violet-400', glow: 'rgba(139, 92, 246, 0.15)' },
  amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400', glow: 'rgba(245, 158, 11, 0.15)' },
  cyan: { border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', text: 'text-cyan-400', glow: 'rgba(6, 182, 212, 0.15)' },
  red: { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-400', glow: 'rgba(239, 68, 68, 0.15)' },
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400', glow: 'rgba(16, 185, 129, 0.15)' },
  blue: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.15)' },
  purple: { border: 'border-purple-500/20', bg: 'bg-purple-500/5', text: 'text-purple-400', glow: 'rgba(168, 85, 247, 0.15)' },
  teal: { border: 'border-teal-500/20', bg: 'bg-teal-500/5', text: 'text-teal-400', glow: 'rgba(20, 184, 166, 0.15)' },
  orange: { border: 'border-orange-500/20', bg: 'bg-orange-500/5', text: 'text-orange-400', glow: 'rgba(249, 115, 22, 0.15)' },
};

const categoryColorMap: Record<string, string> = {
  'AI Operating': 'text-violet-400',
  'Strategy & Business': 'text-amber-400',
  'Content & Communication': 'text-purple-400',
  'Design & UX': 'text-cyan-400',
};

const CATEGORY_ORDER = ['AI Operating', 'Strategy & Business', 'Content & Communication', 'Design & UX'];

interface Props {
  onLaunchSkill: (prompt: string, skillName?: string) => void;
}

export function SkillsPanel({ onLaunchSkill }: Props) {
  const { skills, loading } = useSkills();
  const [search, setSearch] = useState('');
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [userInput, setUserInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [extractError, setExtractError] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && activeSkill) {
        setActiveSkill(null);
        setUserInput('');
        setAttachedFiles([]);
        setLinkInputOpen(false);
        setExtractError('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSkill]);

  const filtered = search.trim()
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase()) ||
          (s.features || []).some((f) => f.toLowerCase().includes(search.toLowerCase()))
      )
    : skills;

  const groupedByCategory = CATEGORY_ORDER.map((cat) => ({
    name: cat,
    skills: filtered.filter((s) => s.category === cat),
  })).filter((g) => g.skills.length > 0);

  function handleLaunch() {
    if (!activeSkill) return;
    const parts: string[] = [activeSkill.prompt];
    if (userInput.trim()) parts.push(`Context:\n${userInput.trim()}`);
    if (attachedFiles.length > 0) {
      const docs = attachedFiles.map((f) => `--- ${f.name} ---\n${f.text}`).join('\n\n');
      parts.push(
        `The following documents have been provided inline below. ` +
        `You already have the full content — do NOT use any tools to read them. ` +
        `Analyze the content directly and provide your Final Answer.\n\n` +
        `Attached Documents:\n\n${docs}`
      );
    }
    onLaunchSkill(parts.join('\n\n'), activeSkill.name);
    setActiveSkill(null);
    setUserInput('');
    setAttachedFiles([]);
    setLinkInputOpen(false);
    setExtractError('');
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setExtracting(true);
    setExtractError('');
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'txt' || ext === 'md') {
          const text = await file.text();
          setAttachedFiles((prev) => [...prev, { name: file.name, text }]);
        } else {
          const result = await extractTextFromFile(file);
          setAttachedFiles((prev) => [...prev, { name: result.name, text: result.text }]);
        }
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to extract text');
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  }

  async function handleLinkSubmit() {
    if (!linkUrl.trim()) return;
    setExtracting(true);
    setExtractError('');
    try {
      const result = await extractTextFromUrl(linkUrl.trim());
      setAttachedFiles((prev) => [...prev, { name: result.name, text: result.text }]);
      setLinkUrl('');
      setLinkInputOpen(false);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to fetch URL');
    } finally {
      setExtracting(false);
    }
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // ─── Detail View ──────────────────────────────────────
  if (activeSkill) {
    const colors = colorStyles[activeSkill.color] || colorStyles.cyan;
    return (
      <div className="space-y-4">
        {/* Back + Header */}
        <div className="flex items-center gap-3 px-1">
          <button
            onClick={() => { setActiveSkill(null); setUserInput(''); setAttachedFiles([]); setLinkInputOpen(false); setExtractError(''); }}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-400">
            Skill Detail
          </h2>
        </div>

        {/* Skill Detail Card */}
        <div
          className={`rounded-xl border ${colors.border} p-5`}
          style={{ background: 'rgba(15, 23, 42, 0.4)', boxShadow: `0 0 30px ${colors.glow}` }}
        >
          <div className="flex items-start gap-4">
            <div className={`rounded-lg border ${colors.border} ${colors.bg} p-3 shrink-0`}>
              <span className={colors.text}>
                {iconMap[activeSkill.icon] || iconMap.rocket}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-base font-semibold text-white">{activeSkill.name}</h3>
                {activeSkill.timeSaved && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activeSkill.timeSaved}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">
                {activeSkill.category}
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {activeSkill.description}
              </p>
            </div>
          </div>

          {/* Features */}
          {activeSkill.features && activeSkill.features.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-mono mb-2">
                Key Features
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSkill.features.map((feature) => (
                  <span
                    key={feature}
                    className={`rounded border ${colors.border} ${colors.bg} px-2.5 py-1 text-[11px] ${colors.text}`}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          className="rounded-xl border border-white/5 p-5"
          style={{ background: 'rgba(15, 23, 42, 0.3)' }}
        >
          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-mono mb-2 block">
            {activeSkill.inputLabel}
          </label>

          {/* Attach buttons */}
          <div className="flex items-center gap-2 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.docx"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-400 hover:text-orange-400 hover:border-orange-500/20 transition-all disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach Doc
            </button>
            <button
              onClick={() => { setLinkInputOpen(!linkInputOpen); setExtractError(''); }}
              disabled={extracting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-400 hover:text-orange-400 hover:border-orange-500/20 transition-all disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Paste Link
            </button>
            {extracting && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-orange-400 font-mono">
                <LoadingSpinner size="xs" />
                Extracting...
              </span>
            )}
          </div>

          {/* Link URL input */}
          {linkInputOpen && (
            <div className="flex items-center gap-2 mb-3">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLinkSubmit(); if (e.key === 'Escape') { setLinkInputOpen(false); setLinkUrl(''); } }}
                placeholder="https://docs.google.com/document/d/..."
                className="flex-1 rounded-lg border border-orange-500/15 bg-slate-900/60 px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:border-orange-500/40 focus:outline-none font-mono transition-all"
                autoFocus
              />
              <button
                onClick={handleLinkSubmit}
                disabled={!linkUrl.trim() || extracting}
                className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-orange-400 hover:bg-orange-500/20 transition-all disabled:opacity-50"
              >
                Fetch
              </button>
            </div>
          )}

          {/* Error message */}
          {extractError && (
            <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-400 font-mono">
              {extractError}
            </div>
          )}

          {/* Attached file chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachedFiles.map((file, i) => (
                <span
                  key={`${file.name}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/15 bg-orange-500/5 px-2.5 py-1 text-[11px] text-orange-400 font-mono"
                >
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate max-w-[140px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="shrink-0 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={activeSkill.inputPlaceholder}
            rows={5}
            className="w-full resize-none rounded-lg border border-orange-500/15 bg-slate-900/60 p-3 text-sm text-gray-300 placeholder-gray-600 focus:border-orange-500/40 focus:outline-none font-mono transition-all"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-gray-600 font-mono">
              Context is optional — skill works without it
            </span>
            <button
              onClick={handleLaunch}
              className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-6 py-2.5 text-xs font-semibold text-orange-400 uppercase tracking-wider hover:bg-orange-500/20 transition-all"
              style={{ boxShadow: '0 0 20px rgba(249, 115, 22, 0.1)' }}
            >
              Launch Agent
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Grid View ────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-400">
          Claude Skills
        </h2>
        <span className="text-[9px] font-mono text-gray-600">
          {filtered.length} skill{filtered.length !== 1 ? 's' : ''}
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
            placeholder="Search skills... (&#8984;K)"
            className="w-56 rounded-md border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:border-orange-500/40 focus:outline-none transition-all"
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

      {/* Category Sections */}
      {groupedByCategory.map((group) => (
        <div key={group.name}>
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className={`text-[10px] uppercase tracking-[0.15em] font-semibold ${categoryColorMap[group.name] || 'text-gray-400'}`}>
              {group.name}
            </div>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] font-mono text-gray-700">
              {group.skills.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {group.skills.map((skill) => {
              const colors = colorStyles[skill.color] || colorStyles.cyan;
              return (
                <button
                  key={skill.id}
                  onClick={() => setActiveSkill(skill)}
                  className={`group text-left rounded-xl border ${colors.border} p-4 transition-all hover:bg-white/[0.02]`}
                  style={{ background: 'rgba(15, 23, 42, 0.3)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-2 shrink-0 group-hover:shadow-lg transition-all`}
                         style={{ boxShadow: `0 0 15px ${colors.glow}` }}>
                      <span className={`${colors.text} opacity-70 group-hover:opacity-100 transition-opacity`}>
                        {iconMap[skill.icon] || iconMap.rocket}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-gray-300 group-hover:text-white transition-colors">
                        {skill.name}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">
                        {skill.description}
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: time saved + features preview */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.03]">
                    {skill.timeSaved && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-2 py-0.5 text-[9px] font-mono text-emerald-400/80">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {skill.timeSaved}
                      </span>
                    )}
                    {skill.features && skill.features.length > 0 && (
                      <span className="text-[9px] text-gray-700 truncate">
                        {skill.features[0]}
                      </span>
                    )}
                    <div className="flex-1" />
                    <svg className="h-3.5 w-3.5 text-gray-700 group-hover:text-orange-400/60 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[11px] text-gray-600 uppercase tracking-wider">
            No skills match "{search}"
          </p>
        </div>
      )}
    </div>
  );
}
