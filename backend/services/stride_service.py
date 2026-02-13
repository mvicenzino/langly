"""Stride Job Tracker integration — HTTP client with caching."""
from __future__ import annotations

import os
import time
import threading
from typing import Optional

import requests

# ── Config ────────────────────────────────────────────────────────────────────

CACHE_TTL = 60  # seconds

_lock = threading.Lock()
_cache: dict = {}


def _get_config():
    """Return (base_url, api_key) from environment."""
    base_url = os.environ.get(
        "STRIDE_BASE_URL", "https://stride-jobs.vercel.app"
    ).rstrip("/")
    api_key = os.environ.get("STRIDE_API_KEY", "")
    return base_url, api_key


def _headers():
    """Build request headers with API key."""
    _, api_key = _get_config()
    return {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
    }


def _url(path: str) -> str:
    """Build full URL for a Stride API path."""
    base_url, _ = _get_config()
    return f"{base_url}{path}"


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

def _get(path: str, params: Optional[dict] = None, timeout: int = 15):
    """Thread-safe GET request to Stride."""
    with _lock:
        resp = requests.get(
            _url(path),
            headers=_headers(),
            params=params,
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()


def _post(path: str, data: dict, timeout: int = 15):
    """Thread-safe POST request to Stride."""
    with _lock:
        resp = requests.post(
            _url(path),
            headers=_headers(),
            json=data,
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()


# ── Public API ───────────────────────────────────────────────────────────────

def get_pipeline() -> dict:
    """Get applications grouped by pipeline status."""
    def fetcher():
        data = _get("/api/pipeline")
        return data.get("pipeline", data) if isinstance(data, dict) else data

    return _cached("pipeline", fetcher)


def get_applications(status: Optional[str] = None, limit: int = 20) -> list:
    """Get applications, optionally filtered by status."""
    cache_key = f"applications:{status}:{limit}"

    def fetcher():
        params = {"limit": str(limit)}
        if status:
            params["status"] = status
        data = _get("/api/applications", params=params)
        return data.get("applications", []) if isinstance(data, dict) else data

    return _cached(cache_key, fetcher)


def get_application(app_id: int) -> dict:
    """Get full details for a single application."""
    cache_key = f"application:{app_id}"

    def fetcher():
        data = _get(f"/api/applications/{app_id}/detail")
        return data.get("application", data) if isinstance(data, dict) else data

    return _cached(cache_key, fetcher)


def get_dashboard_stats() -> dict:
    """Get dashboard summary statistics."""
    def fetcher():
        data = _get("/api/dashboard/stats")
        return data.get("stats", data) if isinstance(data, dict) else data

    return _cached("dashboard_stats", fetcher)


def get_upcoming_events() -> list:
    """Get upcoming events (interviews, deadlines)."""
    def fetcher():
        data = _get("/api/events/upcoming")
        return data.get("events", []) if isinstance(data, dict) else data

    return _cached("upcoming_events", fetcher)


def get_contacts(limit: int = 100) -> list:
    """Get all contacts from Stride."""
    cache_key = f"contacts:{limit}"

    def fetcher():
        data = _get("/api/contacts", params={"limit": str(limit)})
        return data.get("contacts", []) if isinstance(data, dict) else data

    return _cached(cache_key, fetcher)


def get_contact(contact_id: int) -> dict:
    """Get full details for a single contact."""
    cache_key = f"contact:{contact_id}"

    def fetcher():
        data = _get(f"/api/contacts/{contact_id}")
        return data.get("contact", data) if isinstance(data, dict) else data

    return _cached(cache_key, fetcher)


def search_contacts(q: str) -> list:
    """Search contacts by name. Not cached — results vary per query."""
    data = _get("/api/contacts/search", params={"q": q})
    return data.get("contacts", []) if isinstance(data, dict) else data


def create_contact(name: str, company: str = "", title: str = "",
                   contact_type: str = "networking", email: str = "",
                   phone: str = "", linkedin_url: str = "",
                   notes: str = "") -> dict:
    """Create a new contact on Stride."""
    payload = {"name": name}
    if company:
        payload["company"] = company
    if title:
        payload["title"] = title
    if contact_type:
        payload["contact_type"] = contact_type
    if email:
        payload["email"] = email
    if phone:
        payload["phone"] = phone
    if linkedin_url:
        payload["linkedin_url"] = linkedin_url
    if notes:
        payload["notes"] = notes
    result = _post("/api/contacts", payload)
    _invalidate_cache("contacts")
    return result


def create_job(title: str, company_name: str, location: str = "",
               remote_type: str = "", job_url: str = "",
               source: str = "Langly", create_lead: bool = True) -> dict:
    """Create a new job (and optionally a lead) on Stride."""
    data = {
        "title": title,
        "company_name": company_name,
        "location": location,
        "remote_type": remote_type,
        "job_url": job_url,
        "source": source,
        "create_lead": create_lead,
    }
    result = _post("/api/jobs", data)
    _invalidate_cache()  # Clear all caches since pipeline changes
    return result
