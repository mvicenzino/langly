"""Kindora Calendar service — HTTP client for the Kindora family calendar API.

Singleton HTTP client with in-memory caching (5 min TTL), thread-safe.
Uses API key auth via X-API-Key header for server-to-server calls.
Python 3.9 compatible.
"""
from __future__ import annotations

import os
import time
import threading
from datetime import datetime, timedelta
from typing import Optional

import requests

# ── Config ────────────────────────────────────────────────────────────────────

CACHE_TTL = 30  # 30 seconds (supports 60s auto-refresh in widget)

# ── Singleton state ───────────────────────────────────────────────────────────

_lock = threading.Lock()
_cache: dict = {}


def _get_config() -> tuple:
    """Return (base_url, api_key, family_id) from env."""
    base_url = os.getenv("KINDORA_BASE_URL", "").rstrip("/")
    api_key = os.getenv("KINDORA_API_KEY", "")
    family_id = os.getenv("KINDORA_FAMILY_ID", "")
    if not base_url or not api_key or not family_id:
        raise RuntimeError(
            "Kindora not configured: set KINDORA_BASE_URL, KINDORA_API_KEY, "
            "and KINDORA_FAMILY_ID in .env"
        )
    return base_url, api_key, family_id


def _headers() -> dict:
    """Return auth headers for Kindora API calls."""
    _, api_key, _ = _get_config()
    return {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
    }


def _url(path: str) -> str:
    """Build full URL for a Kindora API path."""
    base_url, _, _ = _get_config()
    return f"{base_url}{path}"


def _family_params(extra: Optional[dict] = None) -> dict:
    """Return query params with familyId included."""
    _, _, family_id = _get_config()
    params = {"familyId": family_id}
    if extra:
        params.update(extra)
    return params


# ── Caching ──────────────────────────────────────────────────────────────────

def _cached(key: str, fetcher):
    """Return cached value or call fetcher, caching the result for CACHE_TTL."""
    now = time.time()
    entry = _cache.get(key)
    if entry and now - entry["ts"] < CACHE_TTL:
        return entry["val"]
    val = fetcher()
    _cache[key] = {"val": val, "ts": now}
    return val


def _invalidate_cache(prefix: Optional[str] = None):
    """Clear cache entries. If prefix given, only clear matching keys."""
    if prefix is None:
        _cache.clear()
    else:
        keys_to_remove = [k for k in _cache if k.startswith(prefix)]
        for k in keys_to_remove:
            _cache.pop(k, None)


# ── HTTP helpers ─────────────────────────────────────────────────────────────

