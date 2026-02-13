"""Fast-path intent router — skips the full LangChain agent for simple queries.

Pattern-matches user messages and routes to direct API calls when intent is clear.
Falls back to the full agent for complex/ambiguous queries.
"""

from __future__ import annotations

import re
from datetime import datetime

# Default location for weather when none specified
DEFAULT_LOCATION = "Morristown, NJ"

# ── Pattern definitions ──────────────────────────────────────────────────────

GREETING_PATTERNS = re.compile(
    r"^(hey|hi|hello|howdy|yo|sup|what'?s up|good (morning|afternoon|evening)|greetings)\b",
    re.IGNORECASE,
)

WEATHER_PATTERNS = re.compile(
    r"\b(weather|temperature|temp|forecast|rain|snow|sunny|cloudy|humid|wind)\b",
    re.IGNORECASE,
)

STOCK_PATTERNS = re.compile(
    r"\b(stock|stocks|price|ticker|market|share|shares|portfolio|watchlist)\b",
    re.IGNORECASE,
)

# Match explicit tickers like AAPL, TSLA — 1-5 uppercase letters
TICKER_RE = re.compile(r"\b([A-Z]{1,5})\b")

# Known tickers for matching in natural language
KNOWN_TICKERS = {
    "AAPL", "TSLA", "GOOGL", "GOOG", "MSFT", "AMZN", "META", "NVDA", "AMD",
    "NFLX", "SNOW", "PLTR", "SPY", "QQQ", "DIS", "BABA", "INTC", "UBER",
    "LYFT", "SQ", "SHOP", "PYPL", "COIN", "ROKU", "SNAP", "PINS", "TWLO",
    "CRM", "ORCL", "IBM", "BA", "JPM", "GS", "V", "MA", "WMT", "TGT",
}

TICKER_NAME_MAP = {
    "apple": "AAPL", "tesla": "TSLA", "google": "GOOGL", "alphabet": "GOOGL",
    "microsoft": "MSFT", "amazon": "AMZN", "meta": "META", "facebook": "META",
    "nvidia": "NVDA", "amd": "AMD", "netflix": "NFLX", "snowflake": "SNOW",
    "palantir": "PLTR", "disney": "DIS", "uber": "UBER", "spotify": "SPOT",
    "shopify": "SHOP", "paypal": "PYPL", "coinbase": "COIN", "intel": "INTC",
    "salesforce": "CRM", "oracle": "ORCL", "ibm": "IBM", "boeing": "BA",
    "walmart": "WMT", "target": "TGT", "visa": "V", "mastercard": "MA",
}

TODO_PATTERNS = re.compile(
    r"\b(todos?|to-?dos?|tasks?|todo list|task list)\b",
    re.IGNORECASE,
)

TODO_ADD_PATTERNS = re.compile(
    r"\b(add|create|new|make)\b.+\b(todos?|to-?dos?|tasks?)\b|\b(todos?|to-?dos?|tasks?)\b.+\b(add|create)\b",
    re.IGNORECASE,
)

NOTES_PATTERNS = re.compile(
    r"\b(notes?|notebook)\b",
    re.IGNORECASE,
)

TIME_PATTERNS = re.compile(
    r"\b(what time|current time|date and time|what date|today'?s date|what day)\b",
    re.IGNORECASE,
)

SYSTEM_PATTERNS = re.compile(
    r"\b(system (status|info|stats)|cpu|memory|disk|uptime)\b",
    re.IGNORECASE,
)

NEWS_PATTERNS = re.compile(
    r"\b(news|headline|headlines|digest|briefing|brief me|what'?s happening|current events)\b",
    re.IGNORECASE,
)

CALENDAR_PATTERNS = re.compile(
    r"\b(calendar|schedule|agenda|event|events|appointment|appointments|"
    r"what'?s\s+on|what'?s\s+happening|family\s+schedule|sebby'?s\s+schedule|"
    r"kindora|upcoming\s+events?|today'?s\s+(?:schedule|agenda|events?))\b",
    re.IGNORECASE,
)

CALENDAR_ADD_PATTERNS = re.compile(
    r"\b(add|create|schedule|book|set up|plan)\b.+\b(event|appointment|meeting|visit)\b|"
    r"\b(event|appointment|meeting|visit)\b.+\b(add|create|schedule|book)\b",
    re.IGNORECASE,
)

