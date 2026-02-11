"""Contacts CRUD + search — backed by PostgreSQL."""
from __future__ import annotations

from flask import Blueprint, request, jsonify
from backend.db import query, execute, execute_returning, log_activity

contacts_bp = Blueprint("contacts", __name__)


@contacts_bp.route("/api/contacts", methods=["GET"])
def list_contacts():
    try:
        rows = query("""
            SELECT c.id, c.name, c.company, c.email, c.phone, c.notes,
                   c.created_at, c.updated_at,
                   COALESCE(m.mention_count, 0) AS mention_count
            FROM contacts c
            LEFT JOIN (
                SELECT contact_id, COUNT(*) AS mention_count
                FROM note_mentions
                GROUP BY contact_id
            ) m ON m.contact_id = c.id
            ORDER BY c.name ASC
        """)
        return jsonify(rows)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "items": []}), 500


@contacts_bp.route("/api/contacts/search", methods=["GET"])
def search_contacts():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    rows = query(
        """SELECT id, name, company FROM contacts
           WHERE name ILIKE %s ORDER BY name ASC LIMIT 10""",
        (f"%{q}%",)
    )
    return jsonify(rows)


@contacts_bp.route("/api/contacts", methods=["POST"])
def create_contact():
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    contact = execute_returning(
        """INSERT INTO contacts (name, company, email, phone, notes)
           VALUES (%s, %s, %s, %s, %s)
           RETURNING id, name, company, email, phone, notes, created_at, updated_at""",
        (
            name,
            data.get("company", ""),
            data.get("email", ""),
            data.get("phone", ""),
            data.get("notes", ""),
        )
    )
    log_activity("contacts", "created", f"Added contact: {name}")
    return jsonify(contact), 201


@contacts_bp.route("/api/contacts/<int:contact_id>", methods=["GET"])
def get_contact(contact_id):
    rows = query(
        """SELECT id, name, company, email, phone, notes, created_at, updated_at
           FROM contacts WHERE id = %s""",
        (contact_id,)
    )
    if not rows:
        return jsonify({"error": "Contact not found"}), 404
    contact = rows[0]
    # Include notes that mention this contact
    contact["mentioned_in"] = query(
        """SELECT n.id, n.title, n.content, nm.created_at AS mentioned_at
           FROM note_mentions nm
           JOIN notes n ON n.id = nm.note_id
           WHERE nm.contact_id = %s
           ORDER BY nm.created_at DESC""",
        (contact_id,)
    )
    return jsonify(contact)


@contacts_bp.route("/api/contacts/<int:contact_id>", methods=["PUT"])
def update_contact(contact_id):
    existing = query("SELECT id FROM contacts WHERE id = %s", (contact_id,))
    if not existing:
        return jsonify({"error": "Contact not found"}), 404

    data = request.get_json()
    updates = []
    params = []

    for field in ("name", "company", "email", "phone", "notes"):
        if field in data:
            updates.append(f"{field} = %s")
            val = data[field].strip() if isinstance(data[field], str) else data[field]
            params.append(val)

    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    updates.append("updated_at = NOW()")
    params.append(contact_id)

    contact = execute_returning(
        f"""UPDATE contacts SET {', '.join(updates)} WHERE id = %s
            RETURNING id, name, company, email, phone, notes, created_at, updated_at""",
        params
    )
    return jsonify(contact)


@contacts_bp.route("/api/contacts/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    existing = query("SELECT name FROM contacts WHERE id = %s", (contact_id,))
    if not existing:
        return jsonify({"error": "Contact not found"}), 404

    execute("DELETE FROM contacts WHERE id = %s", (contact_id,))
    log_activity("contacts", "deleted", f"Deleted contact: {existing[0]['name']}")
    return jsonify({"deleted": contact_id})
