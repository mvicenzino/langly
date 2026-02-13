#!/usr/bin/env python3
"""Entry point for the Langly backend."""

import platform
import sys
from pathlib import Path

# Fix broken kqueue selector on macOS system Python 3.9
if platform.system() == "Darwin":
    import selectors
    selectors.DefaultSelector = selectors.SelectSelector

# Ensure project root is on path for imports
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import os
import backend.config  # noqa: F401 — loads .env into os.environ
from backend.app import create_app, socketio

app = create_app()

# Auto-create tables on startup
try:
    from backend.db import init_tables
    init_tables()
    print("Database tables verified.")
except Exception as e:
    print(f"Warning: Could not init tables: {e}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Langly backend starting on http://localhost:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False,
                 allow_unsafe_werkzeug=True)