FINANCE_PATTERNS = re.compile(
    r"\b(net\s*worth|balance|balances|bank|banks|account|accounts|budget|budgets|"
    r"spending|expenses?|income|cashflow|cash\s*flow|savings?|"
    r"recurring|subscriptions?|bills?|credit\s*card|mortgage|loan|"
    r"personal\s*financ|monarch|how\s*much\s+(?:do\s+i|money))\b",
    re.IGNORECASE,
)

# Signals that the query is complex and needs the full agent
COMPLEX_SIGNALS = re.compile(
    r"\b(compare|analyze|explain|why|how does|write|create a|generate|summarize|translate|"
    r"search the web|look up|find me|research|calculate|convert|send email|"
    r"and also|and then|after that|help me)\b",
    re.IGNORECASE,
)


def _extract_location(message: str) -> str:
    """Pull a location from the message, or return default."""
    # "weather in <location>" or "weather for <location>"
    match = re.search(r"(?:weather|temperature|forecast)\s+(?:in|for|at)\s+(.+?)(?:\?|$|\.)", message, re.IGNORECASE)
    if match:
        return match.group(1).strip().rstrip("?. ")

    # "what's it like in <location>"
    match = re.search(r"(?:like|conditions?)\s+in\s+(.+?)(?:\?|$|\.)", message, re.IGNORECASE)
    if match:
        return match.group(1).strip().rstrip("?. ")

    return DEFAULT_LOCATION


def _extract_tickers(message: str) -> list[str]:
    """Extract stock tickers from the message."""
    tickers = []

    # Check for known company names
    lower = message.lower()
    for name, ticker in TICKER_NAME_MAP.items():
        if name in lower:
            tickers.append(ticker)

    # Check for uppercase ticker symbols
    for match in TICKER_RE.finditer(message):
        candidate = match.group(1)
        if candidate in KNOWN_TICKERS and candidate not in tickers:
            tickers.append(candidate)

    return tickers


