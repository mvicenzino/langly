"""Notes CRUD — backed by PostgreSQL, with @contact mention support."""
from __future__ import annotations

import re
from flask import Blueprint, request, jsonify
from backend.db import query, execute, execute_returning, log_activity

notes_bp = Blueprint("notes", __name__)

# Match @FirstName LastName (two capitalized words) or @FirstName
_MENTION_RE = re.compile(r"@([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)")


def _sync_mentions(note_id, content):
    """Parse @Name mentions from content and sync note_mentions table."""
    # Extract all mentioned names
    mentioned_names = _MENTION_RE.findall(content or "")
    if not mentioned_names:
        execute("DELETE FROM note_mentions WHERE note_id = %s", (note_id,))
        return

    # Look up each name against contacts
    matched_contact_ids = set()
    for name in mentioned_names:
        rows = query(
            "SELECT id FROM contacts WHERE name ILIKE %s LIMIT 1",
            (name,)
        )
        if rows:
            matched_contact_ids.add(rows[0]["id"])

    # Replace all existing mentions for this note
    execute("DELETE FROM note_mentions WHERE note_id = %s", (note_id,))
    for cid in matched_contact_ids:
        execute(
            "INSERT INTO note_mentions (note_id, contact_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (note_id, cid)
        )


def _note_with_mentions(note):
    """Attach mention data to a note dict."""
    mentions = query(
        """SELECT c.id, c.name, c.company
           FROM note_mentions nm JOIN contacts c ON c.id = nm.contact_id
           WHERE nm.note_id = %s ORDER BY c.name""",
        (note["id"],)
    )
    note["mentions"] = mentions
    return note


@notes_bp.route("/api/notes", methods=["GET"])
def list_notes():
    notes = query("SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC")
    for n in notes:
        _note_with_mentions(n)
    return jsonify(notes)


@notes_bp.route("/api/notes", methods=["POST"])
def create_note():
    data = request.get_json()
    title = data.get("title", "").strip()
    content = data.get("content", "")
    if not title:
        return jsonify({"error": "Title is required"}), 400

    note = execute_returning(
        "INSERT INTO notes (title, content) VALUES (%s, %s) RETURNING id, title, content, created_at, updated_at",
        (title, content)
    )
    _sync_mentions(note["id"], content)
    _note_with_mentions(note)
    log_activity("notes", "created", f"Created note: {title}")
    return jsonify(note), 201


@notes_bp.route("/api/notes/<int:note_id>", methods=["GET"])
def get_note(note_id):
    notes = query("SELECT id, title, content, created_at, updated_at FROM notes WHERE id = %s", (note_id,))
    if not notes:
        return jsonify({"error": "Note not found"}), 404
    return jsonify(_note_with_mentions(notes[0]))


@notes_bp.route("/api/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    existing = query("SELECT id FROM notes WHERE id = %s", (note_id,))
    if not existing:
        return jsonify({"error": "Note not found"}), 404

    data = request.get_json()
    updates = []
    params = []

    if "title" in data:
        updates.append("title = %s")
        params.append(data["title"].strip())
    if "content" in data:
        updates.append("content = %s")
        params.append(data["content"])

    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    updates.append("updated_at = NOW()")
    params.append(note_id)

    note = execute_returning(
        f"UPDATE notes SET {', '.join(updates)} WHERE id = %s RETURNING id, title, content, created_at, updated_at",
        params
    )
    _sync_mentions(note_id, note["content"])
    _note_with_mentions(note)
    return jsonify(note)


@notes_bp.route("/api/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    existing = query("SELECT title FROM notes WHERE id = %s", (note_id,))
    if not existing:
        return jsonify({"error": "Note not found"}), 404

    execute("DELETE FROM notes WHERE id = %s", (note_id,))
    log_activity("notes", "deleted", f"Deleted note: {existing[0]['title']}")
    return jsonify({"deleted": note_id})
