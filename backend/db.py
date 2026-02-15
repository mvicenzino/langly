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

# Railway uses postgresql:// but psycopg2 needs postgres://
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgres://", 1)


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


def init_tables():
    """Create tables if they don't exist (for Railway deployment)."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS todos (
                    id SERIAL PRIMARY KEY,
                    task TEXT NOT NULL,
                    done BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS notes (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT DEFAULT '',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id SERIAL PRIMARY KEY,
                    title TEXT DEFAULT 'New Chat',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id SERIAL PRIMARY KEY,
                    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    tool_calls JSONB DEFAULT '[]',
                    thinking_steps JSONB DEFAULT '[]',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS activity_log (
                    id SERIAL PRIMARY KEY,
                    source TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS contacts (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    company TEXT DEFAULT '',
                    email TEXT DEFAULT '',
                    phone TEXT DEFAULT '',
                    notes TEXT DEFAULT '',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS note_mentions (
                    id SERIAL PRIMARY KEY,
                    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(note_id, contact_id)
                );
                CREATE TABLE IF NOT EXISTS content_calendar (
                    id SERIAL PRIMARY KEY,
                    batch_id TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    scheduled_date DATE NOT NULL,
                    week_number INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    body TEXT NOT NULL,
                    hashtags TEXT DEFAULT '',
                    status TEXT DEFAULT 'draft',
                    notes TEXT DEFAULT '',
                    published_url TEXT DEFAULT '',
                    published_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS social_oauth_tokens (
                    id SERIAL PRIMARY KEY,
                    platform TEXT NOT NULL UNIQUE,
                    access_token TEXT NOT NULL,
                    refresh_token TEXT DEFAULT '',
                    token_type TEXT DEFAULT 'Bearer',
                    expires_at TIMESTAMPTZ,
                    scope TEXT DEFAULT '',
                    raw_response JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS trips (
                    id SERIAL PRIMARY KEY,
                    destination TEXT NOT NULL,
                    start_date DATE,
                    end_date DATE,
                    notes TEXT DEFAULT '',
                    status TEXT DEFAULT 'planning',
                    airports TEXT DEFAULT 'EWR',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS packing_items (
                    id SERIAL PRIMARY KEY,
                    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
                    category TEXT NOT NULL DEFAULT 'essentials',
                    item TEXT NOT NULL,
                    packed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS saved_searches (
                    id SERIAL PRIMARY KEY,
                    search_type TEXT NOT NULL,
                    label TEXT NOT NULL,
                    destination TEXT DEFAULT '',
                    url TEXT DEFAULT '',
                    metadata JSONB DEFAULT '{}',
                    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)
            # Add columns to existing tables (safe idempotent migration)
            try:
                cur.execute("""
                    ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS published_url TEXT DEFAULT '';
                    ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
                """)
            except Exception:
                pass
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        put_conn(conn)