def _extract_todo_task(message: str) -> str | None:
    """Extract the task text from an 'add todo' message."""
    # "add X to my todos" or "add todo X"
    patterns = [
        r'add\s+"([^"]+)"',                          # add "task text"
        r"add\s+'([^']+)'",                           # add 'task text'
        r"add\s+(.+?)\s+to\s+(?:my\s+)?(?:todo|task)", # add X to my todos
        r"(?:add|create)\s+(?:a\s+)?(?:todo|task)\s*:?\s*(.+?)(?:\.|$)",  # add todo: X
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            return match.group(1).strip().rstrip("?. ")
    return None


# ── Route function ───────────────────────────────────────────────────────────

def classify(message: str) -> dict | None:
    """Classify user intent and return a fast-path route, or None for full agent.

    Returns dict with:
        route: str — the fast-path handler name
        params: dict — extracted parameters
        label: str — human-readable description for the UI
    """
    msg = message.strip()

    # If the message has complex signals, always use the full agent
    if COMPLEX_SIGNALS.search(msg):
        return None

    # Very short greetings — instant response, no tools needed
    if GREETING_PATTERNS.match(msg) and len(msg.split()) <= 5:
        return {"route": "greeting", "params": {}, "label": "Greeting"}

    # Date/time
    if TIME_PATTERNS.search(msg):
        return {"route": "datetime", "params": {}, "label": "Date & Time"}

    # Weather
    if WEATHER_PATTERNS.search(msg):
        location = _extract_location(msg)
        return {"route": "weather", "params": {"location": location}, "label": f"Weather: {location}"}

    # Stock queries — match on keywords OR when a known ticker/company name appears
    tickers = _extract_tickers(msg)
    has_stock_keywords = STOCK_PATTERNS.search(msg)
    if has_stock_keywords or tickers:
        if tickers:
            return {"route": "stocks", "params": {"tickers": tickers}, "label": f"Stocks: {', '.join(tickers)}"}
        # General "how are my stocks" → use watchlist
        if re.search(r"\b(my stocks|my portfolio|watchlist)\b", msg, re.IGNORECASE):
            return {"route": "watchlist", "params": {}, "label": "Watchlist"}

    # Add todo
    if TODO_ADD_PATTERNS.search(msg):
        task_text = _extract_todo_task(msg)
        if task_text:
            return {"route": "todo_add", "params": {"task": task_text}, "label": f"Add todo: {task_text}"}

    # List todos
    if TODO_PATTERNS.search(msg) and not TODO_ADD_PATTERNS.search(msg):
        return {"route": "todo_list", "params": {}, "label": "Todos"}

    # Notes
    if NOTES_PATTERNS.search(msg):
        return {"route": "note_list", "params": {}, "label": "Notes"}

    # System info
    if SYSTEM_PATTERNS.search(msg):
        return {"route": "system", "params": {}, "label": "System Info"}

    # News / briefings
    if NEWS_PATTERNS.search(msg):
        return {"route": "news", "params": {"query": msg}, "label": "News Digest"}

    # Family calendar — Kindora
    if CALENDAR_PATTERNS.search(msg) and not CALENDAR_ADD_PATTERNS.search(msg):
        lower = msg.lower()
        if re.search(r"\b(today|this morning|tonight|today'?s)\b", lower):
            return {"route": "calendar_today", "params": {}, "label": "Today's Calendar"}
        if re.search(r"\b(this week|next few days|upcoming|next \d+ days)\b", lower):
            days_match = re.search(r"next (\d+) days", lower)
            days = int(days_match.group(1)) if days_match else 7
            return {"route": "calendar_week", "params": {"days": days}, "label": "Upcoming Events"}
        if re.search(r"\b(family\s*members?|who'?s\s+in)\b", lower):
            return {"route": "calendar_family", "params": {}, "label": "Family Members"}
        # Default: today's events
        return {"route": "calendar_today", "params": {}, "label": "Today's Calendar"}

    # Personal finance — Monarch Money
    if FINANCE_PATTERNS.search(msg):
        lower = msg.lower()
        if re.search(r"\b(budget|spending|expenses?)\b", lower):
            return {"route": "finance_budgets", "params": {}, "label": "Budgets"}
        if re.search(r"\b(transaction|recent\s*(charges?|purchases?))\b", lower):
            return {"route": "finance_transactions", "params": {}, "label": "Transactions"}
        if re.search(r"\b(cashflow|cash\s*flow|income|savings?)\b", lower):
            return {"route": "finance_overview", "params": {}, "label": "Financial Overview"}
        # Default: accounts + net worth
        return {"route": "finance_accounts", "params": {}, "label": "Accounts & Net Worth"}

    return None


# ── Fast-path executors ──────────────────────────────────────────────────────

def execute_fast(route_info: dict) -> dict:
    """Execute a fast-path route and return the result.

    Returns dict with:
        response: str — formatted response text
        tool: str — tool name for UI display
        data: dict — raw data for potential widget use
    """
    route = route_info["route"]
    params = route_info["params"]

    if route == "greeting":
        return _handle_greeting()
    elif route == "datetime":
        return _handle_datetime()
    elif route == "weather":
        return _handle_weather(params["location"])
    elif route == "stocks":
        return _handle_stocks(params["tickers"])
    elif route == "watchlist":
        return _handle_watchlist()
    elif route == "todo_list":
        return _handle_todo_list()
    elif route == "todo_add":
        return _handle_todo_add(params["task"])
    elif route == "note_list":
        return _handle_note_list()
    elif route == "system":
        return _handle_system()
    elif route == "news":
        return _handle_news(params["query"])
    elif route == "calendar_today":
        return _handle_calendar_today()
    elif route == "calendar_week":
        return _handle_calendar_week(params.get("days", 7))
    elif route == "calendar_family":
        return _handle_calendar_family()
    elif route == "finance_accounts":
        return _handle_finance_accounts()
    elif route == "finance_transactions":
        return _handle_finance_transactions()
    elif route == "finance_budgets":
        return _handle_finance_budgets()
    elif route == "finance_overview":
        return _handle_finance_overview()
    else:
        return {"response": "I'm not sure how to handle that.", "tool": None, "data": {}}


def _handle_greeting():
    hour = datetime.now().hour
    if hour < 12:
        greeting = "Good morning, Michael!"
    elif hour < 17:
        greeting = "Good afternoon, Michael!"
    else:
        greeting = "Good evening, Michael!"

    now = datetime.now()
    day = now.strftime("%A")
    date = now.strftime("%B %d")
    tips = []
    if hour < 12:
        tips.append("Ready to tackle the day — what's the priority?")
    elif hour >= 21:
        tips.append("Winding down? I can help plan tomorrow or catch up on news.")
    else:
        tips.append("How can I help you and the family?")

    return {
        "response": f"{greeting} It's {day}, {date}. {tips[0]}",
        "tool": None,
        "data": {},
    }


def _handle_datetime():
    now = datetime.now()
    formatted = now.strftime("%A, %B %d, %Y at %I:%M %p")
    return {
        "response": f"It's **{formatted}**.",
        "tool": "DateTime",
        "data": {"datetime": now.isoformat()},
    }


_US_STATES = {
    "AL": "alabama", "AK": "alaska", "AZ": "arizona", "AR": "arkansas", "CA": "california",
    "CO": "colorado", "CT": "connecticut", "DE": "delaware", "FL": "florida", "GA": "georgia",
    "HI": "hawaii", "ID": "idaho", "IL": "illinois", "IN": "indiana", "IA": "iowa",
    "KS": "kansas", "KY": "kentucky", "LA": "louisiana", "ME": "maine", "MD": "maryland",
    "MA": "massachusetts", "MI": "michigan", "MN": "minnesota", "MS": "mississippi",
    "MO": "missouri", "MT": "montana", "NE": "nebraska", "NV": "nevada", "NH": "new hampshire",
    "NJ": "new jersey", "NM": "new mexico", "NY": "new york", "NC": "north carolina",
    "ND": "north dakota", "OH": "ohio", "OK": "oklahoma", "OR": "oregon", "PA": "pennsylvania",
    "RI": "rhode island", "SC": "south carolina", "SD": "south dakota", "TN": "tennessee",
    "TX": "texas", "UT": "utah", "VT": "vermont", "VA": "virginia", "WA": "washington",
    "WV": "west virginia", "WI": "wisconsin", "WY": "wyoming", "DC": "district of columbia",
}


def _resolve_state(hint: str) -> str:
    """Resolve a state abbreviation or name to lowercase full name."""
    upper = hint.upper()
    if upper in _US_STATES:
        return _US_STATES[upper]
    return hint.lower()


def _handle_weather(location: str):
    import requests

    # Use Open-Meteo — fast, free, no API key, reliable
    try:
        # Clean location and split city/state for better matching
        clean_loc = location.replace("+", " ").replace(",", " ").strip()
        parts = [p.strip() for p in re.split(r"[,\s]+", clean_loc) if p.strip()]
        search_name = parts[0] if parts else clean_loc  # Search by city name
        state_hint = parts[1] if len(parts) > 1 else None

        geo = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": search_name, "count": 5},
            timeout=4,
        ).json()

        results = geo.get("results", [])
        # If state hint provided, try to match it
        place = None
        if state_hint and results:
            hint = _resolve_state(state_hint)
            for r in results:
                admin = (r.get("admin1") or "").lower()
                if hint in admin or admin.startswith(hint):
                    place = r
                    break
        if not place:
            place = results[0] if results else {}
        lat = place.get("latitude")
        lon = place.get("longitude")
        place_name = place.get("name", location)
        admin = place.get("admin1", "")

        if not lat or not lon:
            return {"response": f"Couldn't find location: {location}", "tool": "Weather", "data": {}}

        wx = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
                "daily": "temperature_2m_max,temperature_2m_min,weather_code",
                "temperature_unit": "fahrenheit",
                "wind_speed_unit": "mph",
                "forecast_days": 3,
            },
            timeout=4,
        ).json()

        cur = wx.get("current", {})
        temp = cur.get("temperature_2m", "?")
        feels = cur.get("apparent_temperature", "?")
        humid = cur.get("relative_humidity_2m", "?")
        wind_spd = cur.get("wind_speed_10m", "?")
        code = cur.get("weather_code", 0)
        desc = _wmo_description(code)

        display_loc = f"{place_name}, {admin}" if admin else place_name

        response = (
            f"**{display_loc}** — {desc}\n\n"
            f"- **Temperature:** {temp}°F (feels like {feels}°F)\n"
            f"- **Humidity:** {humid}%\n"
            f"- **Wind:** {wind_spd} mph"
        )

        daily = wx.get("daily", {})
        dates = daily.get("time", [])
        maxes = daily.get("temperature_2m_max", [])
        mins = daily.get("temperature_2m_min", [])
        codes = daily.get("weather_code", [])
        if dates:
            response += "\n\n**Forecast:**\n"
            for d, hi, lo, c in zip(dates, maxes, mins, codes):
                response += f"- {d}: {lo}°F – {hi}°F {_wmo_description(c)}\n"

        return {"response": response, "tool": "Weather", "data": wx}
    except Exception as e:
        return {"response": f"Couldn't fetch weather for {location}: {e}", "tool": "Weather", "data": {}}


