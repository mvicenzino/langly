"""GitHub repos endpoint — fetches public repos from GitHub API with in-memory caching."""
from __future__ import annotations

import time
from flask import Blueprint, jsonify, request
import requests

github_bp = Blueprint("github", __name__)

_cache: dict = {"data": None, "ts": 0, "username": ""}
_CACHE_TTL = 300  # 5 minutes


@github_bp.route("/api/github/repos")
def get_repos():
    username = request.args.get("username", "mvicenzino")
    now = time.time()

    if _cache["data"] and _cache["username"] == username and now - _cache["ts"] < _CACHE_TTL:
        return jsonify(_cache["data"])

    try:
        repos = []
        page = 1
        while True:
            resp = requests.get(
                f"https://api.github.com/users/{username}/repos",
                params={"per_page": 100, "page": page, "sort": "updated"},
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=10,
            )
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break
            repos.extend(batch)
            if len(batch) < 100:
                break
            page += 1

        result = [
            {
                "name": r["name"],
                "url": r["html_url"],
                "description": r.get("description") or "",
                "language": r.get("language") or "",
                "stars": r.get("stargazers_count", 0),
                "forks": r.get("forks_count", 0),
                "updated_at": r.get("updated_at", ""),
                "private": r.get("private", False),
            }
            for r in repos
        ]

        _cache["data"] = result
        _cache["ts"] = now
        _cache["username"] = username

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
