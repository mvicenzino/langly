"""Daily Brief aggregator — fetches News, Markets, Jobs, X/Social, Reddit AI, Weather, Drudge in parallel."""
from __future__ import annotations

import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup
from flask import Blueprint, jsonify

from backend.profile import NEWS_SECTIONS, STOCKS, USER
from backend.api.weather import _open_meteo, WMO_CODES
from backend.services.stride_service import get_pipeline, get_dashboard_stats, get_upcoming_events

briefs_bp = Blueprint("briefs", __name__)

_SERPAPI_KEY = None


def _get_serpapi_key() -> str:
    global _SERPAPI_KEY
    if _SERPAPI_KEY is None:
        _SERPAPI_KEY = os.getenv("SERPAPI_API_KEY", "")
    return _SERPAPI_KEY


# ── Individual fetchers ──────────────────────────────────────────────────────


def _fetch_news() -> dict:
    """Fetch news across profile sections via SerpAPI."""
    api_key = _get_serpapi_key()
    if not api_key:
        return {"id": "news", "title": "News", "icon": "newspaper", "items": [], "error": "SerpAPI key not configured"}

    items = []
    for section in NEWS_SECTIONS:
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
                    "num": 4,
                },
                timeout=10,
            )
            data = resp.json()
            results = data.get("news_results", data.get("organic_results", []))[:3]
            for r in results:
                items.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("snippet", ""),
                    "url": r.get("link", ""),
                    "source": r.get("source", {}).get("name", "") if isinstance(r.get("source"), dict) else r.get("source", ""),
                    "date": r.get("date", ""),
                    "category": section["name"],
                })
        except Exception:
            pass

    return {"id": "news", "title": "News", "icon": "newspaper", "items": items}


