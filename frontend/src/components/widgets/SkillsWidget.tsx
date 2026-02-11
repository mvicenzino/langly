import { useState } from 'react';
import { useSkills } from '../../hooks/useSkills';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { Skill } from '../../types/skills';

import type { ReactNode } from 'react';

const iconMap: Record<string, ReactNode> = {
  eye: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  briefcase: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  search: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  target: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  rocket: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  cpu: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  user: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  chart: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  violet: { border: 'border-violet-500/20', bg: 'bg-violet-500/5', text: 'text-violet-400', glow: 'rgba(139, 92, 246, 0.15)' },
  amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400', glow: 'rgba(245, 158, 11, 0.15)' },
  cyan: { border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', text: 'text-cyan-400', glow: 'rgba(6, 182, 212, 0.15)' },
  red: { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-400', glow: 'rgba(239, 68, 68, 0.15)' },
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400', glow: 'rgba(16, 185, 129, 0.15)' },
  blue: { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.15)' },
  purple: { border: 'border-purple-500/20', bg: 'bg-purple-500/5', text: 'text-purple-400', glow: 'rgba(168, 85, 247, 0.15)' },
  teal: { border: 'border-teal-500/20', bg: 'bg-teal-500/5', text: 'text-teal-400', glow: 'rgba(20, 184, 166, 0.15)' },
};

interface Props {
  onLaunchSkill?: (prompt: string) => void;
}

export function SkillsWidget({ onLaunchSkill }: Props) {
  const { skills, loading } = useSkills();
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [userInput, setUserInput] = useState('');

  function handleLaunch() {
    if (!activeSkill || !onLaunchSkill) return;
    const fullPrompt = userInput.trim()
      ? `${activeSkill.prompt}\n\nContext: ${userInput.trim()}`
      : activeSkill.prompt;
    onLaunchSkill(fullPrompt);
    setActiveSkill(null);
    setUserInput('');
  }

  if (activeSkill) {
    const colors = colorMap[activeSkill.color] || colorMap.cyan;
    return (
      <WidgetPanel
        title="Agent Skills"
        accentColor="orange"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        headerRight={
          <button
            onClick={() => { setActiveSkill(null); setUserInput(''); }}
            className="text-[10px] uppercase tracking-wider text-gray-600 hover:text-orange-400 transition-colors"
          >
            Back
          </button>
        }
      >
        <div className="flex h-full flex-col p-3 space-y-3">
          <div className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}
               style={{ boxShadow: `0 0 20px ${colors.glow}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className={colors.text}>{iconMap[activeSkill.icon]}</span>
              <span className={`text-sm font-medium ${colors.text}`}>{activeSkill.name}</span>
            </div>
            <p className="text-[11px] text-gray-400">{activeSkill.description}</p>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-mono mb-1.5">
              {activeSkill.inputLabel}
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={activeSkill.inputPlaceholder}
              className="flex-1 min-h-[80px] resize-none rounded border border-orange-500/15 bg-slate-900/60 p-2.5 text-xs text-gray-300 placeholder-gray-600 focus:border-orange-500/40 focus:outline-none font-mono transition-all"
            />
          </div>

          <button
            onClick={handleLaunch}
            className="w-full rounded border border-orange-500/30 bg-orange-500/10 py-2 text-xs font-medium text-orange-400 uppercase tracking-wider hover:bg-orange-500/20 transition-all"
            style={{ boxShadow: '0 0 15px rgba(249, 115, 22, 0.1)' }}
          >
            Launch Agent
          </button>
        </div>
      </WidgetPanel>
    );
  }

  const categories = [...new Set(skills.map(s => s.category))];

  return (
    <WidgetPanel
      title="Agent Skills"
      accentColor="orange"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
      headerRight={
        <span className="text-[9px] font-mono text-orange-400/60 uppercase">
          {skills.length} skills
        </span>
      }
    >
      <div className="p-3 space-y-3">
        {loading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {categories.map((category) => (
          <div key={category}>
            <div className="text-[9px] uppercase tracking-wider text-orange-400/50 font-mono mb-1.5">
              {category}
            </div>
            <div className="space-y-1">
              {skills.filter(s => s.category === category).map((skill) => {
                const colors = colorMap[skill.color] || colorMap.cyan;
                return (
                  <button
                    key={skill.id}
                    onClick={() => setActiveSkill(skill)}
                    className={`w-full text-left rounded-lg border ${colors.border} p-2.5 transition-all hover:bg-white/[0.02] group`}
                    style={{ background: 'rgba(15, 23, 42, 0.3)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`${colors.text} opacity-60 group-hover:opacity-100 transition-opacity`}>
                        {iconMap[skill.icon] || iconMap.rocket}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-gray-300 group-hover:text-white transition-colors">
                          {skill.name}
                        </div>
                        <div className="text-[9px] text-gray-600 truncate">
                          {skill.description}
                        </div>
                      </div>
                      <svg className="h-3 w-3 text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {skills.length === 0 && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            No skills loaded
          </p>
        )}
      </div>
    </WidgetPanel>
  );
}
