"""Key docs catalog — scans project directories for .md files."""
from __future__ import annotations

import os
import datetime
from pathlib import Path
from flask import Blueprint, jsonify

docs_bp = Blueprint("docs", __name__)

# Directories to scan (project name → path)
_SCAN_DIRS = {
    "Langly": os.path.expanduser("~/langly"),
    "LangChain Agent": os.path.expanduser("~/langchain-agent"),
    "Kindora Calendar": os.path.expanduser("~/kindora-calendar"),
    "Claude Config": os.path.expanduser("~/.claude"),
}

# Directories to skip
_SKIP_DIRS = {
    "node_modules", ".git", "venv", "__pycache__", "cache", "plans",
    "dist", "build", ".next", ".venv", "env",
    # Claude config noise
    "plugins", "marketplaces", "downloads", "paste-cache",
    "shell-snapshots", "statsig", "telemetry", "file-history",
    "debug", "tasks", "todos", "usage-data", "stats-cache",
    "session-env",
}


def _extract_description(filepath: str) -> str:
    """Read first few lines of a .md file and extract a one-sentence description."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            lines = []
            for _ in range(15):
                line = f.readline()
                if not line:
                    break
                lines.append(line.rstrip())
    except (OSError, PermissionError):
        return ""

    # First pass: find the first non-empty, non-heading line
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#"):
            continue
        if stripped.startswith("---"):
            continue
        if stripped.startswith("```"):
            continue
        # Return first content line, truncated
        desc = stripped.lstrip("- >*_")
        if len(desc) > 120:
            desc = desc[:117] + "..."
        return desc

    # Fallback: use the first heading text
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#"):
            desc = stripped.lstrip("# ").strip()
            if len(desc) > 120:
                desc = desc[:117] + "..."
            return desc

    return ""


def _scan_directory(base_path: str) -> list:
    """Recursively find .md files in a directory, skipping excluded dirs."""
    results = []
    base = Path(base_path)
    if not base.exists():
        return results

    for root, dirs, files in os.walk(base_path):
        # Prune skipped directories
        dirs[:] = [d for d in dirs if d not in _SKIP_DIRS]

        for fname in files:
            if not fname.endswith(".md"):
                continue
            filepath = os.path.join(root, fname)
            try:
                stat = os.stat(filepath)
                size_bytes = stat.st_size
                modified_at = datetime.datetime.fromtimestamp(
                    stat.st_mtime, tz=datetime.timezone.utc
                ).isoformat()
            except OSError:
                size_bytes = 0
                modified_at = None

            description = _extract_description(filepath)

            results.append({
                "path": filepath,
                "name": fname,
                "relativePath": str(Path(filepath).relative_to(base)),
                "description": description,
                "sizeBytes": size_bytes,
                "modifiedAt": modified_at,
            })

    # Sort by modification time, most recent first
    results.sort(key=lambda f: f.get("modifiedAt") or "", reverse=True)
    return results


@docs_bp.route("/api/docs/catalog", methods=["GET"])
def get_docs_catalog():
    groups = []
    for project_name, dir_path in _SCAN_DIRS.items():
        files = _scan_directory(dir_path)
        if files:
            groups.append({
                "project": project_name,
                "files": files,
            })
    return jsonify({"groups": groups})
