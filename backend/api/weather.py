"""Weather endpoint — calls wttr.in directly for structured JSON."""
from flask import Blueprint, jsonify
import requests

weather_bp = Blueprint("weather", __name__)


@weather_bp.route("/api/weather/<location>")
def get_weather(location):
    try:
        resp = requests.get(
            f"https://wttr.in/{location}",
            params={"format": "j1"},
            headers={"User-Agent": "curl/7.68.0"},
            timeout=5
        )
        resp.raise_for_status()
        data = resp.json()

        current = data.get("current_condition", [{}])[0]
        area = data.get("nearest_area", [{}])[0]

        weather_data = {
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
        }

        # 3-day forecast
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
        weather_data["forecast"] = forecasts

        return jsonify(weather_data)
    except Exception as e:
        return jsonify({"error": str(e), "location": location}), 500
