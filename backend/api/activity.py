"""Activity log endpoint — shows recent events across all Langly subsystems."""
from flask import Blueprint, request, jsonify
from backend.db import query

activity_bp = Blueprint("activity", __name__)


@activity_bp.route("/api/activity")
def get_activity():
    """Get recent activity log entries."""
    limit = request.args.get("limit", "30", type=str)
    source_filter = request.args.get("source", "", type=str)

    if source_filter:
        entries = query(
            "SELECT id, source, event_type, summary, metadata, created_at "
            "FROM activity_log WHERE source = %s ORDER BY created_at DESC LIMIT %s",
            (source_filter, int(limit))
        )
    else:
        entries = query(
            "SELECT id, source, event_type, summary, metadata, created_at "
            "FROM activity_log ORDER BY created_at DESC LIMIT %s",
            (int(limit),)
        )

    for e in entries:
        e["created_at"] = e["created_at"].isoformat() if e.get("created_at") else None

    return jsonify(entries)
