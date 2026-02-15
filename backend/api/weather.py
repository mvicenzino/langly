"""Weather endpoint — uses Open-Meteo (free, no key) with wttr.in fallback."""
from __future__ import annotations

import re
from flask import Blueprint, jsonify
import requests

weather_bp = Blueprint("weather", __name__)

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

WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle",
    55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Light showers", 81: "Showers", 82: "Heavy showers",
    85: "Light snow showers", 86: "Snow showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm",
}


def _resolve_state(hint: str) -> str:
    upper = hint.upper()
    return _US_STATES.get(upper, hint.lower())


@weather_bp.route("/api/weather/<location>")
def get_weather(location):
    # Try Open-Meteo first (fast, reliable)
    try:
        return _open_meteo(location)
    except Exception:
        pass

    # Fallback to wttr.in
    try:
        return _wttr_in(location)
    except Exception as e:
        return jsonify({"error": str(e), "location": location}), 500


def _open_meteo(location: str):
    """Fetch weather from Open-Meteo (geocode + weather)."""
    clean = location.replace("+", " ").strip()
    # Split by comma to separate city from state/country hint
    # e.g. "Morristown, NJ" → city="Morristown", hint="NJ"
    # e.g. "Fort Myers" → city="Fort Myers", hint=None
    comma_parts = [p.strip() for p in clean.split(",") if p.strip()]
    search_name = comma_parts[0] if comma_parts else clean
    state_hint = comma_parts[1] if len(comma_parts) > 1 else None

    geo = requests.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        params={"name": search_name, "count": 5},
        timeout=4,
    ).json()

    results = geo.get("results", [])
    place = None
    if state_hint and results:
        hint = _resolve_state(state_hint)
        for r in results:
            admin = (r.get("admin1") or "").lower()
            if hint in admin or admin.startswith(hint):
                place = r
                break
    if not place:
        place = results[0] if results else None

    if not place:
        raise ValueError(f"Location not found: {location}")

    lat = place["latitude"]
    lon = place["longitude"]
    place_name = place.get("name", location)
    admin1 = place.get("admin1", "")
    country = place.get("country", "")

    wx = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
            "daily": "temperature_2m_max,temperature_2m_min,weather_code",
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "forecast_days": 3,
        },
        timeout=4,
    ).json()

    cur = wx.get("current", {})
    temp_f = cur.get("temperature_2m", 0)
    temp_c = round((temp_f - 32) * 5 / 9, 1)
    feels_f = cur.get("apparent_temperature", 0)
    feels_c = round((feels_f - 32) * 5 / 9, 1)
    code = cur.get("weather_code", 0)

    # Wind direction from degrees
    wind_deg = cur.get("wind_direction_10m", 0)
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    wind_dir = dirs[int((wind_deg + 11.25) / 22.5) % 16]

    forecasts = []
    daily = wx.get("daily", {})
    dates = daily.get("time", [])
    maxes = daily.get("temperature_2m_max", [])
    mins = daily.get("temperature_2m_min", [])
    codes = daily.get("weather_code", [])
    for d, hi, lo, c in zip(dates, maxes, mins, codes):
        hi_c = round((hi - 32) * 5 / 9, 1)
        lo_c = round((lo - 32) * 5 / 9, 1)
        forecasts.append({
            "date": d,
            "maxTempF": round(hi),
            "minTempF": round(lo),
            "maxTempC": round(hi_c),
            "minTempC": round(lo_c),
            "description": WMO_CODES.get(c, "Unknown"),
        })

    return jsonify({
        "location": place_name,
        "region": admin1,
        "country": country,
        "tempF": round(temp_f),
        "tempC": round(temp_c),
        "feelsLikeF": round(feels_f),
        "feelsLikeC": round(feels_c),
        "humidity": cur.get("relative_humidity_2m", 0),
        "description": WMO_CODES.get(code, "Unknown"),
        "windSpeedMph": round(cur.get("wind_speed_10m", 0)),
        "windDir": wind_dir,
        "uvIndex": 0,
        "visibility": 0,
        "weatherCode": code,
        "forecast": forecasts,
    })


def _wttr_in(location: str):
    """Fallback: fetch weather from wttr.in."""
    resp = requests.get(
        f"https://wttr.in/{location}",
        params={"format": "j1"},
        headers={"User-Agent": "curl/7.68.0"},
        timeout=5,
    )
    resp.raise_for_status()
    data = resp.json()

    current = data.get("current_condition", [{}])[0]
    area = data.get("nearest_area", [{}])[0]

    forecasts = []
    for day in data.get("weather", [])[:3]:
        forecasts.append({
            "date": day.get("date", ""),
            "maxTempF": int(day.get("maxtempF", 0)),
            "minTempF": int(day.get("mintempF", 0)),
            "maxTempC": int(day.get("maxtempC", 0)),
            "minTempC": int(day.get("mintempC", 0)),
            "description": day.get("hourly", [{}])[4].get(
                "weatherDesc", [{}]
            )[0].get("value", "") if len(day.get("hourly", [])) > 4 else "",
        })

    return jsonify({
        "location": area.get("areaName", [{}])[0].get("value", location),
        "region": area.get("region", [{}])[0].get("value", ""),
        "country": area.get("country", [{}])[0].get("value", ""),
        "tempF": int(current.get("temp_F", 0)),
        "tempC": int(current.get("temp_C", 0)),
        "feelsLikeF": int(current.get("FeelsLikeF", 0)),
        "feelsLikeC": int(current.get("FeelsLikeC", 0)),
        "humidity": int(current.get("humidity", 0)),
        "description": current.get("weatherDesc", [{}])[0].get("value", ""),
        "windSpeedMph": int(current.get("windspeedMiles", 0)),
        "windDir": current.get("winddir16Point", ""),
        "uvIndex": int(current.get("uvIndex", 0)),
        "visibility": int(current.get("visibility", 0)),
        "weatherCode": int(current.get("weatherCode", 0)),
        "forecast": forecasts,
    })
