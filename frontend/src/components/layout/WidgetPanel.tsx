import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  headerRight?: ReactNode;
  accentColor?: string;
}

export function WidgetPanel({ title, icon, children, headerRight, accentColor = 'cyan' }: Props) {
  const colorMap: Record<string, { border: string; text: string; glow: string }> = {
    cyan: { border: 'border-cyan-500/15', text: 'text-cyan-400', glow: 'via-cyan-500/40' },
    emerald: { border: 'border-emerald-500/15', text: 'text-emerald-400', glow: 'via-emerald-500/40' },
    purple: { border: 'border-purple-500/15', text: 'text-purple-400', glow: 'via-purple-500/40' },
    amber: { border: 'border-amber-500/15', text: 'text-amber-400', glow: 'via-amber-500/40' },
    blue: { border: 'border-blue-500/15', text: 'text-blue-400', glow: 'via-blue-500/40' },
    rose: { border: 'border-rose-500/15', text: 'text-rose-400', glow: 'via-rose-500/40' },
    teal: { border: 'border-teal-500/15', text: 'text-teal-400', glow: 'via-teal-500/40' },
    orange: { border: 'border-orange-500/15', text: 'text-orange-400', glow: 'via-orange-500/40' },
    violet: { border: 'border-violet-500/15', text: 'text-violet-400', glow: 'via-violet-500/40' },
  };

  const colors = colorMap[accentColor] || colorMap.cyan;

  return (
    <div className={`glass-panel glass-panel-glow flex h-full flex-col overflow-hidden ${colors.border}`}>
      {/* Top accent line */}
      <div className={`h-px bg-gradient-to-r from-transparent ${colors.glow} to-transparent`} />

      {/* Drag handle header */}
      <div className="widget-drag-handle flex cursor-grab items-center justify-between px-3 py-2.5 active:cursor-grabbing"
           style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
        <div className="flex items-center gap-2">
          {icon && <span className={colors.text} style={{ opacity: 0.8 }}>{icon}</span>}
          <h3 className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${colors.text}`}>
            {title}
          </h3>
        </div>
        {headerRight}
      </div>

      {/* Separator */}
      <div className="h-px bg-white/5" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
