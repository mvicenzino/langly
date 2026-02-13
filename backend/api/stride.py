"""Job pipeline endpoints — Stride Job Tracker integration."""
from __future__ import annotations

from flask import Blueprint, request, jsonify

stride_bp = Blueprint("stride", __name__)


def _get_service():
    """Lazy import to avoid startup failure if creds aren't set."""
    from backend.services.stride_service import (
        get_pipeline, get_applications, get_application,
        get_dashboard_stats, get_upcoming_events, create_job,
    )
    return (get_pipeline, get_applications, get_application,
            get_dashboard_stats, get_upcoming_events, create_job)


def _get_contacts_service():
    """Lazy import for contact functions."""
    from backend.services.stride_service import (
        get_contacts, get_contact, search_contacts, create_contact,
    )
    return get_contacts, get_contact, search_contacts, create_contact


@stride_bp.route("/api/stride/pipeline")
def pipeline():
    try:
        get_pipeline, *_ = _get_service()
        data = get_pipeline()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stride_bp.route("/api/stride/applications")
def applications():
    try:
        _, get_applications, *_ = _get_service()
        status = request.args.get("status")
        limit = request.args.get("limit", 20, type=int)
        data = get_applications(status=status, limit=limit)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stride_bp.route("/api/stride/applications/<int:app_id>")
def application_detail(app_id):
    try:
        _, _, get_application, *_ = _get_service()
        data = get_application(app_id)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stride_bp.route("/api/stride/stats")
def stats():
    try:
        _, _, _, get_dashboard_stats, *_ = _get_service()
        data = get_dashboard_stats()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stride_bp.route("/api/stride/events")
def events():
    try:
        _, _, _, _, get_upcoming_events, _ = _get_service()
        data = get_upcoming_events()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stride_bp.route("/api/stride/jobs", methods=["POST"])
def create():
    try:
        *_, create_job = _get_service()
        body = request.get_json()
        data = create_job(
            title=body.get("title", ""),
            company_name=body.get("companyName", ""),
            location=body.get("location", ""),
            remote_type=body.get("remoteType", ""),
            job_url=body.get("jobUrl", ""),
            source=body.get("source", "Langly"),
            create_lead=body.get("createLead", True),
        )
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Contacts ──────────────────────────────────────────────────────────────────

@stride_bp.route("/api/stride/contacts")
def contacts_list():
    try:
        get_contacts, *_ = _get_contacts_service()
        limit = request.args.get("limit", 100, type=int)
        data = get_contacts(limit=limit)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stride_bp.route("/api/stride/contacts/search")
def contacts_search():
    try:
        _, _, search_contacts, _ = _get_contacts_service()
        q = request.args.get("q", "")
        data = search_contacts(q)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stride_bp.route("/api/stride/contacts/<int:contact_id>")
def contacts_detail(contact_id):
    try:
        _, get_contact, *_ = _get_contacts_service()
        data = get_contact(contact_id)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stride_bp.route("/api/stride/contacts", methods=["POST"])
def contacts_create():
    try:
        _, _, _, create_contact = _get_contacts_service()
        body = request.get_json()
        data = create_contact(
            name=body.get("name", ""),
            company=body.get("company", ""),
            title=body.get("title", ""),
            contact_type=body.get("contactType", "networking"),
            email=body.get("email", ""),
            phone=body.get("phone", ""),
            linkedin_url=body.get("linkedinUrl", ""),
            notes=body.get("notes", ""),
        )
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
