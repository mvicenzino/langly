"""Apple Reminders integration via CalDAV (iCloud)."""
from __future__ import annotations

import os
import uuid
from flask import Blueprint, jsonify, request

reminders_bp = Blueprint("reminders", __name__)

APPLE_ID = os.getenv("APPLE_ID", "")
APPLE_APP_PASSWORD = os.getenv("APPLE_APP_PASSWORD", "")
REMINDER_LIST_NAME = os.getenv("APPLE_REMINDER_LIST", "Langly")

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not APPLE_ID or not APPLE_APP_PASSWORD:
        return None
    try:
        import caldav
        _client = caldav.DAVClient(
            url="https://caldav.icloud.com",
            username=APPLE_ID,
            password=APPLE_APP_PASSWORD,
        )
        return _client
    except Exception:
        return None


def _get_list():
    """Find the Langly reminder list."""
    client = _get_client()
    if not client:
        return None
    try:
        import caldav
        principal = client.principal()
        for cal in principal.calendars():
            props = cal.get_properties([caldav.dav.DisplayName()])
            name = props.get("{DAV:}displayname", "")
            if name == REMINDER_LIST_NAME:
                return cal
        # Create it if it doesn't exist
        return principal.make_calendar(
            name=REMINDER_LIST_NAME,
            supported_calendar_component_set=["VTODO"],
        )
    except Exception:
        return None


def _parse_todo(obj) -> dict | None:
    """Parse a CalDAV object into a reminder dict."""
    try:
        obj.load()
        raw = obj.data
        if not raw or "VTODO" not in raw:
            return None
        import vobject
        cal_obj = vobject.readOne(raw)
        vtodo = cal_obj.vtodo
        summary = str(vtodo.summary.value) if hasattr(vtodo, "summary") else ""
        status = str(vtodo.status.value) if hasattr(vtodo, "status") else "NEEDS-ACTION"
        uid = str(vtodo.uid.value) if hasattr(vtodo, "uid") else ""
        due = str(vtodo.due.value) if hasattr(vtodo, "due") else ""
        priority = int(vtodo.priority.value) if hasattr(vtodo, "priority") else 0
        notes = str(vtodo.description.value) if hasattr(vtodo, "description") else ""
        return {
            "uid": uid,
            "task": summary,
            "done": status == "COMPLETED",
            "due": due,
            "priority": priority,
            "notes": notes,
            "url": str(obj.url),
        }
    except Exception:
        return None


@reminders_bp.route("/api/reminders")
def list_reminders():
    """List all reminders from Apple Reminders."""
    cal = _get_list()
    if not cal:
        return jsonify({"configured": False, "items": []})
    try:
        items = []
        for obj in cal.objects():
            parsed = _parse_todo(obj)
            if parsed:
                items.append(parsed)
        # Sort: incomplete first, then by priority (higher first)
        items.sort(key=lambda x: (x["done"], -x["priority"]))
        return jsonify({"configured": True, "items": items})
    except Exception as e:
        return jsonify({"configured": True, "items": [], "error": str(e)}), 500


@reminders_bp.route("/api/reminders", methods=["POST"])
def add_reminder():
    """Add a new reminder."""
    cal = _get_list()
    if not cal:
        return jsonify({"error": "Apple Reminders not configured"}), 503
    body = request.get_json() or {}
    task = body.get("task", "").strip()
    if not task:
        return jsonify({"error": "task is required"}), 400

    due = body.get("due", "")
    priority = body.get("priority", 0)
    notes = body.get("notes", "")
    uid = str(uuid.uuid4())

    vcal = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VTODO\r\n"
    vcal += f"UID:{uid}\r\n"
    vcal += f"SUMMARY:{task}\r\n"
    vcal += "STATUS:NEEDS-ACTION\r\n"
    if due:
        vcal += f"DUE:{due}\r\n"
    if priority:
        vcal += f"PRIORITY:{priority}\r\n"
    if notes:
        vcal += f"DESCRIPTION:{notes}\r\n"
    vcal += "END:VTODO\r\nEND:VCALENDAR"

    try:
        cal.save_event(vcal)
        return jsonify({"uid": uid, "task": task, "done": False})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reminders_bp.route("/api/reminders/<uid>", methods=["PUT"])
def update_reminder(uid):
    """Toggle done status or update a reminder."""
    cal = _get_list()
    if not cal:
        return jsonify({"error": "Apple Reminders not configured"}), 503

    body = request.get_json() or {}

    try:
        for obj in cal.objects():
            obj.load()
            raw = obj.data
            if not raw or uid not in raw:
                continue
            import vobject
            cal_obj = vobject.readOne(raw)
            vtodo = cal_obj.vtodo

            if "done" in body:
                vtodo.status.value = "COMPLETED" if body["done"] else "NEEDS-ACTION"
            if "task" in body:
                vtodo.summary.value = body["task"]

            obj.data = cal_obj.serialize()
            obj.save()
            return jsonify({"uid": uid, "updated": True})

        return jsonify({"error": "Reminder not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reminders_bp.route("/api/reminders/<uid>", methods=["DELETE"])
def delete_reminder(uid):
    """Delete a reminder."""
    cal = _get_list()
    if not cal:
        return jsonify({"error": "Apple Reminders not configured"}), 503

    try:
        for obj in cal.objects():
            obj.load()
            raw = obj.data
            if not raw or uid not in raw:
                continue
            obj.delete()
            return jsonify({"uid": uid, "deleted": True})

        return jsonify({"error": "Reminder not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
