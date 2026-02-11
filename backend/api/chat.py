"""Chat REST API — session management and message persistence."""
from __future__ import annotations
import json
from flask import Blueprint, request, jsonify
from backend.db import query, execute, execute_returning

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    """Non-streaming chat fallback via REST."""
    from backend.agent.wrapper import run_query

    data = request.get_json()
    user_input = data.get("message", "")
    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    try:
        result = run_query(user_input)
        return jsonify({"response": result.get("output", "")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_bp.route("/api/chat/sessions", methods=["GET"])
def list_sessions():
    """List chat sessions, most recent first."""
    rows = query(
        "SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC LIMIT 50"
    )
    for r in rows:
        r["created_at"] = r["created_at"].isoformat() if r.get("created_at") else None
        r["updated_at"] = r["updated_at"].isoformat() if r.get("updated_at") else None
    return jsonify(rows)


@chat_bp.route("/api/chat/sessions", methods=["POST"])
def create_session():
    """Create a new chat session."""
    data = request.get_json() or {}
    title = data.get("title", "New Chat")
    row = execute_returning(
        "INSERT INTO chat_sessions (title) VALUES (%s) RETURNING id, title, created_at, updated_at",
        (title,)
    )
    if row:
        row["created_at"] = row["created_at"].isoformat() if row.get("created_at") else None
        row["updated_at"] = row["updated_at"].isoformat() if row.get("updated_at") else None
    return jsonify(row), 201


@chat_bp.route("/api/chat/sessions/<int:session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Delete a chat session and its messages."""
    execute("DELETE FROM chat_messages WHERE session_id = %s", (session_id,))
    execute("DELETE FROM chat_sessions WHERE id = %s", (session_id,))
    return jsonify({"ok": True})


@chat_bp.route("/api/chat/sessions/<int:session_id>/messages", methods=["GET"])
def get_messages(session_id):
    """Get all messages for a session."""
    rows = query(
        "SELECT id, role, content, tool_calls, thinking_steps, created_at "
        "FROM chat_messages WHERE session_id = %s ORDER BY created_at ASC",
        (session_id,)
    )
    for r in rows:
        r["created_at"] = r["created_at"].isoformat() if r.get("created_at") else None
    return jsonify(rows)


@chat_bp.route("/api/chat/sessions/<int:session_id>/messages", methods=["POST"])
def save_message(session_id):
    """Save a message to a session."""
    data = request.get_json()
    role = data.get("role", "user")
    content = data.get("content", "")
    tool_calls = json.dumps(data.get("toolCalls", []))
    thinking_steps = json.dumps(data.get("thinkingSteps", []))

    row = execute_returning(
        "INSERT INTO chat_messages (session_id, role, content, tool_calls, thinking_steps) "
        "VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at",
        (session_id, role, content, tool_calls, thinking_steps)
    )

    # Update session title from first user message
    if role == "user":
        session = query("SELECT title FROM chat_sessions WHERE id = %s", (session_id,))
        if session and session[0]["title"] == "New Chat":
            title = content[:60] + ("..." if len(content) > 60 else "")
            execute(
                "UPDATE chat_sessions SET title = %s, updated_at = NOW() WHERE id = %s",
                (title, session_id)
            )
        else:
            execute("UPDATE chat_sessions SET updated_at = NOW() WHERE id = %s", (session_id,))

    result = {"id": row["id"] if row else None}
    if row and row.get("created_at"):
        result["created_at"] = row["created_at"].isoformat()
    return jsonify(result), 201
