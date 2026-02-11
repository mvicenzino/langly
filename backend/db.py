"""Database connection pool and helpers for Langly."""
from __future__ import annotations

import os
from typing import Optional

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

_pool = None

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "host=/tmp user=michaelvicenzino dbname=langly"
)


def get_pool():
    global _pool
    if _pool is None:
        _pool = pool.ThreadedConnectionPool(1, 10, DATABASE_URL)
    return _pool


def get_conn():
    return get_pool().getconn()


def put_conn(conn):
    get_pool().putconn(conn)


def query(sql: str, params=None) -> list:
    """Execute a SELECT query and return list of dicts."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]
    finally:
        put_conn(conn)


def execute(sql: str, params=None) -> int:
    """Execute an INSERT/UPDATE/DELETE and return affected row count."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            conn.commit()
            return cur.rowcount
    except Exception:
        conn.rollback()
        raise
    finally:
        put_conn(conn)


def execute_returning(sql: str, params=None) -> Optional[dict]:
    """Execute INSERT ... RETURNING and return the inserted row."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            conn.commit()
            row = cur.fetchone()
            return dict(row) if row else None
    except Exception:
        conn.rollback()
        raise
    finally:
        put_conn(conn)


def log_activity(source: str, event_type: str, summary: str, metadata: Optional[dict] = None):
    """Log an activity event."""
    import json
    execute(
        "INSERT INTO activity_log (source, event_type, summary, metadata) VALUES (%s, %s, %s, %s)",
        (source, event_type, summary, json.dumps(metadata or {}))
    )
