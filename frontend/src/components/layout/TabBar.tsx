interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  accentColor?: string;
}

const colorMap: Record<string, { active: string; indicator: string }> = {
  cyan: { active: 'text-cyan-400', indicator: 'bg-cyan-400' },
  amber: { active: 'text-amber-400', indicator: 'bg-amber-400' },
  emerald: { active: 'text-emerald-400', indicator: 'bg-emerald-400' },
  blue: { active: 'text-blue-400', indicator: 'bg-blue-400' },
  rose: { active: 'text-rose-400', indicator: 'bg-rose-400' },
  teal: { active: 'text-teal-400', indicator: 'bg-teal-400' },
  violet: { active: 'text-violet-400', indicator: 'bg-violet-400' },
  orange: { active: 'text-orange-400', indicator: 'bg-orange-400' },
  purple: { active: 'text-purple-400', indicator: 'bg-purple-400' },
  red: { active: 'text-red-400', indicator: 'bg-red-400' },
};

export function TabBar({ tabs, activeTab, onSelectTab, accentColor = 'cyan' }: Props) {
  const colors = colorMap[accentColor] || colorMap.cyan;

  return (
    <div className="flex items-center gap-1 border-b border-white/5 px-4"
         style={{ background: 'rgba(3, 7, 18, 0.4)' }}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
              active ? colors.active : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {tab.label}
            {active && (
              <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${colors.indicator}`}
                   style={{ boxShadow: `0 0 8px currentColor` }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
