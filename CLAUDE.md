# Langly — Project Guidelines

> "Your Personal Central Intelligence Agent"

## Stack

- **Backend**: Flask + Flask-SocketIO (port 5001), Python 3.9+
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + Vite 7 (port 5173)
- **Database**: PostgreSQL (`langly` db, user `michaelvicenzino`, Unix socket `host=/tmp`)
- **Agent**: 30-tool LangChain ReAct agent at `~/langchain-agent/`
- **State**: Zustand stores (auth, layout, travel, insights, settings)
- **Real-time**: Socket.IO with `async_mode="threading"` + `simple-websocket`

## Running Locally

```bash
# Backend
python3 ~/langly/backend/run.py    # port 5001

# Frontend
cd ~/langly/frontend && npm run dev  # port 5173
```

## macOS Gotchas (Critical)

- **Port 5000**: Reserved by AirPlay — always use 5001
- **kqueue broken**: System Python 3.9 needs `selectors.DefaultSelector = selectors.SelectSelector` at top of `run.py`
- **eventlet broken**: Use `async_mode="threading"`, never eventlet
- **PostgreSQL**: Use `host=/tmp` (Unix socket), NOT `host=localhost` (TCP trust auth issue with Postgres.app)
- **Python 3.9 syntax**: Use `from __future__ import annotations` and `Optional[dict]` instead of `dict | None`
- **Monarch Money SSL**: System Python LibreSSL can't login — fallback re-login uses `/opt/homebrew/bin/python3.13`

## Architecture

### Backend (`backend/`)

- `run.py` — Entry point (SocketIO server)
- `app.py` — Flask app factory, registers 21 API blueprints
- `db.py` — PostgreSQL connection pooling (psycopg2, threaded pool 1-10)
- `api/` — 21 REST blueprints (auth, chat, stocks, weather, todos, notes, finance, calendar, drive, travel, etc.)
- `agent/` — LangChain agent wrapper (langchain_agent.py, wrapper.py, callbacks.py)
- `services/` — External integrations (monarch, kindora, stride, gmail, linkedin, twitter, flights, hotels)
- `sockets/` — WebSocket handlers (chat streaming, travel search)

### Frontend (`frontend/src/`)

- `App.tsx` — Main routing component (large file, all view switching)
- `api/` — 16 API client modules (base client at `client.ts`)
- `components/chat/` — Chat panel, input, messages, thinking steps
- `components/layout/` — Sidebar, TabBar, Header, DashboardGrid, WidgetPanel
- `components/widgets/` — 34+ widget components (stocks, weather, finance, calendar, etc.)
- `components/views/` — Full-page views (DailyBrief, Projects, Stride)
- `hooks/` — 17 custom hooks encapsulating API/data logic
- `store/` — Zustand stores (authStore, layoutStore, travelStore, insightStore, settingsStore)
- `types/` — TypeScript type definitions (17 files)
- `config/commandCategories.ts` — 10 command categories, ~55 commands

### Query Processing (Dual-Path)

- **Fast path** (~80% of queries, <50ms): Regex pattern matching in router
- **Full agent** (complex queries, 2-10s): LangChain ReAct agent with 30 tools

## Coding Conventions

- **Backend**: Flask blueprints for API modules, services for external integrations, keep them separate
- **Frontend**: One widget per file, custom hooks for data fetching, Zustand for shared state
- **Theme**: "Minority Report" futuristic glassmorphism with color-coded widget accents
- **Layout**: Application-style sidebar + tabs (NOT SaaS grid), persistent chat panel on right
- **Streaming**: Token-level WebSocket updates for chat responses

## External Integrations

| Service | Package/Protocol | Notes |
|---------|-----------------|-------|
| Monarch Money | `monarchmoneycommunity` | Token auth via browser extraction, NOT `monarchmoney` |
| Kindora Calendar | HTTP REST | API key via `X-API-Key` header, `ws://127.0.0.1:18789` |
| Stride | HTTP REST | Job tracker at stride-feature-branch.vercel.app |
| OpenClaw | WebSocket | Personal AI gateway at `ws://127.0.0.1:18789` |
| Google Drive | Service account | Credentials at `langly-drive-sa.json` |
| Gmail | OAuth2 | Via `gmail_service.py` |

## Testing Checklist

- After widget changes: verify the widget renders with real and empty data states
- After API changes: test both the fast-path router and full agent path
- After layout changes: check sidebar, tabs, chat panel, and widget grid together
- After service changes: verify error handling for when external services are down
- User context: Michael, avatar "M", Morristown NJ, stocks: AAPL/TSLA/GOOGL/SNOW/PLTR