def _fetch_drudge() -> dict:
    """Scrape top headlines from Drudge Report."""
    try:
        resp = requests.get(
            "https://drudgereport.com",
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        items = []
        seen_urls = set()
        # Drudge headlines are <a> tags, often inside <font> with size>=+N or <b> tags
        # Main headlines are typically in the top-center column with large/bold font
        for tag in soup.find_all("a", href=True):
            href = tag.get("href", "").strip()
            text = tag.get_text(strip=True)
            if not text or len(text) < 10 or not href.startswith("http"):
                continue
            if href in seen_urls:
                continue
            # Skip Drudge internal/ad links
            if "drudgereport.com" in href:
                continue

            # Check if this link is inside a bold/large font container (headline)
            parent = tag.parent
            is_headline = (
                (parent and parent.name == "b") or
                (parent and parent.name == "font" and
                 int(parent.get("size", "0").replace("+", "") or "0") >= 2)
            )

            items.append({
                "title": text,
                "url": href,
                "source": "Drudge Report",
                "snippet": "",
                "date": "",
                "isHeadline": is_headline,
            })
            seen_urls.add(href)

        # Sort: headlines first, then regular links; limit to 20
        items.sort(key=lambda x: (0 if x.get("isHeadline") else 1))
        items = items[:20]

        return {"id": "drudge", "title": "Drudge Report", "icon": "newspaper", "items": items}
    except Exception as e:
        return {"id": "drudge", "title": "Drudge Report", "icon": "newspaper", "items": [], "error": str(e)}


def _fetch_markets() -> dict:
    """Fetch stock watchlist + major indices via yfinance."""
    tickers = STOCKS + ["^GSPC", "^DJI", "^IXIC"]
    items = []

    try:
        import yfinance as yf

        data = yf.download(tickers, period="2d", group_by="ticker", progress=False, threads=True)

        for ticker in tickers:
            try:
                if len(tickers) == 1:
                    df = data
                else:
                    df = data[ticker]
                if df.empty or len(df) < 1:
                    continue
                close = float(df["Close"].iloc[-1])
                prev = float(df["Close"].iloc[-2]) if len(df) > 1 else close
                change = close - prev
                change_pct = (change / prev * 100) if prev else 0

                # Friendly name for indices
                display = ticker
                if ticker == "^GSPC":
                    display = "S&P 500"
                elif ticker == "^DJI":
                    display = "Dow Jones"
                elif ticker == "^IXIC":
                    display = "NASDAQ"

                items.append({
                    "ticker": ticker,
                    "name": display,
                    "price": round(close, 2),
                    "change": round(change, 2),
                    "changePercent": round(change_pct, 2),
                    "isIndex": ticker.startswith("^"),
                })
            except Exception:
                pass
    except ImportError:
        return {"id": "markets", "title": "Markets", "icon": "chart", "items": [], "error": "yfinance not installed"}
    except Exception as e:
        return {"id": "markets", "title": "Markets", "icon": "chart", "items": [], "error": str(e)}

    return {"id": "markets", "title": "Markets", "icon": "chart", "items": items}


def _fetch_jobs() -> dict:
    """Fetch job pipeline data from Stride job tracker."""
    try:
        pipeline = get_pipeline()
        stats = get_dashboard_stats()
        events = get_upcoming_events()

        # Build status counts from pipeline data
        status_counts = {}
        if isinstance(pipeline, dict):
            for status, apps in pipeline.items():
                if isinstance(apps, list):
                    status_counts[status] = len(apps)
        elif isinstance(stats, dict):
            status_counts = {
                k: v for k, v in stats.items()
                if isinstance(v, (int, float))
            }

        # Build upcoming events list
        upcoming = []
        if isinstance(events, list):
            for ev in events[:5]:
                upcoming.append({
                    "title": ev.get("title", ev.get("name", "")),
                    "date": ev.get("date", ev.get("scheduled_at", "")),
                    "type": ev.get("type", ev.get("event_type", "")),
                    "company": ev.get("company", ev.get("company_name", "")),
                })

        return {
            "id": "jobs",
            "title": "Job Pipeline",
            "icon": "briefcase",
            "pipeline": {
                "statusCounts": status_counts,
                "upcoming": upcoming,
                "totalActive": sum(status_counts.values()) if status_counts else 0,
            },
        }
    except Exception as e:
        return {"id": "jobs", "title": "Job Pipeline", "icon": "briefcase", "pipeline": None, "error": str(e)}


def _fetch_social() -> dict:
    """Fetch X.com / Twitter AI & tech posts via SerpAPI."""
    api_key = _get_serpapi_key()
    if not api_key:
        return {"id": "social", "title": "X / Social", "icon": "twitter", "items": [], "error": "SerpAPI key not configured"}

    queries = [
        "site:x.com AI artificial intelligence",
        "site:x.com data analytics tech leadership",
    ]
    items = []

    for q in queries:
        try:
            resp = requests.get(
                "https://serpapi.com/search.json",
                params={
                    "engine": "google",
                    "q": q,
                    "tbs": "qdr:d",
                    "api_key": api_key,
                    "gl": "us",
                    "hl": "en",
                    "num": 5,
                },
                timeout=10,
            )
            data = resp.json()
            results = data.get("organic_results", [])[:4]
            for r in results:
                items.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("snippet", ""),
                    "url": r.get("link", ""),
                    "source": "X.com",
                    "date": r.get("date", ""),
                })
        except Exception:
            pass

    return {"id": "social", "title": "X / Social", "icon": "twitter", "items": items}


def _fetch_reddit() -> dict:
    """Fetch Reddit AI community posts via SerpAPI."""
    api_key = _get_serpapi_key()
    if not api_key:
        return {"id": "reddit", "title": "Reddit AI", "icon": "reddit", "items": [], "error": "SerpAPI key not configured"}

    queries = [
        "site:reddit.com (r/artificial OR r/MachineLearning OR r/LocalLLaMA OR r/OpenAI)",
    ]
    items = []

    for q in queries:
        try:
            resp = requests.get(
                "https://serpapi.com/search.json",
                params={
                    "engine": "google",
                    "q": q,
                    "tbs": "qdr:d",
                    "api_key": api_key,
                    "gl": "us",
                    "hl": "en",
                    "num": 8,
                },
                timeout=10,
            )
            data = resp.json()
            results = data.get("organic_results", [])[:6]
            for r in results:
                # Extract subreddit from URL
                url = r.get("link", "")
                sub_match = re.search(r"r/(\w+)", url)
                subreddit = f"r/{sub_match.group(1)}" if sub_match else "reddit"

                items.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("snippet", ""),
                    "url": url,
                    "source": subreddit,
                    "date": r.get("date", ""),
                })
        except Exception:
            pass

    return {"id": "reddit", "title": "Reddit AI", "icon": "reddit", "items": items}


