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
import { SystemWidget } from './components/widgets/SystemWidget';
import { ActivityWidget } from './components/widgets/ActivityWidget';
import { NetWorthWidget } from './components/widgets/NetWorthWidget';
import { TransactionsWidget } from './components/widgets/TransactionsWidget';
import { NetWorthTrendWidget } from './components/widgets/NetWorthTrendWidget';
import { SpendingWidget } from './components/widgets/SpendingWidget';
import { CashflowWidget } from './components/widgets/CashflowWidget';
import { CalendarWidget } from './components/widgets/CalendarWidget';
import { CalendarMonthWidget } from './components/widgets/CalendarMonthWidget';
import { StrideWidget } from './components/widgets/StrideWidget';
import { KeyDocsWidget } from './components/widgets/KeyDocsWidget';
import { FamilyDocsWidget } from './components/widgets/FamilyDocsWidget';
import { PregnancyWidget } from './components/widgets/PregnancyWidget';
import { UltrasoundWidget } from './components/widgets/UltrasoundWidget';
import { TripPlannerWidget } from './components/widgets/TripPlannerWidget';
import { FlightSearchWidget } from './components/widgets/FlightSearchWidget';
import { HotelSearchWidget } from './components/widgets/HotelSearchWidget';
import { OpenClawDoctorWidget } from './components/widgets/OpenClawDoctorWidget';
import { TravelInsightsWidget } from './components/widgets/TravelInsightsWidget';
import { ContentCalendar } from './components/layout/ContentCalendar';
import { DailyBriefView } from './components/views/DailyBriefView';
import { ProjectsView } from './components/views/ProjectsView';
import { LanglyProjectsView } from './components/views/LanglyProjectsView';
import { StrideProjectsView } from './components/views/StrideProjectsView';
import { commandCategories } from './config/commandCategories';
import { useChat } from './hooks/useChat';
import { useInsightStore } from './store/insightStore';
import { useTravelStore } from './store/travelStore';

