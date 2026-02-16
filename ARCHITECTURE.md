# Langly Architecture Document

**Personal AI Command Center — 30-tool LangChain agent with fast intent routing**

Last updated: 2026-02-16

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Agent System & Intent Routing](#agent-system--intent-routing)
7. [Database Schema](#database-schema)
8. [Authentication](#authentication)
9. [Real-Time Communication](#real-time-communication)
10. [External Service Integrations](#external-service-integrations)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Environment Variables](#environment-variables)

---

## System Overview

Langly is a hybrid AI personal assistant that combines a LangChain ReAct agent (30 tools, streaming callbacks) for complex reasoning with a fast-path regex router for common queries. It serves as a unified command center for personal finance, family calendar, job search, travel planning, and daily productivity.

**Key design principles:**

- **Dual-path query processing** — Regex-based fast path handles ~80% of queries in <50ms; full LangChain agent handles complex reasoning in 2-10s
- **Real-time streaming** — Token-level updates via WebSocket for long-running agent queries
- **Modular services** — Each external integration is isolated behind its own service module and API blueprint
- **Personalized context** — Family profile and user preferences injected into all agent prompts

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                     │
│  Vite + TypeScript + Tailwind + Zustand + react-grid-layout │
│                   http://localhost:5173                      │
└──────────────┬──────────────────────┬───────────────────────┘
               │ REST /api/*          │ WebSocket /socket.io
               ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Flask + SocketIO)                 │
│                    http://localhost:5001                     │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Fast-Path│  │  LangChain   │  │  21 API Blueprints │    │
│  │  Router  │→ │  ReAct Agent │  │  (REST endpoints)  │    │
│  │(router.py)│  │  (30 tools)  │  │                    │    │
│  └──────────┘  └──────────────┘  └────────────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              8 Service Integrations                   │   │
│  │  Monarch Money | Kindora | Stride | Google Drive     │   │
│  │  LinkedIn | Twitter | Flight Search | Hotel Search   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────────────┘
```

---

## Tech Stack

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Flask | 3.0+ |
| WebSocket | Flask-SocketIO | 5.3+ |
| WSGI Server | Gunicorn + Gevent | 21.2+ |
| Database | PostgreSQL (psycopg2) | — |
| AI/LLM | LangChain + OpenAI (gpt-4o-mini) | 0.3.x |
| Search | SerpAPI | 0.1+ |
| Auth | bcrypt | 4.0+ |
| Runtime | Python | 3.11.9 |

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.3.1 |
| Styling | Tailwind CSS | 4.1.18 |
| State Management | Zustand | 5.0.11 |
| Layout System | react-grid-layout | 2.2.2 |
| Real-Time | Socket.IO Client | 4.8.3 |
| Markdown | react-markdown + remark-gfm | 10.1.0 |

---

## Project Structure

```
langly/
├── Dockerfile                         # Python 3.11-slim container
├── Procfile                           # Heroku/Railway process definition
├── railway.toml                       # Railway deployment config
├── runtime.txt                        # Python version (3.11.9)
├── scripts/
│   └── sync_drive_shortcuts.gs        # Google Apps Script for Drive sync
│
├── backend/
│   ├── app.py                         # Flask factory, 21 blueprints, CORS, auth middleware
│   ├── run.py                         # Entry point, DB init, SocketIO server
│   ├── config.py                      # Environment loading, paths
│   ├── db.py                          # PostgreSQL connection pool, query helpers
│   ├── router.py                      # Fast-path intent classifier (regex-based)
│   ├── profile.py                     # User/family context for agent prompts
│   ├── migrate.py                     # Data migration (flat files → PostgreSQL)
│   ├── requirements.txt               # Python dependencies
│   │
│   ├── agent/
│   │   ├── langchain_agent.py         # 30 tools, ReAct agent, ChatOpenAI
│   │   ├── callbacks.py               # StreamingCallbackHandler (queue-based)
│   │   └── wrapper.py                 # Agent bridge (bundled/external)
│   │
│   ├── api/                           # 21 REST API blueprints
│   │   ├── auth.py                    # Token login/verify
│   │   ├── health.py                  # Health check
│   │   ├── chat.py                    # Chat sessions & messages
│   │   ├── todos.py                   # Task management
│   │   ├── notes.py                   # Notes with @mention support
│   │   ├── contacts.py                # Contact database
│   │   ├── reminders.py               # Apple Reminders (AppleScript)
│   │   ├── weather.py                 # Open-Meteo + wttr.in
│   │   ├── stocks.py                  # yfinance stock data
│   │   ├── system.py                  # CPU, memory, disk, processes
│   │   ├── activity.py                # Activity audit log
│   │   ├── finance.py                 # Monarch Money endpoints
│   │   ├── drive.py                   # Google Drive file listing
│   │   ├── calendar.py                # Kindora family calendar
│   │   ├── stride.py                  # Job tracker pipeline
│   │   ├── travel.py                  # Trip planning, flights, hotels
│   │   ├── social.py                  # LinkedIn OAuth2
│   │   ├── briefs.py                  # News/markets/jobs aggregator
│   │   ├── skills.py                  # AI prompt templates
│   │   ├── content_calendar.py        # Social media scheduling
│   │   ├── docs.py                    # Document parsing
│   │   └── openclaw.py                # OpenClaw gateway proxy
│   │
│   ├── services/                      # 8 external service integrations
│   │   ├── monarch_service.py         # Personal finance (async→sync bridge)
│   │   ├── kindora_service.py         # Family calendar (GraphQL)
│   │   ├── stride_service.py          # Job tracker (GraphQL)
│   │   ├── linkedin_service.py        # OAuth2 + posting
│   │   ├── twitter_service.py         # Social media
│   │   ├── flight_search_service.py   # SkyScanner/Kiwi flights
│   │   ├── hotel_search_service.py    # Hotel search
│   │   └── content_calendar_service.py# Content scheduling
│   │
│   └── sockets/
│       └── chat_handler.py            # WebSocket event handlers
│
└── frontend/
    ├── index.html                     # HTML entry point
    ├── package.json                   # Dependencies & scripts
    ├── vite.config.ts                 # Vite + proxy config
    ├── tsconfig.json                  # TypeScript config
    │
    └── src/
        ├── main.tsx                   # React bootstrap
        ├── App.tsx                    # Root component, navigation, layout
        ├── index.css                  # Global styles
        │
        ├── api/                       # 16 API service modules
        │   ├── client.ts              # Core HTTP client (GET/POST/PUT/DELETE)
        │   ├── socket.ts              # Socket.IO client setup
        │   ├── chat.ts                # Chat sessions & messages
        │   ├── calendar.ts            # Calendar events
        │   ├── finance.ts             # Monarch Money
        │   ├── stocks.ts              # Stock quotes
        │   ├── weather.ts             # Weather data
        │   ├── todos.ts               # Todo CRUD
        │   ├── notes.ts               # Notes CRUD
        │   ├── contacts.ts            # Contacts CRUD
        │   ├── travel.ts              # Trips, flights, hotels
        │   ├── stride.ts              # Job pipeline
        │   ├── activity.ts            # Activity log
        │   ├── system.ts              # System info
        │   ├── skills.ts              # Skills/prompts
        │   ├── drive.ts               # Google Drive
        │   ├── openclaw.ts            # OpenClaw
        │   └── reminders.ts           # Reminders
        │
        ├── store/                     # Zustand state stores
        │   ├── authStore.ts           # Token auth (persisted)
        │   ├── layoutStore.ts         # Widget positions per page (persisted)
        │   ├── settingsStore.ts       # Watchlist, locations, preferences (persisted)
        │   ├── insightStore.ts        # AI insight trigger (ephemeral)
        │   └── travelStore.ts         # Active trip context (partially persisted)
        │
        ├── hooks/                     # 17 custom React hooks
        │   ├── useChat.ts             # Chat state + socket management
        │   ├── useTodos.ts            # Todo list
        │   ├── useNotes.ts            # Notes
        │   ├── useContacts.ts         # Contacts
        │   ├── useFinance.ts          # Finance data
        │   ├── useCalendar.ts         # Calendar events
        │   ├── useWeather.ts          # Weather
        │   ├── useStocks.ts           # Stock prices
        │   ├── useSystem.ts           # System monitoring
        │   ├── useActivity.ts         # Activity log
        │   ├── useDailyBrief.ts       # Daily briefing
        │   ├── useSkills.ts           # Skills/commands
        │   ├── useTrips.ts            # Trip management
        │   ├── usePacking.ts          # Packing checklists
        │   ├── useSavedSearches.ts    # Travel searches
        │   ├── useContentCalendar.ts  # Content calendar
        │   └── useOpenClaw.ts         # OpenClaw
        │
        ├── components/
        │   ├── LoginScreen.tsx        # Auth UI
        │   │
        │   ├── layout/                # App shell components
        │   │   ├── Header.tsx         # Top navigation
        │   │   ├── Sidebar.tsx        # Left sidebar (9 categories)
        │   │   ├── TabBar.tsx         # Category tab switcher
        │   │   ├── DashboardGrid.tsx  # react-grid-layout container
        │   │   ├── WidgetPanel.tsx    # Reusable widget wrapper
        │   │   ├── MainContentPanel.tsx # Command result display
        │   │   ├── CommandGrid.tsx    # Command button grid
        │   │   ├── SkillsPanel.tsx    # Skills listing
        │   │   ├── SettingsPanel.tsx  # Settings modal
        │   │   └── ContentCalendar.tsx# Content calendar view
        │   │
        │   ├── chat/                  # Chat sidebar components
        │   │   ├── ChatPanel.tsx      # Chat container
        │   │   ├── ChatInput.tsx      # Message input
        │   │   ├── ChatMessage.tsx    # Message rendering
        │   │   ├── MessageList.tsx    # Message list
        │   │   ├── ToolBadge.tsx      # Tool call display
        │   │   └── ThinkingStep.tsx   # Agent thinking display
        │   │
        │   ├── widgets/               # 27 dashboard widgets
        │   │   ├── TodoWidget.tsx
        │   │   ├── NotesWidget.tsx
        │   │   ├── CalendarWidget.tsx
        │   │   ├── CalendarMonthWidget.tsx
        │   │   ├── WeatherWidget.tsx
        │   │   ├── StockWidget.tsx
        │   │   ├── NetWorthWidget.tsx
        │   │   ├── NetWorthTrendWidget.tsx
        │   │   ├── TransactionsWidget.tsx
        │   │   ├── SpendingWidget.tsx
        │   │   ├── CashflowWidget.tsx
        │   │   ├── BudgetWidget.tsx
        │   │   ├── ActivityWidget.tsx
        │   │   ├── StrideWidget.tsx
        │   │   ├── TripPlannerWidget.tsx
        │   │   ├── FlightSearchWidget.tsx
        │   │   ├── HotelSearchWidget.tsx
        │   │   ├── SystemWidget.tsx
        │   │   ├── SystemMonitorWidget.tsx
        │   │   ├── SkillsWidget.tsx
        │   │   ├── ContactsWidget.tsx
        │   │   ├── KeyDocsWidget.tsx
        │   │   ├── FamilyDocsWidget.tsx
        │   │   ├── DailyBriefWidget.tsx
        │   │   ├── PregnancyWidget.tsx
        │   │   ├── UltrasoundWidget.tsx
        │   │   ├── PackingChecklistWidget.tsx
        │   │   └── OpenClawWidget.tsx
        │   │
        │   ├── views/
        │   │   └── DailyBriefView.tsx
        │   │
        │   └── shared/
        │       ├── LoadingSpinner.tsx
        │       ├── MarkdownRenderer.tsx
        │       └── Sparkline.tsx
        │
        ├── types/                     # 17 TypeScript type definition files
        │
        ├── config/
        │   ├── commandCategories.ts   # Command definitions per category
        │   └── widgetLayouts.ts       # Default widget grid layouts
        │
        └── data/
            └── travelSuggestions.ts   # Travel destination data
```

---

## Backend Architecture

### Flask Application Factory (`app.py`)

The app is created via `create_app()` which:

1. Initializes Flask with a secret key
2. Enables CORS for all origins on `/api/*`
3. Initializes Flask-SocketIO (gevent mode on Railway, threading locally)
4. Registers 21 API blueprints
5. Registers WebSocket event handlers
6. Attaches `@app.before_request` auth middleware

### Core Modules

| Module | Responsibility |
|--------|---------------|
| `run.py` | Entry point — fixes macOS kqueue selector, auto-creates DB tables, launches SocketIO on port 5001 |
| `config.py` | Loads `.env`, sets paths for agent directory, todos, notes, Flask config |
| `db.py` | PostgreSQL connection pool (psycopg2), `query()`/`execute()` helpers, `log_activity()` |
| `router.py` | 37KB fast-path intent classifier — regex patterns for 15+ common intents |
| `profile.py` | Structured family profile and system prompt injected into all agent calls |
| `migrate.py` | One-time migration from flat files (todos.json, notes/) to PostgreSQL |

### API Blueprints (21 total)

| Category | Blueprint | Key Endpoints |
|----------|-----------|---------------|
| **Auth** | `auth` | `POST /api/auth/login`, `GET /api/auth/verify` |
| **System** | `health` | `GET /api/health` |
| **Chat** | `chat` | `POST /api/chat`, CRUD `/api/chat/sessions`, `/api/chat/sessions/<id>/messages` |
| **Productivity** | `todos` | CRUD `/api/todos` |
| | `notes` | CRUD `/api/notes` (with @mention support) |
| | `contacts` | CRUD `/api/contacts` + search |
| | `reminders` | CRUD `/api/reminders` (AppleScript on macOS) |
| **Data** | `weather` | `GET /api/weather/<location>` |
| | `stocks` | `GET /api/stocks/<ticker>` |
| | `system` | `GET /api/system/info`, `/files`, `/services` |
| | `activity` | `GET /api/activity` |
| **Finance** | `finance` | `/api/finance/accounts`, `/transactions`, `/budgets`, `/cashflow`, `/recurring`, `/net-worth-history` |
| **Calendar** | `calendar` | `/api/calendar/events`, `/today`, `/upcoming`, `/members`, `/medications` |
| **Career** | `stride` | `/api/stride/pipeline`, `/applications`, `/stats`, `/events`, `/jobs` |
| **Travel** | `travel` | `/api/travel/trips`, flights, hotels, packing, saved searches |
| **Social** | `social` | `/api/social/status`, LinkedIn OAuth2 flow |
| **Content** | `briefs` | `GET /api/briefs/daily` (news, markets, jobs aggregator) |
| | `skills` | CRUD `/api/skills` (prompt templates) |
| | `content_calendar` | `/api/content-calendar` (social scheduling) |
| | `docs` | Document parsing |
| **Integration** | `drive` | `/api/drive/status`, `/files`, `/folder/<id>` |
| | `openclaw` | `/api/openclaw/status`, `/cron`, `/memory` |

### Service Layer Pattern

Services are lazily imported inside route handlers to avoid startup failures when credentials are missing:

```python
# Example: finance.py
@finance_bp.route('/api/finance/accounts')
def get_accounts():
    from backend.services.monarch_service import get_accounts
    return jsonify(get_accounts())
```

---

## Frontend Architecture

### Navigation & Layout

The app uses state-based navigation (no router library). Nine main categories are accessible via the sidebar:

1. **Dashboard** — Overview widgets (todos, calendar, weather, stocks, activity)
2. **Daily Briefs** — Aggregated news, markets, jobs, weather
3. **Personal Finance** — Net worth, transactions, spending, budgets, cashflow
4. **Family Calendar** — Events, monthly view, family docs
5. **Health & Wellness** — Pregnancy tracking, wellness commands
6. **Travel Planning** — Trips, flights, hotels, packing
7. **Kids Education** — Education-focused commands
8. **Career Growth** — Stride job pipeline widget
9. **Claude Skills** — Prompt templates, content calendar

Each category renders either a **widget grid** (drag-and-drop dashboard) or a **command grid** (clickable prompt buttons), with results displayed in the **MainContentPanel**.

### State Management (Zustand)

| Store | Persisted | Purpose |
|-------|-----------|---------|
| `authStore` | localStorage | JWT token, login/logout/verify |
| `layoutStore` | localStorage (v9) | Widget positions per page, per breakpoint (lg/md/sm) |
| `settingsStore` | localStorage (v4) | Stock watchlist, weather locations, home airport, passengers |
| `insightStore` | No | Ephemeral trigger for widget → chat AI insight requests |
| `travelStore` | Partial | Active trip context persisted; search results ephemeral |

### Custom Hooks Pattern

All 17 hooks follow a consistent pattern:

```typescript
export function useXxx() {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => { /* fetch */ }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (...) => { /* create + refresh */ }, [refresh]);
  const update = useCallback(async (...) => { /* update + refresh */ }, [refresh]);
  const remove = useCallback(async (...) => { /* delete + refresh */ }, [refresh]);

  return { data, loading, error, refresh, add, update, remove };
}
```

### Widget System

27 self-contained widgets, each:
- Fetches its own data via a custom hook
- Is wrapped in `WidgetPanel` for consistent header, icon, and insight button
- Can be dragged and resized within `react-grid-layout`
- Supports responsive breakpoints (lg = 3-across, md = 2-across, sm = stacked)

### API Client (`api/client.ts`)

```typescript
// All requests auto-attach Bearer token from authStore
// Auto-logout on 401 Unauthorized
export async function apiGet<T>(path: string): Promise<T>
export async function apiPost<T>(path: string, body: unknown): Promise<T>
export async function apiPut<T>(path: string, body: unknown): Promise<T>
export async function apiDelete<T>(path: string): Promise<T>
```

Vite dev server proxies `/api/*` and `/socket.io` to `localhost:5001`.

---

## Agent System & Intent Routing

### Dual-Path Architecture

```
User Message
     │
     ▼
┌─────────────┐     Match found      ┌──────────────────┐
│  Fast-Path  │ ───────────────────→  │  Direct Response  │  ~10-50ms
│   Router    │                       │  (no LLM call)    │
│ (router.py) │                       └──────────────────┘
└──────┬──────┘
       │ No match / complex signal
       ▼
┌─────────────┐                       ┌──────────────────┐
│  LangChain  │ ───────────────────→  │  Streamed via    │  ~2-10s
│ ReAct Agent │                       │  WebSocket       │
│ (30 tools)  │                       └──────────────────┘
└─────────────┘
```

### Fast-Path Router (`router.py`)

Regex-based pattern matching for ~15 common intents:

| Intent | Pattern Example | Response |
|--------|----------------|----------|
| `greeting` | "hi", "hello", "hey" | Personalized greeting |
| `datetime` | "what time", "what's the date" | Current date/time |
| `weather` | "weather in NYC" | Open-Meteo API call |
| `stocks` | "AAPL price" | yfinance lookup |
| `watchlist` | "how are my stocks" | Batch watchlist lookup |
| `todo_add` | "add X to my todos" | Direct DB insert |
| `todo_list` | "show my todos" | DB query |
| `note_list` | "show my notes" | DB query |
| `system` | "CPU usage" | psutil system info |
| `news` | "what's happening" | SerpAPI news search |
| `calendar_today` | "what's on today" | Kindora API call |
| `calendar_family` | "Sebby's schedule" | Filtered calendar query |
| `finance_accounts` | "how much money" | Monarch Money query |
| `finance_budgets` | "budget status" | Monarch budgets |
| `finance_transactions` | "recent transactions" | Monarch transactions |

**Complex query signals** — keywords like "compare", "analyze", "why", "write", "search web" force the full agent path.

### LangChain ReAct Agent

- **LLM**: OpenAI `gpt-4o-mini` (temperature=0)
- **Framework**: LangChain ReAct (Reasoning + Acting)
- **Executor**: `AgentExecutor` with `max_iterations=25`, error handling enabled
- **Prompt**: Includes `FAMILY_PROFILE` context from `profile.py`

**30 Tools across 7 categories:**

| Category | Tools |
|----------|-------|
| Web & Research | Search (SerpAPI), Wikipedia, WebScraper, Weather |
| Data Analysis | ParseCSV, ParseJSON, APIRequest, StockPrice, CurrencyConvert |
| Productivity | Todo, Timer, Notes, SendEmail |
| System | GetDateTime, Shell, Python REPL, ReadFile, WriteFile |
| AI/LLM | Summarize, Translate, Sentiment, Rewrite |
| Developer | Git, Regex, SQLite, Docker, FormatJSON |
| Finance | PersonalFinance (Monarch Money interface) |

### Streaming Callbacks (`callbacks.py`)

Queue-based event streaming from the agent lifecycle:

| Callback | Event | Description |
|----------|-------|-------------|
| `on_llm_new_token()` | Token stream | Individual tokens as generated |
| `on_agent_action()` | Tool invocation | Tool name and input |
| `on_tool_end()` | Tool result | Output (truncated to 2000 chars) |
| `on_agent_finish()` | Final response | Complete answer |
| `on_llm_error()` | Error | LLM error details |
| `on_chain_error()` | Error | Chain error details |

---

## Database Schema

PostgreSQL with auto-created tables on startup:

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `todos` | id, task, done, created_at, updated_at | Task management |
| `notes` | id, title, content, created_at, updated_at | Rich notes |
| `note_mentions` | id, note_id, contact_id | @mention junction table |
| `contacts` | id, name, company, email, phone, notes, created_at, updated_at | Contact database |
| `chat_sessions` | id, title, created_at, updated_at | Conversation sessions |
| `chat_messages` | id, session_id, role, content, tool_calls, thinking_steps, created_at | Message persistence |
| `activity_log` | id, source, event_type, summary, metadata, created_at | Audit trail |
| `content_calendar` | id, batch_id, platform, scheduled_date, week_number, title, body, hashtags, status, published_url, published_at | Social media drafts |
| `social_oauth_tokens` | id, platform, access_token, refresh_token, token_type, expires_at, scope, raw_response | OAuth2 tokens |
| `trips` | id, destination, start_date, end_date, notes, status, airports | Travel planning |
| `packing_items` | id, trip_id, category, item, packed | Packing checklists |
| `saved_searches` | id, search_type, label, destination, url, metadata, trip_id | Saved travel searches |

---

## Authentication

- **Method**: Token-based Bearer authentication with bcrypt password hashing
- **Login**: `POST /api/auth/login` — accepts password, returns Bearer token
- **Verify**: `GET /api/auth/verify` — validates token via `Authorization` header
- **Storage**: Tokens stored in an in-memory set (server restart clears all sessions)
- **Middleware**: `@app.before_request` checks `Authorization` header on all `/api/*` routes
- **Exemptions**: `/`, `/api/auth/*`, `/api/social/linkedin/callback`, localhost requests (127.0.0.1, ::1)
- **Frontend**: Token persisted in localStorage via Zustand `authStore`; auto-logout on 401

---

## Real-Time Communication

### WebSocket Events (Socket.IO)

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:thinking` | `{ text }` | Agent thinking/reasoning step |
| `chat:tool_start` | `{ tool, input }` | Tool execution begins |
| `chat:tool_result` | `{ output }` | Tool execution result |
| `chat:done` | `{ response, toolCalls }` | Final response ready |
| `chat:error` | `{ error }` | Error occurred |

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | `{ token }` (query param) | Authenticate WebSocket |
| `chat:send` | `{ message }` | Send user message |

**Flow:**
1. User types message → `socket.emit('chat:send', { message })`
2. Backend classifies intent (fast-path or full agent)
3. During agent execution, streaming events emitted in real-time
4. `chat:done` signals completion; message persisted to database
5. Timeout: 120 seconds per query

---

## External Service Integrations

| Service | Module | Protocol | Auth | Purpose |
|---------|--------|----------|------|---------|
| **OpenAI** | `agent/langchain_agent.py` | REST | API key | LLM reasoning (gpt-4o-mini) |
| **SerpAPI** | `agent/langchain_agent.py`, `router.py` | REST | API key | Web search, news |
| **Monarch Money** | `services/monarch_service.py` | GraphQL (async→sync bridge) | Email/password + session | Personal finance (accounts, transactions, budgets, cashflow, net worth) |
| **Kindora** | `services/kindora_service.py` | GraphQL | API key | Family calendar events, medications, care documents |
| **Stride** | `services/stride_service.py` | GraphQL | API key | Job applications, pipeline, interview events |
| **Google Drive** | `api/drive.py` | REST | Service account JSON | File listing and folder browsing |
| **LinkedIn** | `services/linkedin_service.py` | REST | OAuth2 (client ID/secret) | Profile, posting |
| **Twitter/X** | `services/twitter_service.py` | REST | API keys + tokens | Social posting |
| **Open-Meteo** | `router.py` | REST | None (free) | Weather forecasting |
| **wttr.in** | `router.py` | REST | None (free) | Weather fallback |
| **yfinance** | `router.py`, `api/stocks.py` | Python lib | None | Stock market data |
| **Wikipedia** | `agent/langchain_agent.py` | Python lib | None | Knowledge lookups |
| **Apple Reminders** | `api/reminders.py` | AppleScript (macOS) | iCloud CalDAV | Native reminders integration |
| **SkyScanner/Kiwi** | `services/flight_search_service.py` | REST | API key | Flight search |
| **Hotels** | `services/hotel_search_service.py` | Scraping | — | Hotel search |

---

## Deployment & Infrastructure

### Local Development

```bash
# Backend (port 5001)
cd langly && python3 -m backend.run

# Frontend (port 5173, proxies to backend)
cd langly/frontend && npm run dev
```

### Production

| Component | Platform | Config File |
|-----------|----------|-------------|
| Frontend | Vercel | Auto-detected (Vite) |
| Backend | Railway | `railway.toml` + `Dockerfile` |
| Backend (alt) | Heroku | `Procfile` + `runtime.txt` |
| Database | PostgreSQL (Railway/Heroku addon) | `DATABASE_URL` env var |

### Docker

```dockerfile
FROM python:3.11-slim
# System deps: gcc, libpq-dev
# Gunicorn + GeventWebSocket worker (1 worker)
# Port: $PORT (default 5001)
# Timeout: 120s
```

### Railway Config

- Builder: Dockerfile
- Health check: `GET /api/health` (30s timeout)
- Restart policy: On failure (3 retries)

### Google Apps Script (`scripts/sync_drive_shortcuts.gs`)

Automated daily sync (6 AM) that creates shortcuts to recently modified Drive files in a "Langly Intel" folder for agent access.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| **Core** | | |
| `OPENAI_API_KEY` | Yes | OpenAI API key for LLM |
| `SERPAPI_API_KEY` | Yes | SerpAPI for web search |
| `FLASK_SECRET_KEY` | Yes | Flask session secret |
| `LANGLY_PASSWORD_HASH` | Yes | bcrypt hash for login |
| `DATABASE_URL` | Yes (prod) | PostgreSQL connection string |
| `PORT` | No | Server port (default: 5001) |
| `FLASK_DEBUG` | No | Debug mode (default: false) |
| `LANGCHAIN_AGENT_PATH` | No | External agent directory |
| **Monarch Money** | | |
| `MONARCH_EMAIL` | No | Account email |
| `MONARCH_PASSWORD` | No | Account password |
| **Kindora Calendar** | | |
| `KINDORA_BASE_URL` | No | API endpoint |
| `KINDORA_API_KEY` | No | API key |
| `KINDORA_FAMILY_ID` | No | Family identifier |
| **Stride** | | |
| `STRIDE_BASE_URL` | No | API endpoint |
| `STRIDE_API_KEY` | No | API key |
| **Google Drive** | | |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | No | Path to service account JSON |
| **LinkedIn** | | |
| `LINKEDIN_CLIENT_ID` | No | OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | No | OAuth client secret |
| `LINKEDIN_REDIRECT_URI` | No | OAuth callback URL |
| **Twitter/X** | | |
| `TWITTER_API_KEY` | No | API key |
| `TWITTER_API_SECRET` | No | API secret |
| `TWITTER_ACCESS_TOKEN` | No | Access token |
| `TWITTER_ACCESS_TOKEN_SECRET` | No | Token secret |
| **Apple Reminders** | | |
| `APPLE_ID` | No | iCloud email |
| `APPLE_APP_PASSWORD` | No | App-specific password |
| `APPLE_REMINDER_LIST` | No | Reminders list name |
