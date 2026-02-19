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

        # If no config file exists, OpenClaw is not installed on this host
        if not config:
            return jsonify({
                "configured": False,
                "alive": False,
                "version": "",
                "model": "",
                "workspace": "",
                "maxConcurrent": 0,
                "channels": [],
                "gatewayMode": "",
                "port": GATEWAY_PORT,
            })

        agents_config = config.get("agents", {}).get("defaults", {})
        model_config = agents_config.get("model", {})
        channels_config = config.get("channels", {})

        enabled_channels = [
            ch for ch, cfg in channels_config.items()
            if isinstance(cfg, dict) and cfg.get("enabled")
        ]

        return jsonify({
            "configured": True,
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


def _get_openclaw_metrics():
    """Helper to extract OpenClaw health metrics."""
    from datetime import datetime, timezone
    
    config = {}
    if OPENCLAW_CONFIG.exists():
        config = json.loads(OPENCLAW_CONFIG.read_text())
    
    # 1. Gateway Status
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
    
    # 2. Active Agents (from sessions)
    active_agents = 0
    last_heartbeat = None
    sessions_dir = OPENCLAW_DIR / "agents" / "main" / "sessions"
    if sessions_dir.exists():
        try:
            sessions_file = sessions_dir.parent / "sessions.json"
            if sessions_file.exists():
                sessions_data = json.loads(sessions_file.read_text())
                active_agents = len(sessions_data) if isinstance(sessions_data, list) else len(sessions_data.get("sessions", []))
                
                # Get last heartbeat time
                for session_key in (sessions_data if isinstance(sessions_data, list) else sessions_data.get("sessions", [])):
                    session_file = sessions_dir / f"{session_key}.jsonl"
                    if session_file.exists():
                        lines = session_file.read_text().strip().split('\n')
                        if lines:
                            last_entry = json.loads(lines[-1])
                            timestamp = last_entry.get("createdAt") or last_entry.get("timestamp")
                            if timestamp:
                                last_heartbeat = timestamp
                                break
        except Exception:
            pass
    
    # 3. Cron Job Health
    cron_successful = 0
    cron_failed = 0
    if OPENCLAW_CRON.exists():
        try:
            cron_data = json.loads(OPENCLAW_CRON.read_text())
            jobs = cron_data.get("jobs", [])
            for job in jobs:
                state = job.get("state", {})
                last_status = state.get("lastStatus", "never")
                if last_status == "success":
                    cron_successful += 1
                elif last_status == "error":
                    cron_failed += 1
        except Exception:
            pass
    
    # 4. OpenClaw Version
    version = config.get("meta", {}).get("lastTouchedVersion", "unknown")
    
    # 5. Heartbeat Interval
    heartbeat_interval = config.get("gateway", {}).get("heartbeatMs", 1800000)
    heartbeat_interval_min = heartbeat_interval // 60000
    
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gateway_status": "🟢 online" if gateway_alive else "🔴 offline",
        "gateway_alive": gateway_alive,
        "active_agents": active_agents,
        "cron_health": {
            "successful": cron_successful,
            "failed": cron_failed,
            "total": cron_successful + cron_failed,
        },
        "last_heartbeat": last_heartbeat or "never",
        "heartbeat_interval_minutes": heartbeat_interval_min,
        "version": version,
    }


@openclaw_bp.route("/api/openclaw/doctor")
def openclaw_doctor():
    """Get OpenClaw health metrics: gateway status, agents, cron jobs, heartbeat, version."""
    try:
        metrics = _get_openclaw_metrics()
        return jsonify(metrics)
    except Exception as e:
        from datetime import datetime, timezone
        return jsonify({"error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()}), 500


@openclaw_bp.route("/api/openclaw/doctor/sync-reminders", methods=["POST"])
def openclaw_sync_reminders():
    """Sync OpenClaw health metrics to Apple Reminders."""
    try:
        import subprocess
        from datetime import datetime
        
        metrics = _get_openclaw_metrics()
        
        # Format reminder text
        failure_rate = "0%" if metrics["cron_health"]["total"] == 0 else f"{int((metrics['cron_health']['failed'] / metrics['cron_health']['total']) * 100)}%"
        
        reminder_text = (
            f"🦞 OpenClaw Health — {datetime.now().strftime('%I:%M %p')}\n\n"
            f"Gateway: {metrics['gateway_status']}\n"
            f"Agents: {metrics['active_agents']}\n"
            f"Cron: {metrics['cron_health']['successful']}✓ {metrics['cron_health']['failed']}✗ ({failure_rate})\n"
            f"Version: {metrics['version']}"
        )
        
        # Create or update reminder via remindctl
        result = subprocess.run(
            ["remindctl", "add", "--list", "Reminders", reminder_text],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        return jsonify({
            "status": "synced",
            "reminder_text": reminder_text,
            "remindctl_result": result.returncode == 0
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
