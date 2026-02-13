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
import { NetWorthTrendWidget } from './components/widgets/NetWorthTrendWidget';
import { SpendingWidget } from './components/widgets/SpendingWidget';
import { CashflowWidget } from './components/widgets/CashflowWidget';
import { CalendarWidget } from './components/widgets/CalendarWidget';
import { CalendarMonthWidget } from './components/widgets/CalendarMonthWidget';
import { StrideWidget } from './components/widgets/StrideWidget';
import { commandCategories } from './config/commandCategories';
import { useChat } from './hooks/useChat';
import { useInsightStore } from './store/insightStore';

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
  ],
  'health-wellness': [
    { id: 'commands', label: 'Wellness Tools' },
  ],
  'travel-planning': [
    { id: 'commands', label: 'Travel Tools' },
    { id: 'widgets', label: 'Weather & Info' },
  ],
  'kids-education': [
    { id: 'commands', label: 'Education Tools' },
  ],
  'career-growth': [
    { id: 'pipeline', label: 'Job Pipeline' },
    { id: 'commands', label: 'Career Tools' },
  ],
  'claude-skills': [
    { id: 'skills', label: 'My Skills' },
  ],
};

// Default tabs for categories that don't have specific ones
const defaultTabs = [
  { id: 'commands', label: 'Commands' },
];

// Category-level insight prompts
const categoryInsightPrompts: Record<string, { prompt: string; title: string }> = {
  dashboard: { prompt: "Give me a comprehensive briefing: weather, upcoming events, market performance, pending tasks, and notable items across all my data.", title: "Dashboard Briefing" },
  'daily-briefs': { prompt: "Create a comprehensive daily briefing: weather conditions, market movements, recent activity, and key items I should know about today.", title: "Daily Brief" },
  'personal-finance': { prompt: "Provide comprehensive financial insights: net worth trends, spending analysis, investment performance for AAPL/TSLA/GOOGL/SNOW/PLTR, and actionable recommendations.", title: "Finance Insights" },
  'family-calendar': { prompt: "Analyze my family's schedule. Identify busy periods, potential conflicts, and suggest optimizations.", title: "Calendar Insights" },
  'health-wellness': { prompt: "Provide wellness insights based on my activity patterns and schedule balance, and suggest health improvements.", title: "Wellness Insights" },
  'travel-planning': { prompt: "Analyze upcoming travel plans, weather at destinations, and provide travel preparation recommendations.", title: "Travel Insights" },
  'kids-education': { prompt: "Review educational activities and schedules, and provide insights on learning progress and upcoming milestones.", title: "Education Insights" },
  'career-growth': { prompt: "Analyze my job search holistically: review my application pipeline status, upcoming interviews, networking follow-ups, market trends for my target roles, and provide strategic career recommendations.", title: "Career Insights" },
};

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
  const [showInsights, setShowInsights] = useState(false);
  const [insightDisplayTitle, setInsightDisplayTitle] = useState('');

  // Insight store subscription
  const insightPrompt = useInsightStore((s) => s.prompt);
  const insightTitle = useInsightStore((s) => s.title);
  const insightTriggeredAt = useInsightStore((s) => s.triggeredAt);
  const clearInsight = useInsightStore((s) => s.clear);

  // Lift useChat to App level so both panels share state
  const chat = useChat();

  const handleSelectCategory = useCallback((id: string) => {
    setActiveCategory(id);
    setShowMainContent(false);
    setShowInsights(false);
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

  // React to insight triggers from widgets
  useEffect(() => {
    if (insightPrompt && insightTriggeredAt) {
      setShowInsights(true);
      setInsightDisplayTitle(insightTitle || 'Insights');
      chat.sendMessage(insightPrompt);
      clearInsight();
    }
  }, [insightTriggeredAt]); // eslint-disable-line react-hooks/exhaustive-deps

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
              actions={
                categoryInsightPrompts[activeCategory] && (
                  <button
                    onClick={() => {
                      const ci = categoryInsightPrompts[activeCategory];
                      setShowInsights(true);
                      setInsightDisplayTitle(ci.title);
                      chat.sendMessage(ci.prompt);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider text-amber-400/70 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
                    </svg>
                    Insights
                  </button>
                )
              }
            />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {showInsights ? (
                <div className="rounded-xl border border-white/5 overflow-hidden"
                     style={{ background: 'rgba(3, 7, 18, 0.6)' }}>
                  <MainContentPanel
                    messages={chat.messages}
                    isLoading={chat.isLoading}
                    commandTitle={insightDisplayTitle}
                    onBack={() => setShowInsights(false)}
                  />
                </div>
              ) : (
                <>
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
                      <div key="stride"><StrideWidget /></div>
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
                    </WidgetGrid>
                  )}

                  {activeCategory === 'personal-finance' && activeTab === 'widgets' && (
                    <WidgetGrid pageId="personal-finance-widgets">
                      <div key="stocks"><StockWidget /></div>
                    </WidgetGrid>
                  )}

                  {/* ─── Family Calendar ───────────────────────────── */}
                  {activeCategory === 'family-calendar' && activeTab === 'schedule' && (
                    <WidgetGrid pageId="family-calendar-schedule">
                      <div key="calendar"><CalendarMonthWidget /></div>
                    </WidgetGrid>
                  )}

                  {/* ─── Career Growth — Job Pipeline ──────────────── */}
                  {activeCategory === 'career-growth' && activeTab === 'pipeline' && (
                    <WidgetGrid pageId="career-growth-pipeline">
                      <div key="stride"><StrideWidget /></div>
                    </WidgetGrid>
                  )}

                  {/* ─── Travel Planning ───────────────────────────── */}
                  {activeCategory === 'travel-planning' && activeTab === 'widgets' && (
                    <WidgetGrid pageId="travel-planning-widgets">
                      <div key="weather"><WeatherWidget /></div>
                    </WidgetGrid>
                  )}
                </>
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
