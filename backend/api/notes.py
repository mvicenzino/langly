"""Notes CRUD — backed by PostgreSQL."""
from flask import Blueprint, request, jsonify
from backend.db import query, execute, execute_returning, log_activity

notes_bp = Blueprint("notes", __name__)


@notes_bp.route("/api/notes", methods=["GET"])
def list_notes():
    notes = query("SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC")
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
    log_activity("notes", "created", f"Created note: {title}")
    return jsonify(note), 201


@notes_bp.route("/api/notes/<int:note_id>", methods=["GET"])
def get_note(note_id):
    notes = query("SELECT id, title, content, created_at, updated_at FROM notes WHERE id = %s", (note_id,))
    if not notes:
        return jsonify({"error": "Note not found"}), 404
    return jsonify(notes[0])


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
    return jsonify(note)


@notes_bp.route("/api/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    existing = query("SELECT title FROM notes WHERE id = %s", (note_id,))
    if not existing:
        return jsonify({"error": "Note not found"}), 404

    execute("DELETE FROM notes WHERE id = %s", (note_id,))
    log_activity("notes", "deleted", f"Deleted note: {existing[0]['title']}")
    return jsonify({"deleted": note_id})