def _fetch_weather() -> dict:
    """Fetch weather for Morristown NJ using Open-Meteo (raw HTTP, no Flask context needed)."""
    try:
        import requests as _req

        # Geocode
        geo = _req.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": "Morristown", "count": 5},
            timeout=4,
        ).json()
        place = None
        for r in geo.get("results", []):
            if "new jersey" in (r.get("admin1") or "").lower():
                place = r
                break
        if not place:
            place = geo.get("results", [{}])[0]

        lat, lon = place["latitude"], place["longitude"]

        wx = _req.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat, "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
                "daily": "temperature_2m_max,temperature_2m_min,weather_code",
                "temperature_unit": "fahrenheit",
                "wind_speed_unit": "mph",
                "forecast_days": 3,
            },
            timeout=4,
        ).json()

        cur = wx.get("current", {})
        code = cur.get("weather_code", 0)
        wind_deg = cur.get("wind_direction_10m", 0)
        dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"]
        wind_dir = dirs[int((wind_deg + 11.25) / 22.5) % 16]

        forecasts = []
        daily = wx.get("daily", {})
        for d, hi, lo, c in zip(daily.get("time", []), daily.get("temperature_2m_max", []),
                                 daily.get("temperature_2m_min", []), daily.get("weather_code", [])):
            forecasts.append({
                "date": d,
                "maxTempF": round(hi),
                "minTempF": round(lo),
                "description": WMO_CODES.get(c, "Unknown"),
            })

        data = {
            "location": place.get("name", "Morristown"),
            "region": place.get("admin1", "New Jersey"),
            "tempF": round(cur.get("temperature_2m", 0)),
            "feelsLikeF": round(cur.get("apparent_temperature", 0)),
            "humidity": cur.get("relative_humidity_2m", 0),
            "description": WMO_CODES.get(code, "Unknown"),
            "windSpeedMph": round(cur.get("wind_speed_10m", 0)),
            "windDir": wind_dir,
            "forecast": forecasts,
        }

        return {
            "id": "weather",
            "title": "Weather",
            "icon": "cloud",
            "weather": {
                "location": data.get("location", "Morristown"),
                "region": data.get("region", "New Jersey"),
                "tempF": data.get("tempF", 0),
                "feelsLikeF": data.get("feelsLikeF", 0),
                "humidity": data.get("humidity", 0),
                "description": data.get("description", ""),
                "windSpeedMph": data.get("windSpeedMph", 0),
                "windDir": data.get("windDir", ""),
                "forecast": data.get("forecast", []),
            },
        }
    except Exception as e:
        return {"id": "weather", "title": "Weather", "icon": "cloud", "weather": None, "error": str(e)}


# ── Main endpoint ────────────────────────────────────────────────────────────


@briefs_bp.route("/api/briefs/daily")
def daily_brief():
    """Aggregate all 7 brief sections in parallel."""
    fetchers = {
        "news": _fetch_news,
        "drudge": _fetch_drudge,
        "markets": _fetch_markets,
        "jobs": _fetch_jobs,
        "social": _fetch_social,
        "reddit": _fetch_reddit,
        "weather": _fetch_weather,
    }

    sections = []
    with ThreadPoolExecutor(max_workers=7) as pool:
        futures = {pool.submit(fn): key for key, fn in fetchers.items()}
        for future in as_completed(futures):
            key = futures[future]
            try:
                sections.append(future.result())
            except Exception as e:
                sections.append({"id": key, "title": key.title(), "items": [], "error": str(e)})

    # Sort into consistent display order
    order = ["weather", "markets", "news", "drudge", "jobs", "social", "reddit"]
    sections.sort(key=lambda s: order.index(s["id"]) if s["id"] in order else 99)

    return jsonify({
        "sections": sections,
        "generatedAt": datetime.utcnow().isoformat() + "Z",
    })
