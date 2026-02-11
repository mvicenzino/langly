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
    return {
        "response": f"{greeting} How can I help you and the family today?",
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
