"""OpenClaw gateway integration — reads config, memory, cron jobs, and proxies to gateway."""
import json
import os
import sqlite3
from pathlib import Path
from flask import Blueprint, jsonify, request
import requests as http_requests

openclaw_bp = Blueprint("openclaw", __name__)

OPENCLAW_DIR = Path.home() / ".openclaw"
OPENCLAW_CONFIG = OPENCLAW_DIR / "openclaw.json"
OPENCLAW_CRON = OPENCLAW_DIR / "cron" / "jobs.json"
OPENCLAW_MEMORY = OPENCLAW_DIR / "memory" / "main.sqlite"
GATEWAY_PORT = int(os.getenv("OPENCLAW_GATEWAY_PORT", "18789"))
GATEWAY_TOKEN = os.getenv(
    "OPENCLAW_GATEWAY_TOKEN",
    "c6665a00952e2b93d38e3a6ca1cf22a55ae013415b6c425c"
)


def _gateway_url(path: str) -> str:
    return f"http://127.0.0.1:{GATEWAY_PORT}{path}"


def _gateway_headers() -> dict:
    return {"Authorization": f"Bearer {GATEWAY_TOKEN}", "Content-Type": "application/json"}


@openclaw_bp.route("/api/openclaw/status")
def openclaw_status():
    """Get OpenClaw gateway status and config summary."""
    try:
        config = {}
        if OPENCLAW_CONFIG.exists():
            config = json.loads(OPENCLAW_CONFIG.read_text())

        # Check if gateway is alive
        gateway_alive = False
        try:
            resp = http_requests.get(
                _gateway_url("/__openclaw__/canvas/"),
                headers=_gateway_headers(),
                timeout=2
            )
            gateway_alive = resp.status_code < 500
        except Exception:
            pass

        agents_config = config.get("agents", {}).get("defaults", {})
        model_config = agents_config.get("model", {})
        channels_config = config.get("channels", {})

        enabled_channels = [
            ch for ch, cfg in channels_config.items()
            if isinstance(cfg, dict) and cfg.get("enabled")
        ]

        return jsonify({
            "alive": gateway_alive,
            "version": config.get("meta", {}).get("lastTouchedVersion", "unknown"),
            "model": model_config.get("primary", "unknown"),
            "workspace": agents_config.get("workspace", ""),
            "maxConcurrent": agents_config.get("maxConcurrent", 0),
            "channels": enabled_channels,
            "gatewayMode": config.get("gateway", {}).get("mode", "unknown"),
            "port": GATEWAY_PORT,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@openclaw_bp.route("/api/openclaw/cron")
def openclaw_cron():
    """Get scheduled cron jobs."""
    try:
        if not OPENCLAW_CRON.exists():
            return jsonify([])

        data = json.loads(OPENCLAW_CRON.read_text())
        jobs = data.get("jobs", [])

        result = []
        for job in jobs:
            schedule = job.get("schedule", {})
            state = job.get("state", {})
            payload = job.get("payload", {})
            delivery = job.get("delivery", {})

            result.append({
                "id": job.get("id", ""),
                "name": job.get("name", "unnamed"),
                "enabled": job.get("enabled", False),
                "schedule": schedule.get("expr", ""),
                "timezone": schedule.get("tz", "UTC"),
                "lastStatus": state.get("lastStatus", "never"),
                "lastRunAt": state.get("lastRunAtMs"),
                "nextRunAt": state.get("nextRunAtMs"),
                "lastDurationMs": state.get("lastDurationMs"),
                "consecutiveErrors": state.get("consecutiveErrors", 0),
                "channel": delivery.get("channel") or delivery.get("to", ""),
                "description": (payload.get("message") or payload.get("text", ""))[:120],
            })

        result.sort(key=lambda j: j.get("nextRunAt") or 0)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@openclaw_bp.route("/api/openclaw/memory")
def openclaw_memory():
    """Get recent memory entries from OpenClaw's SQLite store."""
    try:
        if not OPENCLAW_MEMORY.exists():
            return jsonify([])

        limit = request.args.get("limit", "20", type=str)
        conn = sqlite3.connect(str(OPENCLAW_MEMORY), timeout=5)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Try to discover tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row["name"] for row in cursor.fetchall()]

        entries = []

        # Common memory table patterns
        for table in tables:
            try:
                cursor.execute(f"PRAGMA table_info({table})")
                cols = [row["name"] for row in cursor.fetchall()]

                if not cols:
                    continue

                # Get recent entries from each table
                order_col = None
                for candidate in ["created_at", "timestamp", "updated_at", "id", "rowid"]:
                    if candidate in cols:
                        order_col = candidate
                        break

                query = f"SELECT * FROM {table}"
                if order_col:
                    query += f" ORDER BY {order_col} DESC"
                query += f" LIMIT {int(limit)}"

                cursor.execute(query)
                rows = cursor.fetchall()
                for row in rows:
                    entry = dict(row)
                    entry["_table"] = table
                    entries.append(entry)
            except Exception:
                continue

        conn.close()

        return jsonify({
            "tables": tables,
            "entries": entries[:int(limit)],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@openclaw_bp.route("/api/openclaw/send", methods=["POST"])
def openclaw_send():
    """Send a message through OpenClaw gateway."""
    try:
        body = request.get_json() or {}
        message = body.get("message", "")
        channel = body.get("channel", "")

        if not message:
            return jsonify({"error": "message required"}), 400

        # Try to send via gateway WebSocket API
        resp = http_requests.post(
            _gateway_url("/api/v1/message"),
            headers=_gateway_headers(),
            json={"message": message, "channel": channel},
            timeout=10
        )

        return jsonify({"status": "sent", "statusCode": resp.status_code})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@openclaw_bp.route("/api/openclaw/workspace")
def openclaw_workspace():
    """List recent files in OpenClaw workspace."""
    try:
        config = {}
        if OPENCLAW_CONFIG.exists():
            config = json.loads(OPENCLAW_CONFIG.read_text())

        workspace = config.get("agents", {}).get("defaults", {}).get("workspace", "")
        if not workspace or not Path(workspace).exists():
            return jsonify([])

        ws_path = Path(workspace)
        files = []
        for f in sorted(ws_path.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
            if f.name.startswith("."):
                continue
            stat = f.stat()
            files.append({
                "name": f.name,
                "isDir": f.is_dir(),
                "size": stat.st_size,
                "modified": int(stat.st_mtime * 1000),
            })

        return jsonify(files[:30])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