// Define which tabs appear per category (single main tab per section)
const categoryTabs: Record<string, { id: string; label: string }[]> = {
  dashboard: [
    { id: 'overview', label: 'Overview' },
    { id: 'operations', label: 'Operations' },
  ],
  'daily-briefs': [
    { id: 'main', label: 'Daily Briefs' },
  ],
  'projects': [
    { id: 'main', label: 'Kindora Projects' },
  ],
  'langly': [
    { id: 'main', label: 'Langly' },
  ],
  'stride': [
    { id: 'main', label: 'Stride' },
  ],
  'personal-finance': [
    { id: 'main', label: 'My Finances' },
  ],
  'family-calendar': [
    { id: 'main', label: 'Schedule' },
  ],
  'health-wellness': [
    { id: 'main', label: 'Wellness' },
  ],
  'travel-planning': [
    { id: 'main', label: 'Travel' },
  ],
  'kids-education': [
    { id: 'main', label: 'Education' },
  ],
  'career-growth': [
    { id: 'main', label: 'Job Pipeline' },
  ],
  'claude-skills': [
    { id: 'skills', label: 'My Skills' },
    { id: 'content-calendar', label: 'Content Calendar' },
    { id: 'skills-dashboard', label: 'Skills Dashboard' },
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
  'travel-planning': { prompt: '', title: "Travel Insights" },
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

  const handleLaunchSkill = useCallback((prompt: string, skillName?: string) => {
    setShowMainContent(true);
    setCommandTitle(skillName || 'Skill Result');
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
                      if (activeCategory === 'travel-planning') {
                        // Trigger the TravelInsightsWidget directly
                        useTravelStore.getState().requestInsights();
                      } else {
                        const ci = categoryInsightPrompts[activeCategory];
                        setShowInsights(true);
                        setInsightDisplayTitle(ci.title);
                        chat.sendMessage(ci.prompt);
                      }
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
                  {/* ─── Dashboard: Overview ─────────────────────────────────── */}
                  {activeCategory === 'dashboard' && activeTab === 'overview' && (
                    <>
                      <p className="text-[11px] text-gray-500 mb-2 px-1">
                        Data as of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <WidgetGrid pageId="dashboard-overview">
                        <div key="calendar"><CalendarWidget /></div>
                        <div key="weather"><WeatherWidget /></div>
                        <div key="stocks"><StockWidget /></div>
                        <div key="todos"><TodoWidget /></div>
                        <div key="notes"><NotesWidget /></div>
                        <div key="key-docs"><KeyDocsWidget /></div>
                      </WidgetGrid>
                    </>
                  )}

                  {/* ─── Dashboard: Operations ─────────────────────────────────── */}
                  {activeCategory === 'dashboard' && activeTab === 'operations' && (
                    <WidgetGrid pageId="dashboard-operations">
                      <div key="openclaw-doctor"><OpenClawDoctorWidget /></div>
                      <div key="system"><SystemWidget /></div>
                      <div key="activity"><ActivityWidget /></div>
                    </WidgetGrid>
                  )}

                  {/* ─── Claude Skills ────────────────────────────── */}
                  {activeCategory === 'claude-skills' && activeTab === 'skills' && (
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
                      <SkillsPanel onLaunchSkill={handleLaunchSkill} />
                    )
                  )}

                  {/* ─── Content Calendar ────────────────────────────── */}
                  {activeCategory === 'claude-skills' && activeTab === 'content-calendar' && (
                    <ContentCalendar />
                  )}

                  {/* ─── Skills Dashboard (external) ──────────────────── */}
                  {activeCategory === 'claude-skills' && activeTab === 'skills-dashboard' && (
                    <div className="h-full rounded-xl border border-white/5 overflow-hidden"
                         style={{ background: 'rgba(3, 7, 18, 0.6)' }}>
                      <iframe
                        src="http://localhost:3337"
                        title="Skills Dashboard"
                        className="w-full h-full border-0"
                        style={{ minHeight: 'calc(100vh - 140px)' }}
                      />
                    </div>
                  )}

                  {/* ─── Sections with widgets + commands ─────────── */}
                  {activeCategory !== 'dashboard' && activeCategory !== 'claude-skills' && activeTab === 'main' && (
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
                      <>
                        {/* ─── Daily Briefs ─────────────────────────── */}
                        {activeCategory === 'daily-briefs' && (
                          <DailyBriefView />
                        )}

                        {/* ─── Projects: Kindora ─────────────────────── */}
                        {activeCategory === 'projects' && (
                          <ProjectsView />
                        )}

                        {/* ─── Projects: Langly ──────────────────────── */}
                        {activeCategory === 'langly' && (
                          <LanglyProjectsView />
                        )}

                        {/* ─── Projects: Stride ──────────────────────── */}
                        {activeCategory === 'stride' && (
                          <StrideProjectsView />
                        )}

                        {/* ─── Personal Finance ─────────────────────── */}
                        {activeCategory === 'personal-finance' && (
                          <>
                            <p className="text-[11px] text-gray-500 mb-2 px-1">
                              Data as of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                            <WidgetGrid pageId="personal-finance-main">
                              <div key="net-worth"><NetWorthWidget /></div>
                              <div key="net-worth-trend"><NetWorthTrendWidget /></div>
                              <div key="cashflow"><CashflowWidget /></div>
                              <div key="spending"><SpendingWidget /></div>
                              <div key="transactions"><TransactionsWidget /></div>
                              <div key="stocks"><StockWidget /></div>
                            </WidgetGrid>
                          </>
                        )}

                        {/* ─── Family Calendar ──────────────────────── */}
                        {activeCategory === 'family-calendar' && (
                          <>
                            <p className="text-[11px] text-gray-500 mb-2 px-1">
                              Data as of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                            <WidgetGrid pageId="family-calendar-main">
                              <div key="calendar"><CalendarMonthWidget /></div>
                              <div key="family-docs"><FamilyDocsWidget /></div>
                              <div key="ultrasounds"><UltrasoundWidget /></div>
                              <div key="pregnancy"><PregnancyWidget /></div>
                            </WidgetGrid>
                          </>
                        )}

                        {/* ─── Career Growth ────────────────────────── */}
                        {activeCategory === 'career-growth' && (
                          <WidgetGrid pageId="career-growth-main">
                            <div key="stride"><StrideWidget /></div>
                          </WidgetGrid>
                        )}

                        {/* ─── Travel Planning ──────────────────────── */}
                        {activeCategory === 'travel-planning' && (
                          <WidgetGrid pageId="travel-planning-main">
                            <div key="trip-planner"><TripPlannerWidget /></div>
                            <div key="travel-insights"><TravelInsightsWidget /></div>
                            <div key="weather"><WeatherWidget /></div>
                            <div key="flight-search"><FlightSearchWidget /></div>
                            <div key="hotel-search"><HotelSearchWidget /></div>
                          </WidgetGrid>
                        )}

                        {/* Command grid below widgets (hidden for daily-briefs) */}
                        {activeCategory !== 'daily-briefs' && (
                          <div className="mt-4">
                            <CommandGrid categoryId={activeCategory} onRunCommand={handleRunCommand} />
                          </div>
                        )}
                      </>
                    )
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
