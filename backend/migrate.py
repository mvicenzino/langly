"""Migrate existing flat-file data (todos.json, notes/) into PostgreSQL."""
import json
import os
from pathlib import Path

from backend.config import TODOS_PATH, NOTES_DIR
from backend.db import query, execute_returning


def migrate_todos():
    """Import todos from todos.json into PostgreSQL if not already migrated."""
    existing = query("SELECT COUNT(*) as count FROM todos")
    if existing[0]["count"] > 0:
        print(f"  Skipping todos migration — {existing[0]['count']} already in DB")
        return

    try:
        with open(TODOS_PATH, "r") as f:
            todos = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print("  No todos.json found, skipping")
        return

    count = 0
    for todo in todos:
        task = todo.get("task", "")
        done = todo.get("done", False)
        if task:
            execute_returning(
                "INSERT INTO todos (task, done) VALUES (%s, %s) RETURNING id",
                (task, done)
            )
            count += 1

    print(f"  Migrated {count} todos from {TODOS_PATH}")


def migrate_notes():
    """Import notes from notes/ directory into PostgreSQL if not already migrated."""
    existing = query("SELECT COUNT(*) as count FROM notes")
    if existing[0]["count"] > 0:
        print(f"  Skipping notes migration — {existing[0]['count']} already in DB")
        return

    if not os.path.exists(NOTES_DIR):
        print("  No notes directory found, skipping")
        return

    count = 0
    for filename in sorted(os.listdir(NOTES_DIR)):
        if filename.endswith(".txt"):
            filepath = os.path.join(NOTES_DIR, filename)
            with open(filepath, "r") as f:
                content = f.read()
            title = filename[:-4].replace("_", " ")
            execute_returning(
                "INSERT INTO notes (title, content) VALUES (%s, %s) RETURNING id",
                (title, content)
            )
            count += 1

    print(f"  Migrated {count} notes from {NOTES_DIR}")


def run_migrations():
    print("Running data migrations...")
    migrate_todos()
    migrate_notes()
    print("Migrations complete!")


if __name__ == "__main__":
    run_migrations()