def _wmo_description(code: int) -> str:
    """Convert WMO weather code to human description."""
    wmo = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle",
        55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
        71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
        80: "Light showers", 81: "Showers", 82: "Heavy showers",
        85: "Light snow showers", 86: "Snow showers",
        95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm",
    }
    return wmo.get(code, "Unknown")


def _handle_stocks(tickers: list[str]):
    import yfinance as yf

    lines = []
    raw = []
    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
            prev = info.get("previousClose") or info.get("regularMarketPreviousClose", 0)
            change = price - prev if price and prev else 0
            pct = (change / prev * 100) if prev else 0
            name = info.get("shortName", ticker)
            arrow = "+" if change >= 0 else ""
            lines.append(f"**{name}** ({ticker}): **${price:.2f}** ({arrow}{change:.2f}, {arrow}{pct:.1f}%)")
            raw.append({"ticker": ticker, "price": price, "change": change, "pct": pct, "name": name})
        except Exception:
            lines.append(f"**{ticker}**: Unable to fetch data")
            raw.append({"ticker": ticker, "error": True})

    return {"response": "\n".join(lines), "tool": "Stocks", "data": raw}


def _handle_watchlist():
    # Use default watchlist tickers
    return _handle_stocks(["AAPL", "TSLA", "GOOGL", "SNOW", "PLTR"])


