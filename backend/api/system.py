"""System info endpoints — local machine stats and data scraping."""
from __future__ import annotations

import platform
import subprocess
import os
from pathlib import Path
from typing import List, Dict
from flask import Blueprint, jsonify

system_bp = Blueprint("system", __name__)


def _safe_run(cmd, timeout=5):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip()
    except Exception:
        return ""


def _get_cpu_info() -> dict:
    """Get CPU usage and info."""
    try:
        import psutil
        return {
            "percent": psutil.cpu_percent(interval=0.5),
            "cores": psutil.cpu_count(logical=False) or 0,
            "threads": psutil.cpu_count(logical=True) or 0,
            "freq": round(psutil.cpu_freq().current, 0) if psutil.cpu_freq() else 0,
        }
    except ImportError:
        # Fallback without psutil
        load = os.getloadavg()
        return {
            "percent": round(load[0] * 100 / (os.cpu_count() or 1), 1),
            "cores": os.cpu_count() or 0,
            "threads": os.cpu_count() or 0,
            "loadAvg": [round(l, 2) for l in load],
        }


def _get_memory_info() -> dict:
    """Get memory usage."""
    try:
        import psutil
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "used": mem.used,
            "available": mem.available,
            "percent": mem.percent,
        }
    except ImportError:
        output = _safe_run(["sysctl", "-n", "hw.memsize"])
        total = int(output) if output.isdigit() else 0
        return {"total": total, "used": 0, "available": 0, "percent": 0}


def _get_disk_info() -> dict:
    """Get disk usage for root."""
    try:
        import psutil
        disk = psutil.disk_usage("/")
        return {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent,
        }
    except ImportError:
        import shutil
        total, used, free = shutil.disk_usage("/")
        return {
            "total": total,
            "used": used,
            "free": free,
            "percent": round(used / total * 100, 1) if total else 0,
        }


def _get_network_info() -> dict:
    """Get network interfaces."""
    try:
        import psutil
        net = psutil.net_io_counters()
        return {
            "bytesSent": net.bytes_sent,
            "bytesRecv": net.bytes_recv,
            "packetsSent": net.packets_sent,
            "packetsRecv": net.packets_recv,
        }
    except ImportError:
        return {"bytesSent": 0, "bytesRecv": 0, "packetsSent": 0, "packetsRecv": 0}


def _get_processes():
    """Get top processes by CPU usage."""
    try:
        import psutil
        procs = []
        for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
            try:
                info = proc.info
                cpu_pct = info.get("cpu_percent") or 0
                mem_pct = info.get("memory_percent") or 0
                if cpu_pct > 0.1:
                    procs.append({
                        "pid": info["pid"],
                        "name": info["name"] or "unknown",
                        "cpu": round(cpu_pct, 1),
                        "memory": round(mem_pct, 1),
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        procs.sort(key=lambda p: p["cpu"], reverse=True)
        return procs[:10]
    except ImportError:
        return []


@system_bp.route("/api/system/info")
def system_info():
    """Get full system info snapshot."""
    try:
        uptime_output = _safe_run(["uptime"])

        return jsonify({
            "hostname": platform.node(),
            "os": f"{platform.system()} {platform.release()}",
            "arch": platform.machine(),
            "python": platform.python_version(),
            "uptime": uptime_output,
            "cpu": _get_cpu_info(),
            "memory": _get_memory_info(),
            "disk": _get_disk_info(),
            "network": _get_network_info(),
            "topProcesses": _get_processes(),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@system_bp.route("/api/system/files")
def recent_files():
    """Get recently modified files in home directory."""
    try:
        home = Path.home()
        interesting_dirs = [
            home / "Desktop",
            home / "Documents",
            home / "Downloads",
            home / "clawd",
        ]

        files = []
        for d in interesting_dirs:
            if not d.exists():
                continue
            for f in d.iterdir():
                if f.name.startswith("."):
                    continue
                try:
                    stat = f.stat()
                    files.append({
                        "name": f.name,
                        "path": str(f),
                        "dir": d.name,
                        "isDir": f.is_dir(),
                        "size": stat.st_size,
                        "modified": int(stat.st_mtime * 1000),
                    })
                except (PermissionError, OSError):
                    continue

        files.sort(key=lambda f: f["modified"], reverse=True)
        return jsonify(files[:30])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@system_bp.route("/api/system/services")
def running_services():
    """Detect running development services."""
    services = []

    # Check common ports
    port_checks = [
        (5001, "Langly Backend", "flask"),
        (5173, "Langly Frontend", "vite"),
        (18789, "OpenClaw Gateway", "openclaw"),
        (3000, "Dev Server", "node"),
        (8080, "Web Server", "http"),
        (5432, "PostgreSQL", "postgres"),
        (6379, "Redis", "redis"),
        (27017, "MongoDB", "mongo"),
    ]

    import socket
    for port, name, kind in port_checks:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        try:
            result = sock.connect_ex(("127.0.0.1", port))
            if result == 0:
                services.append({"port": port, "name": name, "kind": kind, "status": "running"})
        except Exception:
            pass
        finally:
            sock.close()

    return jsonify(services)
