"""Hotel Search service — uses SerpAPI Google Hotels engine.

Searches Google Hotels via SerpAPI for real hotel prices and availability.
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


def search_hotels(
    destination: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    max_results: int = 10,
) -> list:
    """Search Google Hotels via SerpAPI, return normalized list.

    Args:
        destination: Hotel search query (e.g. "Cancun" or "Hotels in Paris")
        check_in: ISO date (e.g. "2026-04-15")
        check_out: ISO date (e.g. "2026-04-20")
        adults: Number of adult guests
        max_results: Max hotels to return

    Returns:
        List of normalized hotel offer dicts matching HotelOffer type.
    """
    api_key = _get_api_key()

    params = {
        "engine": "google_hotels",
        "api_key": api_key,
        "q": destination,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "adults": adults,
        "currency": "USD",
        "hl": "en",
    }

    resp = requests.get(SERPAPI_URL, params=params, timeout=20)
    resp.raise_for_status()
    data = resp.json()

    if "error" in data:
        raise RuntimeError(data["error"])

    hotels = []
    hotel_id = 0

    for prop in data.get("properties", []):
        if len(hotels) >= max_results:
            break

        try:
            name = prop.get("name", "Unknown Hotel")
            rate_info = prop.get("rate_per_night", {})
            total_info = prop.get("total_rate", {})
            price = rate_info.get("extracted_lowest", 0)
            total_price = total_info.get("extracted_lowest", 0)
            overall_rating = prop.get("overall_rating", 0)
            stars = prop.get("extracted_hotel_class", 0)
            reviews = prop.get("reviews", 0)
            images = prop.get("images", [])
            thumbnail_url = images[0].get("thumbnail", "") if images else ""
            link = prop.get("link", "")
            amenities = prop.get("amenities", [])[:6]
            property_token = prop.get("property_token", "")

            if not name or not price:
                continue

            hotel_id += 1
            hotels.append({
                "id": str(hotel_id),
                "name": name,
                "price": price,
                "totalPrice": total_price or price,
                "totalPriceFormatted": f"${total_price:,.0f}" if total_price else f"${price:,.0f}",
                "currency": "USD",
                "rating": overall_rating,
                "stars": stars,
                "reviews": reviews,
                "thumbnailUrl": thumbnail_url,
                "link": link,
                "propertyToken": property_token,
                "amenities": amenities,
            })
        except (KeyError, IndexError, ValueError, TypeError):
            continue

    return hotels
