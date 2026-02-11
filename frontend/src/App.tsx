import { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { TabBar } from './components/layout/TabBar';
import { CommandGrid } from './components/layout/CommandGrid';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { StockWidget } from './components/widgets/StockWidget';
import { WeatherWidget } from './components/widgets/WeatherWidget';
import { TodoWidget } from './components/widgets/TodoWidget';
import { NotesWidget } from './components/widgets/NotesWidget';
import { OpenClawWidget } from './components/widgets/OpenClawWidget';
import { SystemWidget } from './components/widgets/SystemWidget';
import { ActivityWidget } from './components/widgets/ActivityWidget';
import { commandCategories } from './config/commandCategories';

// Define which widgets appear under which tabs per category
const categoryTabs: Record<string, { id: string; label: string }[]> = {
  dashboard: [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'monitoring', label: 'Monitoring' },
  ],
  'daily-briefs': [
    { id: 'commands', label: 'Briefs' },
    { id: 'widgets', label: 'Feeds' },
  ],
  'personal-finance': [
    { id: 'commands', label: 'Finance Tools' },
    { id: 'widgets', label: 'Markets' },
  ],
  'family-calendar': [
    { id: 'commands', label: 'Calendar' },
    { id: 'widgets', label: 'Tasks & Notes' },
  ],
  'health-wellness': [
    { id: 'commands', label: 'Wellness Tools' },
    { id: 'widgets', label: 'Tracking' },
  ],
  'home-management': [
    { id: 'commands', label: 'Home Tools' },
    { id: 'widgets', label: 'Status' },
  ],
  'travel-planning': [
    { id: 'commands', label: 'Travel Tools' },
    { id: 'widgets', label: 'Weather & Info' },
  ],
  'kids-education': [
    { id: 'commands', label: 'Education Tools' },
    { id: 'widgets', label: 'Schedule' },
  ],
  entertainment: [
    { id: 'commands', label: 'Entertainment' },
    { id: 'widgets', label: 'Notes' },
  ],
  'career-growth': [
    { id: 'commands', label: 'Career Tools' },
    { id: 'widgets', label: 'Market Data' },
  ],
  'emergency-safety': [
    { id: 'commands', label: 'Emergency Tools' },
    { id: 'widgets', label: 'Status' },
  ],
};

// Default tabs for categories that don't have specific ones
const defaultTabs = [
  { id: 'commands', label: 'Commands' },
];

function App() {
  const [activeCategory, setActiveCategory] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sendToChat = useRef<((msg: string) => void) | null>(null);

  const handleSelectCategory = useCallback((id: string) => {
    setActiveCategory(id);
    // Set first tab as active
    const tabs = categoryTabs[id] || defaultTabs;
    setActiveTab(tabs[0].id);
  }, []);

  const handleRunCommand = useCallback((prompt: string) => {
    setChatOpen(true);
    // Small delay to ensure chat panel is open
    setTimeout(() => sendToChat.current?.(prompt), 100);
  }, []);

  const handleChatDone = useCallback(() => {
    // Could refresh widgets here
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+/ to toggle chat
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setChatOpen((prev) => !prev);
      }
      // Escape to close settings
      if (e.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen]);

  const tabs = categoryTabs[activeCategory] || defaultTabs;
  const category = commandCategories.find((c) => c.id === activeCategory);
  const accentColor = category?.color || 'cyan';

  return (
    <div className="relative flex h-screen flex-col bg-grid scan-line overflow-hidden"
         style={{ background: '#030712' }}>
      <Header
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen(!chatOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Bar */}
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              accentColor={accentColor}
            />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* ─── Dashboard ─────────────────────────────────── */}
              {activeCategory === 'dashboard' && activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-[280px]">
                  <div><WeatherWidget /></div>
                  <div><StockWidget /></div>
                  <div><TodoWidget /></div>
                  <div><NotesWidget /></div>
                  <div><OpenClawWidget /></div>
                  <div><SystemWidget /></div>
                </div>
              )}

              {activeCategory === 'dashboard' && activeTab === 'activity' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[400px]">
                  <div><ActivityWidget /></div>
                  <div><TodoWidget /></div>
                </div>
              )}

              {activeCategory === 'dashboard' && activeTab === 'monitoring' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[320px]">
                  <div><SystemWidget /></div>
                  <div><OpenClawWidget /></div>
                </div>
              )}

              {/* ─── Category Command Grids ─────────────────────── */}
              {activeCategory !== 'dashboard' && activeTab === 'commands' && (
                <CommandGrid categoryId={activeCategory} onRunCommand={handleRunCommand} />
              )}

              {/* ─── Daily Briefs ──────────────────────────────── */}
              {activeCategory === 'daily-briefs' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-[280px]">
                  <div><WeatherWidget /></div>
                  <div><StockWidget /></div>
                  <div><ActivityWidget /></div>
                </div>
              )}

              {/* ─── Personal Finance ──────────────────────────── */}
              {activeCategory === 'personal-finance' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[320px]">
                  <div><StockWidget /></div>
                  <div><ActivityWidget /></div>
                </div>
              )}

              {/* ─── Family Calendar ───────────────────────────── */}
              {activeCategory === 'family-calendar' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-[280px]">
                  <div><TodoWidget /></div>
                  <div><NotesWidget /></div>
                  <div><WeatherWidget /></div>
                </div>
              )}

              {/* ─── Health & Wellness ─────────────────────────── */}
              {activeCategory === 'health-wellness' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[280px]">
                  <div><TodoWidget /></div>
                  <div><WeatherWidget /></div>
                </div>
              )}

              {/* ─── Home Management ───────────────────────────── */}
              {activeCategory === 'home-management' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-[280px]">
                  <div><TodoWidget /></div>
                  <div><WeatherWidget /></div>
                  <div><SystemWidget /></div>
                </div>
              )}

              {/* ─── Travel Planning ───────────────────────────── */}
              {activeCategory === 'travel-planning' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[280px]">
                  <div><WeatherWidget /></div>
                  <div><NotesWidget /></div>
                </div>
              )}

              {/* ─── Kids & Education ──────────────────────────── */}
              {activeCategory === 'kids-education' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[280px]">
                  <div><TodoWidget /></div>
                  <div><NotesWidget /></div>
                </div>
              )}

              {/* ─── Entertainment ─────────────────────────────── */}
              {activeCategory === 'entertainment' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[280px]">
                  <div><NotesWidget /></div>
                  <div><ActivityWidget /></div>
                </div>
              )}

              {/* ─── Career Growth ─────────────────────────────── */}
              {activeCategory === 'career-growth' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[280px]">
                  <div><StockWidget /></div>
                  <div><OpenClawWidget /></div>
                </div>
              )}

              {/* ─── Emergency & Safety ────────────────────────── */}
              {activeCategory === 'emergency-safety' && activeTab === 'widgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-[280px]">
                  <div><WeatherWidget /></div>
                  <div><SystemWidget /></div>
                  <div><TodoWidget /></div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel — always accessible on the right */}
          {chatOpen && (
            <div className="w-[380px] xl:w-[420px] shrink-0 border-l border-white/5 flex flex-col"
                 style={{ background: 'rgba(3, 7, 18, 0.4)' }}>
              <ChatPanel onChatDone={handleChatDone} onSendRef={sendToChat} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