def _handle_todo_list():
    from backend.db import query
    todos = query("SELECT id, task, done, created_at FROM todos ORDER BY created_at DESC")
    if not todos:
        return {"response": "Your todo list is empty. Add one with \"Add [task] to my todos\".", "tool": "Todos", "data": []}

    lines = []
    for t in todos:
        check = "[x]" if t["done"] else "[ ]"
        lines.append(f"- {check} {t['task']}")

    total = len(todos)
    done = sum(1 for t in todos if t["done"])
    header = f"**Todos** ({done}/{total} complete)\n\n"

    return {"response": header + "\n".join(lines), "tool": "Todos", "data": todos}


def _handle_todo_add(task: str):
    from backend.db import execute_returning, log_activity
    todo = execute_returning(
        "INSERT INTO todos (task, done) VALUES (%s, %s) RETURNING id, task, done, created_at",
        (task, False),
    )
    log_activity("todos", "created", f"Created todo: {task}")
    return {
        "response": f"Added to your todos: **{task}**",
        "tool": "Todos",
        "data": todo,
    }


def _handle_note_list():
    from backend.db import query
    notes = query("SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC")
    if not notes:
        return {"response": "No notes yet.", "tool": "Notes", "data": []}

    lines = [f"**Notes** ({len(notes)} total)\n"]
    for n in notes:
        lines.append(f"- {n['title']}")

    return {"response": "\n".join(lines), "tool": "Notes", "data": notes}


def _handle_system():
    import platform
    import os

    try:
        import psutil
        cpu = psutil.cpu_percent(interval=0.5)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        response = (
            f"**System Status** — {platform.node()}\n\n"
            f"- **CPU:** {cpu}% ({os.cpu_count()} cores)\n"
            f"- **Memory:** {mem.percent}% ({mem.used // (1024**3):.1f} / {mem.total // (1024**3):.1f} GB)\n"
            f"- **Disk:** {disk.percent}% ({disk.used // (1024**3):.0f} / {disk.total // (1024**3):.0f} GB)\n"
            f"- **OS:** {platform.system()} {platform.release()}"
        )
    except ImportError:
        load = os.getloadavg()
        response = (
            f"**System Status** — {platform.node()}\n\n"
            f"- **Load:** {load[0]:.2f}, {load[1]:.2f}, {load[2]:.2f}\n"
            f"- **OS:** {platform.system()} {platform.release()}"
        )

    return {"response": response, "tool": "System", "data": {}}


# ── User news profile (loaded from backend.profile) ──────────────────────────

try:
    from backend.profile import NEWS_SECTIONS as _PROFILE_NEWS_SECTIONS
except ImportError:
    _PROFILE_NEWS_SECTIONS = [
        {"name": "Politics", "query": "US politics Congress White House"},
        {"name": "Tech & AI", "query": "AI technology artificial intelligence news today"},
        {"name": "NYC / NJ Metro", "query": "New Jersey New York City NJ NYC metro area local news"},
        {"name": "Markets & Business", "query": "stock market Wall Street business earnings"},
    ]

