"""Apple Reminders integration via AppleScript (macOS native)."""
from __future__ import annotations

import os
import subprocess
import json
import time
from flask import Blueprint, jsonify, request

reminders_bp = Blueprint("reminders", __name__)

REMINDER_LIST_NAME = os.getenv("APPLE_REMINDER_LIST", "Langly")

# Simple in-memory cache to avoid hammering AppleScript
_cache: dict = {"items": None, "ts": 0}
_CACHE_TTL = 60  # seconds


def _run_applescript(script: str) -> str:
    """Run an AppleScript and return stdout."""
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "AppleScript failed")
    return result.stdout.strip()


def _invalidate_cache():
    _cache["items"] = None
    _cache["ts"] = 0


@reminders_bp.route("/api/reminders")
def list_reminders():
    """List all reminders from Apple Reminders via AppleScript."""
    # Return cached data if fresh
    if _cache["items"] is not None and (time.time() - _cache["ts"]) < _CACHE_TTL:
        return jsonify({"configured": True, "items": _cache["items"]})

    try:
        script = f'''
tell application "Reminders"
    try
        set langlyList to list "{REMINDER_LIST_NAME}"
    on error
        return "LIST_NOT_FOUND"
    end try
    set todoItems to every reminder of langlyList whose completed is false
    set doneItems to every reminder of langlyList whose completed is true
    set output to ""
    repeat with r in todoItems
        set dueStr to ""
        try
            set dueStr to (due date of r as string)
        end try
        set notesStr to ""
        try
            set notesStr to body of r
        end try
        set output to output & "false" & "|||" & (name of r) & "|||" & (id of r) & "|||" & dueStr & "|||" & (priority of r as string) & "|||" & notesStr & linefeed
    end repeat
    repeat with r in doneItems
        set dueStr to ""
        try
            set dueStr to (due date of r as string)
        end try
        set notesStr to ""
        try
            set notesStr to body of r
        end try
        set output to output & "true" & "|||" & (name of r) & "|||" & (id of r) & "|||" & dueStr & "|||" & (priority of r as string) & "|||" & notesStr & linefeed
    end repeat
    return output
end tell'''
        raw = _run_applescript(script)
        if raw == "LIST_NOT_FOUND":
            return jsonify({"configured": True, "items": [], "error": f"List '{REMINDER_LIST_NAME}' not found in Reminders"})

        items = []
        for line in raw.strip().split("\n"):
            if not line.strip():
                continue
            parts = line.split("|||")
            if len(parts) < 3:
                continue
            done = parts[0].strip() == "true"
            task = parts[1].strip()
            uid = parts[2].strip()
            due = parts[3].strip() if len(parts) > 3 else ""
            priority = int(parts[4].strip()) if len(parts) > 4 and parts[4].strip().isdigit() else 0
            notes = parts[5].strip() if len(parts) > 5 else ""
            items.append({
                "uid": uid,
                "task": task,
                "done": done,
                "due": due,
                "priority": priority,
                "notes": notes,
            })
        _cache["items"] = items
        _cache["ts"] = time.time()
        return jsonify({"configured": True, "items": items})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"configured": True, "items": [], "error": str(e)}), 500


@reminders_bp.route("/api/reminders", methods=["POST"])
def add_reminder():
    """Add a new reminder via AppleScript."""
    body = request.get_json() or {}
    task = body.get("task", "").strip()
    if not task:
        return jsonify({"error": "task is required"}), 400

    notes = body.get("notes", "")
    # Escape quotes for AppleScript
    task_escaped = task.replace('"', '\\"')
    notes_escaped = notes.replace('"', '\\"') if notes else ""

    try:
        script = f'''
tell application "Reminders"
    try
        set langlyList to list "{REMINDER_LIST_NAME}"
    on error
        make new list with properties {{name:"{REMINDER_LIST_NAME}"}}
        set langlyList to list "{REMINDER_LIST_NAME}"
    end try
    set newReminder to make new reminder at langlyList with properties {{name:"{task_escaped}"}}
    if "{notes_escaped}" is not "" then
        set body of newReminder to "{notes_escaped}"
    end if
    return id of newReminder
end tell'''
        uid = _run_applescript(script)
        _invalidate_cache()
        return jsonify({"uid": uid, "task": task, "done": False})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reminders_bp.route("/api/reminders/<path:uid>", methods=["PUT"])
def update_reminder(uid):
    """Toggle done status or update a reminder."""
    body = request.get_json() or {}

    try:
        set_props = []
        if "done" in body:
            val = "true" if body["done"] else "false"
            set_props.append(f"set completed of r to {val}")
        if "task" in body:
            task_escaped = body["task"].replace('"', '\\"')
            set_props.append(f'set name of r to "{task_escaped}"')

        if not set_props:
            return jsonify({"error": "Nothing to update"}), 400

        props_script = "\n            ".join(set_props)
        script = f'''
tell application "Reminders"
    set langlyList to list "{REMINDER_LIST_NAME}"
    repeat with r in (every reminder of langlyList)
        if (id of r) is "{uid}" then
            {props_script}
            return "OK"
        end if
    end repeat
    return "NOT_FOUND"
end tell'''
        result = _run_applescript(script)
        if result == "NOT_FOUND":
            return jsonify({"error": "Reminder not found"}), 404
        _invalidate_cache()
        return jsonify({"uid": uid, "updated": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reminders_bp.route("/api/reminders/<path:uid>", methods=["DELETE"])
def delete_reminder(uid):
    """Delete a reminder."""
    try:
        script = f'''
tell application "Reminders"
    set langlyList to list "{REMINDER_LIST_NAME}"
    repeat with r in (every reminder of langlyList)
        if (id of r) is "{uid}" then
            delete r
            return "OK"
        end if
    end repeat
    return "NOT_FOUND"
end tell'''
        result = _run_applescript(script)
        if result == "NOT_FOUND":
            return jsonify({"error": "Reminder not found"}), 404
        _invalidate_cache()
        return jsonify({"uid": uid, "deleted": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
