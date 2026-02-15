"""Flight Search service — uses SerpAPI Google Flights engine.

Searches Google Flights via SerpAPI for real flight prices and schedules.
Uses the existing SERPAPI_API_KEY from .env. Python 3.9 compatible.
"""
from __future__ import annotations

import os
from typing import Optional

import requests

# ── Config ────────────────────────────────────────────────────────────────────

SERPAPI_URL = "https://serpapi.com/search"


def _get_api_key() -> str:
    key = os.getenv("SERPAPI_API_KEY", "")
    if not key:
        raise RuntimeError("SERPAPI_API_KEY not set in .env")
    return key


def _minutes_to_iso(mins: int) -> str:
    """Convert minutes (e.g. 315) to ISO-ish duration string 'PT5H15M'."""
    h = mins // 60
    m = mins % 60
    parts = "PT"
    if h:
        parts += f"{h}H"
    if m:
        parts += f"{m}M"
    return parts if parts != "PT" else "PT0M"


def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: Optional[str] = None,
    adults: int = 1,
    max_results: int = 10,
) -> list:
    """Search Google Flights via SerpAPI, return normalized list.

    Args:
        origin: IATA airport code (e.g. "EWR")
        destination: IATA airport code (e.g. "LAX")
        departure_date: ISO date (e.g. "2026-04-10")
        return_date: Optional return date for round-trip
        adults: Number of adult passengers
        max_results: Max offers to return

    Returns:
        List of normalized flight offer dicts matching FlightOffer type.
    """
    api_key = _get_api_key()

    params = {
        "engine": "google_flights",
        "api_key": api_key,
        "departure_id": origin.upper(),
        "arrival_id": destination.upper(),
        "outbound_date": departure_date,
        "adults": adults,
        "currency": "USD",
        "hl": "en",
    }

    if return_date:
        params["return_date"] = return_date
        params["type"] = "1"  # round trip
    else:
        params["type"] = "2"  # one way

    resp = requests.get(SERPAPI_URL, params=params, timeout=20)
    resp.raise_for_status()
    data = resp.json()

    if "error" in data:
        raise RuntimeError(data["error"])

    offers = []
    offer_id = 0

    # SerpAPI returns best_flights and other_flights
    for group in ("best_flights", "other_flights"):
        for flight_group in data.get(group, []):
            if len(offers) >= max_results:
                break

            try:
                flight_legs = flight_group.get("flights", [])
                if not flight_legs:
                    continue

                # Price is per-ticket from Google Flights
                price = flight_group.get("price", 0)
                total_duration = flight_group.get("total_duration", 0)  # minutes

                first_leg = flight_legs[0]
                last_leg = flight_legs[-1]

                airline = first_leg.get("airline", "Unknown")
                airline_code = first_leg.get("airline_logo", "")  # We'll use airline name

                # Build segments
                segments = []
                for leg in flight_legs:
                    dep = leg.get("departure_airport", {})
                    arr = leg.get("arrival_airport", {})
                    segments.append({
                        "departure": dep.get("time", ""),
                        "arrival": arr.get("time", ""),
                        "origin": dep.get("id", ""),
                        "destination": arr.get("id", ""),
                        "carrierCode": leg.get("airline", ""),
                        "flightNumber": leg.get("flight_number", ""),
                        "duration": _minutes_to_iso(leg.get("duration", 0)),
                    })

                first_dep = first_leg.get("departure_airport", {})
                last_arr = last_leg.get("arrival_airport", {})

                offer_id += 1
                offers.append({
                    "id": str(offer_id),
                    "airline": airline,
                    "airlineName": airline,
                    "price": price,
                    "currency": "USD",
                    "totalPrice": price * adults,
                    "departureTime": first_dep.get("time", ""),
                    "arrivalTime": last_arr.get("time", ""),
                    "duration": _minutes_to_iso(total_duration),
                    "stops": len(flight_legs) - 1,
                    "segments": segments,
                })
            except (KeyError, IndexError, ValueError):
                continue

    return offers