_NEWS_EXTRAS = ["drudgereport", "x_trending"]
_NEWS_MAX_PER_SECTION = 4


def _handle_news(query: str):
    """Fetch personalized news digest — sequential fetches to avoid thread issues."""
    import os
    import requests

    api_key = os.getenv("SERPAPI_API_KEY", "")
    if not api_key:
        return {"response": "News search not configured (missing SerpAPI key).", "tool": "News", "data": {}}

    max_items = _NEWS_MAX_PER_SECTION
    extras = _NEWS_EXTRAS

    sections = []
    all_articles = []

    # ── News sections via SerpAPI Google Search (news tab, past 24h) ──
    for section in _PROFILE_NEWS_SECTIONS:
        name = section["name"]
        try:
            resp = requests.get(
                "https://serpapi.com/search.json",
                params={
                    "engine": "google",
                    "q": section["query"],
                    "tbm": "nws",
                    "tbs": "qdr:d",
                    "api_key": api_key,
                    "gl": "us",
                    "hl": "en",
                    "num": max_items + 2,
                },
                timeout=10,
            )
            data = resp.json()
            results = data.get("news_results", data.get("organic_results", []))[:max_items]

            bullets = []
            for r in results:
                title = r.get("title", "")
                source = r.get("source", "")
                link = r.get("link", "")
                snippet = r.get("snippet", "")
                date = r.get("date", "")

                line = f"**{title}**"
                if source:
                    line += f" — *{source}*"
                if date:
                    line += f" ({date})"
                if snippet:
                    short = snippet[:180].rsplit(" ", 1)[0] + "..." if len(snippet) > 180 else snippet
                    line += f"\n  {short}"
                if link:
                    line += f"\n  [Read more]({link})"
                bullets.append(line)
                all_articles.append({"title": title, "source": source, "link": link, "section": name})

            if bullets:
                sections.append(f"### {name}\n" + "\n\n".join(f"- {b}" for b in bullets))
            else:
                sections.append(f"### {name}\n- *No results found*")
        except Exception as e:
            print(f"[NEWS] Error fetching {name}: {e}", flush=True)
            sections.append(f"### {name}\n- *Unable to fetch*")

    # ── Drudge Report ────────────────────────────────────────────────
    if "drudgereport" in extras:
        try:
            from bs4 import BeautifulSoup
            resp = requests.get("https://www.drudgereport.com/", timeout=8, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
            })
            soup = BeautifulSoup(resp.text, "html.parser")
            headlines = []
            seen = set()
            for a in soup.select("a[href]"):
                text = a.get_text(strip=True)
                href = a.get("href", "")
                if (text and href.startswith("http") and len(text) > 15
                        and text not in seen and "drudgereport.com" not in href):
                    seen.add(text)
                    headlines.append({"title": text, "link": href})
                    if len(headlines) >= 6:
                        break

            if headlines:
                bullets = []
                for item in headlines:
                    line = f"**{item['title']}**"
                    if item.get("link"):
                        line += f"\n  [Read more]({item['link']})"
                    bullets.append(line)
                    all_articles.append({"title": item["title"], "source": "Drudge Report", "link": item.get("link", ""), "section": "Drudge Report"})
                sections.append(f"### Drudge Report\n" + "\n\n".join(f"- {b}" for b in bullets))
        except Exception as e:
            print(f"[NEWS] Error fetching Drudge: {e}", flush=True)
            sections.append(f"### Drudge Report\n- *Unable to fetch*")

    # ── X / Twitter Trending ─────────────────────────────────────────
    if "x_trending" in extras:
        try:
            # Use SerpAPI Google search for trending topics on X
            resp = requests.get(
                "https://serpapi.com/search.json",
                params={
                    "engine": "google",
                    "q": "site:x.com trending politics OR AI OR technology OR markets",
                    "api_key": api_key,
                    "gl": "us",
                    "hl": "en",
                    "num": 8,
                    "tbs": "qdr:d",  # past 24 hours
                },
                timeout=10,
            )
            data = resp.json()
            results = data.get("organic_results", [])[:6]

            if results:
                bullets = []
                for r in results:
                    title = r.get("title", "").replace(" / X", "").replace(" on X", "").strip()
                    link = r.get("link", "")
                    snippet = r.get("snippet", "")

                    line = f"**{title}**"
                    if snippet:
                        # Trim long snippets
                        short = snippet[:150].rsplit(" ", 1)[0] + "..." if len(snippet) > 150 else snippet
                        line += f"\n  {short}"
                    if link:
                        line += f"\n  [View on X]({link})"
                    bullets.append(line)
                    all_articles.append({"title": title, "source": "X", "link": link, "section": "Trending on X"})
                sections.append(f"### Trending on X\n" + "\n\n".join(f"- {b}" for b in bullets))
        except Exception as e:
            print(f"[NEWS] Error fetching X trending: {e}", flush=True)
            sections.append(f"### Trending on X\n- *Unable to fetch*")

    if not sections:
        return {"response": "Couldn't fetch news right now. Try again in a moment.", "tool": "News", "data": []}

    header = f"## News Digest — {datetime.now().strftime('%A, %B %d')}\n\n"
    response = header + "\n\n".join(sections)

    return {"response": response, "tool": "News", "data": all_articles}


