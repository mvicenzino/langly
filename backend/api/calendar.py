"""Family calendar endpoints — Kindora Calendar integration."""
from __future__ import annotations

from flask import Blueprint, request, jsonify
import requests

calendar_bp = Blueprint("calendar", __name__)


def _get_service():
    """Lazy import to avoid startup failure if creds aren't set."""
    from backend.services.kindora_service import (
        get_events, get_today, get_upcoming,
        create_event, update_event, delete_event,
        get_family_members, get_medications, get_care_documents,
    )
    return (get_events, get_today, get_upcoming,
            create_event, update_event, delete_event,
            get_family_members, get_medications, get_care_documents)


@calendar_bp.route("/api/calendar/events")
def events():
    try:
        get_events, *_ = _get_service()
        start = request.args.get("start")
        end = request.args.get("end")
        data = get_events(start_date=start, end_date=end)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/today")
def today():
    try:
        _, get_today, *_ = _get_service()
        data = get_today()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/upcoming")
def upcoming():
    try:
        _, _, get_upcoming, *_ = _get_service()
        days = request.args.get("days", 7, type=int)
        data = get_upcoming(days=days)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/events", methods=["POST"])
def create():
    try:
        *_, create_event, _, _, _, _, _ = _get_service()
        body = request.get_json()
        data = create_event(
            title=body.get("title", ""),
            start_time=body.get("startTime", ""),
            end_time=body.get("endTime", ""),
            description=body.get("description", ""),
            member_ids=body.get("memberIds", []),
            color=body.get("color", "#3B82F6"),
        )
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/events/<event_id>", methods=["PUT"])
def update(event_id):
    try:
        *_, _, update_event, _, _, _, _ = _get_service()
        body = request.get_json()
        data = update_event(event_id, **body)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/events/<event_id>", methods=["DELETE"])
def delete(event_id):
    try:
        *_, _, _, delete_event, _, _, _ = _get_service()
        data = delete_event(event_id)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/members")
def members():
    try:
        *_, get_family_members, _, _ = _get_service()
        data = get_family_members()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/medications")
def medications():
    try:
        *_, get_medications, _ = _get_service()
        data = get_medications()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/documents")
def documents():
    try:
        *_, get_care_documents = _get_service()
        data = get_care_documents()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@calendar_bp.route("/api/calendar/calendora/events")
def calendora_events():
    """Fetch events from Calendora API (backend proxy to avoid CORS issues)."""
    try:
        family_id = request.args.get("familyId", "3eb14ef0-440c-4429-979a-29eceab7f32e")
        api_key = "46032e9f5ed673c792551b3363c44a7e2eb690120fd7a8761e5a1e9217e4eef5"
        
        response = requests.get(
            f"https://calendora.replit.app/api/events?familyId={family_id}",
            headers={"X-API-Key": api_key},
            timeout=10
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch from Calendora: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
