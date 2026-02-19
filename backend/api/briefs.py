"""Daily Brief aggregator — fetches Markets, Jobs, Hacker News, Weather, Drudge in parallel."""
from __future__ import annotations

import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup
from flask import Blueprint, jsonify

from backend.profile import STOCKS, USER
from backend.api.weather import _open_meteo, WMO_CODES
from backend.services.stride_service import get_pipeline, get_dashboard_stats, get_upcoming_events

briefs_bp = Blueprint("briefs", __name__)


# ── Individual fetchers ──────────────────────────────────────────────────────


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
                    display = "Dow"
                elif ticker == "^IXIC":
                    display = "Nasdaq"

                items.append({
                    "ticker": ticker,
                    "price": round(close, 2),
                    "change": round(change, 2),
                    "changePct": round(change_pct, 2),
                    "display": display,
                })
            except Exception:
                continue

        return {"id": "markets", "title": "Markets", "icon": "trending-up", "items": items}
    except Exception as e:
        return {"id": "markets", "title": "Markets", "icon": "trending-up", "items": [], "error": str(e)}


def _fetch_jobs() -> dict:
    """Fetch job pipeline from Stride."""
    try:
        pipeline = get_pipeline()
        if not pipeline:
            return {"id": "jobs", "title": "Job Pipeline", "icon": "briefcase", "pipeline": None}

        status_counts = pipeline.get("statusCounts", {})
        upcoming = pipeline.get("upcoming", [])[:5]

        # Reformat upcoming
        for ev in upcoming:
            if "scheduled_at" in ev and not ev.get("date"):
                ev["date"] = ev["scheduled_at"]

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


def _fetch_hackernews() -> dict:
    """Fetch top stories from Hacker News (completely free, no auth)."""
    try:
        # Get top 30 story IDs
        resp = requests.get("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=5)
        resp.raise_for_status()
        story_ids = resp.json()[:30]

        items = []
        for sid in story_ids:
            if len(items) >= 10:
                break
            try:
                story_resp = requests.get(
                    f"https://hacker-news.firebaseio.com/v0/item/{sid}.json",
                    timeout=3,
                )
                story_resp.raise_for_status()
                story = story_resp.json()
                
                # Skip dead/deleted stories or stories without title
                if not story or not story.get("title"):
                    continue

                items.append({
                    "title": story.get("title", ""),
                    "url": story.get("url", f"https://news.ycombinator.com/item?id={sid}"),
                    "source": "Hacker News",
                    "score": story.get("score", 0),
                    "comments": story.get("descendants", 0),
                })
            except Exception:
                # Skip stories that fail to load
                continue

        return {"id": "hackernews", "title": "Hacker News", "icon": "trending-up", "items": items}
    except Exception as e:
        return {"id": "hackernews", "title": "Hacker News", "icon": "trending-up", "items": [], "error": str(e)}


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
            timeout=5,
        ).json()

        current = wx.get("current", {})
        daily = wx.get("daily", {})

        # Decode WMO code
        code = current.get("weather_code", 0)
        desc = WMO_CODES.get(code, "Unknown")

        data = {
            "tempF": current.get("temperature_2m", 0),
            "feelsLikeF": current.get("apparent_temperature", 0),
            "humidity": current.get("relative_humidity_2m", 0),
            "description": desc,
            "windSpeedMph": current.get("wind_speed_10m", 0),
            "windDir": current.get("wind_direction_10m", "N/A"),
            "forecast": [],
        }

        # Daily forecast
        if daily.get("time"):
            for i, day in enumerate(daily["time"]):
                high = daily["temperature_2m_max"][i]
                low = daily["temperature_2m_min"][i]
                code = daily["weather_code"][i]
                data["forecast"].append({
                    "date": day,
                    "high": high,
                    "low": low,
                    "description": WMO_CODES.get(code, "Unknown"),
                })

        return {
            "id": "weather",
            "title": "Weather",
            "icon": "cloud",
            "weather": {
                "location": place.get("name", "Morristown"),
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
    """Aggregate all brief sections in parallel."""
    fetchers = {
        "weather": _fetch_weather,
        "markets": _fetch_markets,
        "jobs": _fetch_jobs,
        "drudge": _fetch_drudge,
        "hackernews": _fetch_hackernews,
    }

    sections = []

    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(fn): key for key, fn in fetchers.items()}
        for future in as_completed(futures):
            key = futures[future]
            try:
                sections.append(future.result())
            except Exception as e:
                sections.append({"id": key, "title": key.title(), "items": [], "error": str(e)})

    # Sort into consistent display order
    order = ["weather", "markets", "jobs", "drudge", "hackernews"]
    sections.sort(key=lambda s: order.index(s["id"]) if s["id"] in order else 99)

    return jsonify({
        "sections": sections,
        "generatedAt": datetime.utcnow().isoformat() + "Z",
    })


# ── Individual section endpoints (for selective refresh) ────────────────────

@briefs_bp.route("/api/briefs/hackernews")
def brief_hackernews():
    """Fetch Hacker News posts individually."""
    return jsonify(_fetch_hackernews())


@briefs_bp.route("/api/briefs/drudge")
def brief_drudge():
    """Fetch Drudge Report individually."""
    return jsonify(_fetch_drudge())


@briefs_bp.route("/api/briefs/markets")
def brief_markets():
    """Fetch markets individually."""
    return jsonify(_fetch_markets())


@briefs_bp.route("/api/briefs/jobs")
def brief_jobs():
    """Fetch job pipeline individually."""
    return jsonify(_fetch_jobs())


@briefs_bp.route("/api/briefs/weather")
def brief_weather():
    """Fetch weather individually."""
    return jsonify(_fetch_weather())


@briefs_bp.route("/api/briefs/test")
def brief_test():
    """Test endpoint to confirm briefs.py is loaded."""
    return jsonify({"test": "SUCCESS - briefs.py is loaded and updated"})