# ── Calendar fast-path handlers ───────────────────────────────────────────────

def _format_event_time(start_str: str, end_str: str) -> str:
    """Format event start/end times for display."""
    try:
        start = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
        return f"{start.strftime('%I:%M %p')} – {end.strftime('%I:%M %p')}"
    except (ValueError, AttributeError):
        return f"{start_str} – {end_str}"


def _handle_calendar_today():
    try:
        from backend.services.kindora_service import get_today, get_family_members
        events = get_today()
        members = get_family_members()
        member_map = {m["id"]: m["name"] for m in members}

        if not events:
            now = datetime.now()
            return {
                "response": f"## Today's Calendar — {now.strftime('%A, %B %d')}\n\nNo events scheduled for today. Enjoy the free time!",
                "tool": "Calendar",
                "data": [],
            }

        now = datetime.now()
        lines = [f"## Today's Calendar — {now.strftime('%A, %B %d')}\n"]

        for ev in events:
            time_str = _format_event_time(ev["startTime"], ev["endTime"])
            who = ", ".join(member_map.get(mid, mid) for mid in ev.get("memberIds", []))
            status = " [done]" if ev.get("completed") else ""

            line = f"- **{time_str}** — {ev['title']}{status}"
            if who:
                line += f" ({who})"
            if ev.get("description"):
                line += f"\n  _{ev['description']}_"
            lines.append(line)

        lines.append(f"\n*{len(events)} event{'s' if len(events) != 1 else ''} today*")
        return {"response": "\n".join(lines), "tool": "Calendar", "data": events}
    except Exception as e:
        return {"response": f"Couldn't fetch today's calendar: {e}", "tool": "Calendar", "data": {}}


def _handle_calendar_week(days: int = 7):
    try:
        from backend.services.kindora_service import get_upcoming, get_family_members
        events = get_upcoming(days=days)
        members = get_family_members()
        member_map = {m["id"]: m["name"] for m in members}

        if not events:
            return {
                "response": f"## Upcoming {days} Days\n\nNo events scheduled. Calendar is clear!",
                "tool": "Calendar",
                "data": [],
            }

        # Group by date
        by_date: dict = {}
        for ev in events:
            try:
                dt = datetime.fromisoformat(ev["startTime"].replace("Z", "+00:00"))
                date_key = dt.strftime("%Y-%m-%d")
                date_label = dt.strftime("%A, %B %d")
            except (ValueError, AttributeError):
                date_key = "unknown"
                date_label = "Unknown Date"
            by_date.setdefault(date_key, {"label": date_label, "events": []})
            by_date[date_key]["events"].append(ev)

        lines = [f"## Upcoming {days} Days ({len(events)} events)\n"]

        for date_key in sorted(by_date.keys()):
            day_info = by_date[date_key]
            lines.append(f"### {day_info['label']}")
            for ev in day_info["events"]:
                time_str = _format_event_time(ev["startTime"], ev["endTime"])
                who = ", ".join(member_map.get(mid, mid) for mid in ev.get("memberIds", []))
                line = f"- **{time_str}** — {ev['title']}"
                if who:
                    line += f" ({who})"
                lines.append(line)
            lines.append("")

        return {"response": "\n".join(lines), "tool": "Calendar", "data": events}
    except Exception as e:
        return {"response": f"Couldn't fetch upcoming events: {e}", "tool": "Calendar", "data": {}}


