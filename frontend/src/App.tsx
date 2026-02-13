import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { TabBar } from './components/layout/TabBar';
import { CommandGrid } from './components/layout/CommandGrid';
import { SkillsPanel } from './components/layout/SkillsPanel';
import { MainContentPanel } from './components/layout/MainContentPanel';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { WidgetGrid } from './components/layout/DashboardGrid';
import { ChatPanel } from './components/chat/ChatPanel';
import { StockWidget } from './components/widgets/StockWidget';
import { WeatherWidget } from './components/widgets/WeatherWidget';
import { TodoWidget } from './components/widgets/TodoWidget';
import { NotesWidget } from './components/widgets/NotesWidget';
import { SystemMonitorWidget } from './components/widgets/SystemMonitorWidget';
import { SystemWidget } from './components/widgets/SystemWidget';
import { ActivityWidget } from './components/widgets/ActivityWidget';
import { ContactsWidget } from './components/widgets/ContactsWidget';
import { NetWorthWidget } from './components/widgets/NetWorthWidget';
import { TransactionsWidget } from './components/widgets/TransactionsWidget';
import { BudgetWidget } from './components/widgets/BudgetWidget';
import { NetWorthTrendWidget } from './components/widgets/NetWorthTrendWidget';
import { SpendingWidget } from './components/widgets/SpendingWidget';
import { CashflowWidget } from './components/widgets/CashflowWidget';
import { CalendarWidget } from './components/widgets/CalendarWidget';
import { commandCategories } from './config/commandCategories';
import { useChat } from './hooks/useChat';

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
    { id: 'finances', label: 'My Finances' },
    { id: 'commands', label: 'Finance Tools' },
    { id: 'widgets', label: 'Markets' },
  ],
  'family-calendar': [
    { id: 'schedule', label: 'Schedule' },
    { id: 'commands', label: 'Calendar' },
    { id: 'widgets', label: 'Tasks & Notes' },
  ],
  'health-wellness': [
    { id: 'commands', label: 'Wellness Tools' },
    { id: 'widgets', label: 'Tracking' },
  ],
  'travel-planning': [
    { id: 'commands', label: 'Travel Tools' },
    { id: 'widgets', label: 'Weather & Info' },
  ],
  'kids-education': [
    { id: 'commands', label: 'Education Tools' },
    { id: 'widgets', label: 'Schedule' },
  ],
  'career-growth': [
    { id: 'commands', label: 'Career Tools' },
    { id: 'widgets', label: 'Network & Market' },
  ],
  'claude-skills': [
    { id: 'skills', label: 'My Skills' },
  ],
};

// Default tabs for categories that don't have specific ones
const defaultTabs = [
  { id: 'commands', label: 'Commands' },
];

function App() {
  const token = useAuthStore((s) => s.token);
  const verify = useAuthStore((s) => s.verify);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (token) {
      verify().finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authChecked) return null;
  if (!token) return <LoginScreen />;
  return <Dashboard />;
}