def _get(path: str, params: Optional[dict] = None, timeout: int = 10):
    """Thread-safe GET request to Kindora."""
    with _lock:
        resp = requests.get(
            _url(path),
            headers=_headers(),
            params=_family_params(params),
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()


def _post(path: str, data: dict, timeout: int = 10):
    """Thread-safe POST request to Kindora."""
    _, _, family_id = _get_config()
    body = {**data, "familyId": family_id}
    with _lock:
        resp = requests.post(
            _url(path),
            headers=_headers(),
            json=body,
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()


def _put(path: str, data: dict, timeout: int = 10):
    """Thread-safe PUT request to Kindora."""
    _, _, family_id = _get_config()
    body = {**data, "familyId": family_id}
    with _lock:
        resp = requests.put(
            _url(path),
            headers=_headers(),
            json=body,
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()


def _delete(path: str, timeout: int = 10):
    """Thread-safe DELETE request to Kindora."""
    with _lock:
        resp = requests.delete(
            _url(path),
            headers=_headers(),
            params=_family_params(),
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()


# ── Public API (sync, JSON-serializable) ──────────────────────────────────────

def get_events(start_date: Optional[str] = None,
               end_date: Optional[str] = None) -> list:
    """Return events, optionally filtered by date range.

    Events are returned sorted by start time.
    """
    cache_key = f"events:{start_date}:{end_date}"

    def fetcher():
        raw = _get("/api/events")
        # raw is a list of event objects
        events_list = raw if isinstance(raw, list) else []

        # Filter by date range if provided
        filtered = []
        for ev in events_list:
            start = ev.get("startTime") or ev.get("start_time", "")
            if start_date and start < start_date:
                continue
            if end_date and start > end_date + "T23:59:59":
                continue
            filtered.append(_normalize_event(ev))

        # Sort by start time
        filtered.sort(key=lambda e: e.get("startTime", ""))
        return filtered

    return _cached(cache_key, fetcher)


def get_today() -> list:
    """Return today's events."""
    today = datetime.now().strftime("%Y-%m-%d")
    return get_events(start_date=today, end_date=today)


def get_upcoming(days: int = 7) -> list:
    """Return events in the next N days."""
    today = datetime.now()
    start = today.strftime("%Y-%m-%d")
    end = (today + timedelta(days=days)).strftime("%Y-%m-%d")
    return get_events(start_date=start, end_date=end)


def create_event(title: str, start_time: str, end_time: str,
                 description: str = "", member_ids: Optional[list] = None,
                 color: str = "#3B82F6") -> dict:
    """Create a new event on the Kindora calendar.

    Args:
        title: Event title
        start_time: ISO datetime string (e.g., "2025-02-15T14:00:00")
        end_time: ISO datetime string
        description: Optional event description
        member_ids: Optional list of family member IDs
        color: Optional hex color (default blue)
    """
    data = {
        "title": title,
        "startTime": start_time,
        "endTime": end_time,
        "description": description or "",
        "memberIds": member_ids or [],
        "color": color,
    }
    result = _post("/api/events", data)
    _invalidate_cache("events")
    return _normalize_event(result)


def update_event(event_id: str, **kwargs) -> dict:
    """Update an existing event.

    Accepts any event fields: title, startTime, endTime, description,
    memberIds, color, completed.
    """
    result = _put(f"/api/events/{event_id}", kwargs)
    _invalidate_cache("events")
    return _normalize_event(result)


def delete_event(event_id: str) -> dict:
    """Delete an event."""
    result = _delete(f"/api/events/{event_id}")
    _invalidate_cache("events")
    return result


def get_family_members() -> list:
    """Return family members list."""
    def fetcher():
        raw = _get("/api/family-members")
        members = raw if isinstance(raw, list) else []
        return [
            {
                "id": m.get("id", ""),
                "name": m.get("name", ""),
                "color": m.get("color", ""),
                "avatar": m.get("avatar", ""),
            }
            for m in members
        ]

    return _cached("family_members", fetcher)


def get_medications() -> list:
    """Return medications list."""
    def fetcher():
        raw = _get("/api/medications")
        meds = raw if isinstance(raw, list) else []
        return [
            {
                "id": m.get("id", ""),
                "name": m.get("name", ""),
                "dosage": m.get("dosage", ""),
                "frequency": m.get("frequency", ""),
                "memberId": m.get("memberId", ""),
                "isActive": m.get("isActive", True),
            }
            for m in meds
        ]

    return _cached("medications", fetcher)


def get_care_documents() -> list:
    """Return care documents list."""
    def fetcher():
        raw = _get("/api/care-documents")
        docs = raw if isinstance(raw, list) else []
        return [
            {
                "id": d.get("id", ""),
                "title": d.get("title", ""),
                "category": d.get("category", ""),
                "memberId": d.get("memberId", ""),
                "fileUrl": d.get("fileUrl", ""),
                "createdAt": d.get("createdAt", ""),
            }
            for d in docs
        ]

    return _cached("care_documents", fetcher)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _normalize_event(ev: dict) -> dict:
    """Normalize a Kindora event to a consistent shape."""
    return {
        "id": ev.get("id", ""),
        "title": ev.get("title", ""),
        "description": ev.get("description", ""),
        "startTime": ev.get("startTime") or ev.get("start_time", ""),
        "endTime": ev.get("endTime") or ev.get("end_time", ""),
        "memberIds": ev.get("memberIds") or ev.get("member_ids", []),
        "color": ev.get("color", "#3B82F6"),
        "completed": ev.get("completed", False),
        "noteCount": ev.get("noteCount", 0),
    }