def _handle_calendar_family():
    try:
        from backend.services.kindora_service import get_family_members
        members = get_family_members()

        if not members:
            return {
                "response": "## Family Members\n\nNo family members found in Kindora.",
                "tool": "Calendar",
                "data": [],
            }

        lines = [f"## Family Members ({len(members)})\n"]
        for m in members:
            lines.append(f"- **{m['name']}**")

        return {"response": "\n".join(lines), "tool": "Calendar", "data": members}
    except Exception as e:
        return {"response": f"Couldn't fetch family members: {e}", "tool": "Calendar", "data": {}}


# ── Finance fast-path handlers ────────────────────────────────────────────────

def _handle_finance_accounts():
    try:
        from backend.services.monarch_service import get_accounts
        data = get_accounts()
        nw = data["netWorth"]
        assets = data["totalAssets"]
        liab = data["totalLiabilities"]

        lines = [
            f"## Net Worth: **${nw:,.2f}**\n",
            f"- **Assets:** ${assets:,.2f}",
            f"- **Liabilities:** ${liab:,.2f}\n",
        ]

        for type_name, accts in data["accountsByType"].items():
            lines.append(f"### {type_name}")
            for a in accts:
                inst = f" ({a['institution']})" if a.get("institution") else ""
                lines.append(f"- {a['name']}{inst}: **${a['balance']:,.2f}**")
            lines.append("")

        return {"response": "\n".join(lines), "tool": "PersonalFinance", "data": data}
    except Exception as e:
        return {"response": f"Couldn't fetch accounts: {e}", "tool": "PersonalFinance", "data": {}}


def _handle_finance_transactions():
    try:
        from backend.services.monarch_service import get_transactions
        txns = get_transactions(limit=15)

        if not txns:
            return {"response": "No recent transactions found.", "tool": "PersonalFinance", "data": []}

        lines = ["## Recent Transactions\n"]
        for t in txns:
            amount = t["amount"]
            sign = "+" if amount > 0 else ""
            pending = " *(pending)*" if t.get("isPending") else ""
            lines.append(
                f"- **{t['date']}** | {t['merchant']} | {t['category']} | "
                f"**{sign}${abs(amount):,.2f}**{pending}"
            )

        return {"response": "\n".join(lines), "tool": "PersonalFinance", "data": txns}
    except Exception as e:
        return {"response": f"Couldn't fetch transactions: {e}", "tool": "PersonalFinance", "data": {}}


def _handle_finance_budgets():
    try:
        from backend.services.monarch_service import get_budgets
        data = get_budgets()

        total_b = data["totalBudgeted"]
        total_s = data["totalSpent"]
        total_r = data["totalRemaining"]

        lines = [
            f"## Monthly Budget\n",
            f"- **Budgeted:** ${total_b:,.2f}",
            f"- **Spent:** ${total_s:,.2f}",
            f"- **Remaining:** ${total_r:,.2f}\n",
            "### By Category\n",
        ]

        for c in data["categories"]:
            pct = c["percentUsed"]
            bar = "!" if pct > 100 else ("~" if pct > 80 else "")
            indicator = f" {bar}" if bar else ""
            lines.append(
                f"- {c['category']}: ${c['spent']:,.2f} / ${c['budgeted']:,.2f} "
                f"({pct:.0f}%){indicator}"
            )

        return {"response": "\n".join(lines), "tool": "PersonalFinance", "data": data}
    except Exception as e:
        return {"response": f"Couldn't fetch budgets: {e}", "tool": "PersonalFinance", "data": {}}


def _handle_finance_overview():
    try:
        from backend.services.monarch_service import get_accounts, get_cashflow
        accounts = get_accounts()
        cashflow = get_cashflow()

        lines = [
            f"## Financial Overview\n",
            f"### Net Worth: **${accounts['netWorth']:,.2f}**",
            f"- Assets: ${accounts['totalAssets']:,.2f}",
            f"- Liabilities: ${accounts['totalLiabilities']:,.2f}\n",
            f"### Cash Flow (Last 30 Days)",
            f"- Income: **${cashflow['income']:,.2f}**",
            f"- Expenses: **${cashflow['expenses']:,.2f}**",
            f"- Savings: **${cashflow['savings']:,.2f}** ({cashflow['savingsRate']:.1f}%)",
        ]

        return {"response": "\n".join(lines), "tool": "PersonalFinance", "data": {"accounts": accounts, "cashflow": cashflow}}
    except Exception as e:
        return {"response": f"Couldn't fetch financial overview: {e}", "tool": "PersonalFinance", "data": {}}