function Dashboard() {
  const [activeCategory, setActiveCategory] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMainContent, setShowMainContent] = useState(false);
  const [commandTitle, setCommandTitle] = useState('');

  // Lift useChat to App level so both panels share state
  const chat = useChat();

  const handleSelectCategory = useCallback((id: string) => {
    setActiveCategory(id);
    setShowMainContent(false);
    // Set first tab as active
    const tabs = categoryTabs[id] || defaultTabs;
    setActiveTab(tabs[0].id);
  }, []);

  const handleRunCommand = useCallback((prompt: string, name: string) => {
    setShowMainContent(true);
    setCommandTitle(name);
    chat.sendMessage(prompt);
  }, [chat.sendMessage]);

  const handleBack = useCallback(() => {
    setShowMainContent(false);
  }, []);

  const handleLaunchSkill = useCallback((prompt: string) => {
    setChatOpen(true);
    chat.sendMessage(prompt);
  }, [chat.sendMessage]);

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
  const accentColor = activeCategory === 'claude-skills' ? 'orange' : (category?.color || 'cyan');

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
                <WidgetGrid pageId="dashboard-overview">
                  <div key="calendar"><CalendarWidget /></div>
                  <div key="weather"><WeatherWidget /></div>
                  <div key="stocks"><StockWidget /></div>
                  <div key="todos"><TodoWidget /></div>
                  <div key="notes"><NotesWidget /></div>
                  <div key="contacts"><ContactsWidget /></div>
                </WidgetGrid>
              )}

              {activeCategory === 'dashboard' && activeTab === 'activity' && (
                <WidgetGrid pageId="dashboard-activity">
                  <div key="activity"><ActivityWidget /></div>
                  <div key="todos"><TodoWidget /></div>
                </WidgetGrid>
              )}

              {activeCategory === 'dashboard' && activeTab === 'monitoring' && (
                <WidgetGrid pageId="dashboard-monitoring">
                  <div key="system"><SystemWidget /></div>
                  <div key="system-monitor"><SystemMonitorWidget /></div>
                </WidgetGrid>
              )}

              {/* ─── Claude Skills ────────────────────────────── */}
              {activeCategory === 'claude-skills' && activeTab === 'skills' && (
                <SkillsPanel onLaunchSkill={handleLaunchSkill} />
              )}

              {/* ─── Category Command Grids / Main Content Panel ── */}
              {activeCategory !== 'dashboard' && activeCategory !== 'claude-skills' && activeTab === 'commands' && (
                showMainContent ? (
                  <div className="rounded-xl border border-white/5 overflow-hidden"
                       style={{ background: 'rgba(3, 7, 18, 0.6)' }}>
                    <MainContentPanel
                      messages={chat.messages}
                      isLoading={chat.isLoading}
                      commandTitle={commandTitle}
                      onBack={handleBack}
                    />
                  </div>
                ) : (
                  <CommandGrid categoryId={activeCategory} onRunCommand={handleRunCommand} />
                )
              )}

              {/* ─── Daily Briefs ──────────────────────────────── */}
              {activeCategory === 'daily-briefs' && activeTab === 'widgets' && (
                <WidgetGrid pageId="daily-briefs-widgets">
                  <div key="weather"><WeatherWidget /></div>
                  <div key="stocks"><StockWidget /></div>
                  <div key="activity"><ActivityWidget /></div>
                </WidgetGrid>
              )}

              {/* ─── Personal Finance ──────────────────────────── */}
              {activeCategory === 'personal-finance' && activeTab === 'finances' && (
                <WidgetGrid pageId="personal-finance-finances">
                  <div key="net-worth"><NetWorthWidget /></div>
                  <div key="net-worth-trend"><NetWorthTrendWidget /></div>
                  <div key="cashflow"><CashflowWidget /></div>
                  <div key="spending"><SpendingWidget /></div>
                  <div key="transactions"><TransactionsWidget /></div>
                  <div key="budget"><BudgetWidget /></div>
                </WidgetGrid>
              )}

              {activeCategory === 'personal-finance' && activeTab === 'widgets' && (
                <WidgetGrid pageId="personal-finance-widgets">
                  <div key="stocks"><StockWidget /></div>
                  <div key="activity"><ActivityWidget /></div>
                </WidgetGrid>
              )}

              {/* ─── Family Calendar ───────────────────────────── */}
              {activeCategory === 'family-calendar' && activeTab === 'schedule' && (
                <WidgetGrid pageId="family-calendar-schedule">
                  <div key="calendar"><CalendarWidget /></div>
                  <div key="weather"><WeatherWidget /></div>
                  <div key="todos"><TodoWidget /></div>
                </WidgetGrid>
              )}

              {activeCategory === 'family-calendar' && activeTab === 'widgets' && (
                <WidgetGrid pageId="family-calendar-widgets">
                  <div key="todos"><TodoWidget /></div>
                  <div key="notes"><NotesWidget /></div>
                  <div key="weather"><WeatherWidget /></div>
                </WidgetGrid>
              )}

              {/* ─── Health & Wellness ─────────────────────────── */}
              {activeCategory === 'health-wellness' && activeTab === 'widgets' && (
                <WidgetGrid pageId="health-wellness-widgets">
                  <div key="todos"><TodoWidget /></div>
                  <div key="weather"><WeatherWidget /></div>
                </WidgetGrid>
              )}

              {/* ─── Travel Planning ───────────────────────────── */}
              {activeCategory === 'travel-planning' && activeTab === 'widgets' && (
                <WidgetGrid pageId="travel-planning-widgets">
                  <div key="weather"><WeatherWidget /></div>
                  <div key="notes"><NotesWidget /></div>
                </WidgetGrid>
              )}

              {/* ─── Kids & Education ──────────────────────────── */}
              {activeCategory === 'kids-education' && activeTab === 'widgets' && (
                <WidgetGrid pageId="kids-education-widgets">
                  <div key="todos"><TodoWidget /></div>
                  <div key="notes"><NotesWidget /></div>
                </WidgetGrid>
              )}

              {/* ─── Career Growth ─────────────────────────────── */}
              {activeCategory === 'career-growth' && activeTab === 'widgets' && (
                <WidgetGrid pageId="career-growth-widgets">
                  <div key="contacts"><ContactsWidget /></div>
                  <div key="notes"><NotesWidget /></div>
                  <div key="stocks"><StockWidget /></div>
                </WidgetGrid>
              )}

            </div>
          </div>

          {/* Chat Panel — always mounted, hidden when closed */}
          <div
            className={`w-[380px] xl:w-[420px] shrink-0 border-l border-white/5 flex flex-col ${chatOpen ? '' : 'hidden'}`}
            style={{ background: 'rgba(3, 7, 18, 0.4)' }}
          >
            <ChatPanel
              messages={chat.messages}
              isLoading={chat.isLoading}
              sendMessage={chat.sendMessage}
              clearMessages={chat.clearMessages}
              sessions={chat.sessions}
              activeSessionId={chat.activeSessionId}
              startNewSession={chat.startNewSession}
              switchSession={chat.switchSession}
              deleteSession={chat.deleteSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
