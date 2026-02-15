"""Content Calendar API — CRUD + generate endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.services.content_calendar_service import (
    generate_content_calendar,
    list_items,
    list_batches,
    update_item,
    delete_item,
    delete_batch,
    publish_item,
)

content_calendar_bp = Blueprint("content_calendar", __name__)


@content_calendar_bp.route("/api/content-calendar")
def get_items():
    """List content calendar items with optional filters."""
    batch_id = request.args.get("batch_id")
    week = request.args.get("week", type=int)
    platform = request.args.get("platform")
    status = request.args.get("status")
    items = list_items(batch_id=batch_id, week=week, platform=platform, status=status)
    return jsonify(items)


@content_calendar_bp.route("/api/content-calendar/generate", methods=["POST"])
def generate():
    """Generate a 4-week content calendar via LLM."""
    data = request.get_json(silent=True) or {}
    start_date = data.get("start_date")
    try:
        result = generate_content_calendar(start_date_str=start_date)
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@content_calendar_bp.route("/api/content-calendar/batches")
def get_batches():
    """List all past generation batches."""
    batches = list_batches()
    return jsonify(batches)


@content_calendar_bp.route("/api/content-calendar/<int:item_id>", methods=["PUT"])
def edit_item(item_id):
    """Update a content calendar item."""
    data = request.get_json(silent=True) or {}
    updated = update_item(item_id, data)
    if not updated:
        return jsonify({"error": "Not found or no valid fields"}), 404
    return jsonify(updated)


@content_calendar_bp.route("/api/content-calendar/<int:item_id>", methods=["DELETE"])
def remove_item(item_id):
    """Delete a single content calendar item."""
    ok = delete_item(item_id)
    if not ok:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True})


@content_calendar_bp.route("/api/content-calendar/<int:item_id>/publish", methods=["POST"])
def publish(item_id):
    """Publish a content calendar item to its platform."""
    try:
        result = publish_item(item_id)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@content_calendar_bp.route("/api/content-calendar/batch/<batch_id>", methods=["DELETE"])
def remove_batch(batch_id):
    """Delete an entire batch."""
    count = delete_batch(batch_id)
    return jsonify({"success": True, "deleted": count})
