"""Todo CRUD — backed by PostgreSQL, with fallback sync to agent's todos.json."""
from flask import Blueprint, request, jsonify
from backend.db import query, execute, execute_returning, log_activity

todos_bp = Blueprint("todos", __name__)


@todos_bp.route("/api/todos", methods=["GET"])
def list_todos():
    todos = query("SELECT id, task, done, created_at, updated_at FROM todos ORDER BY created_at DESC")
    return jsonify(todos)


@todos_bp.route("/api/todos", methods=["POST"])
def add_todo():
    data = request.get_json()
    task = data.get("task", "").strip()
    if not task:
        return jsonify({"error": "Task is required"}), 400

    todo = execute_returning(
        "INSERT INTO todos (task, done) VALUES (%s, %s) RETURNING id, task, done, created_at, updated_at",
        (task, False)
    )
    log_activity("todos", "created", f"Created todo: {task}")
    return jsonify(todo), 201


@todos_bp.route("/api/todos/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    data = request.get_json()
    existing = query("SELECT id FROM todos WHERE id = %s", (todo_id,))
    if not existing:
        return jsonify({"error": "Todo not found"}), 404

    updates = []
    params = []
    if "task" in data:
        updates.append("task = %s")
        params.append(data["task"])
    if "done" in data:
        updates.append("done = %s")
        params.append(data["done"])

    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    updates.append("updated_at = NOW()")
    params.append(todo_id)

    todo = execute_returning(
        f"UPDATE todos SET {', '.join(updates)} WHERE id = %s RETURNING id, task, done, created_at, updated_at",
        params
    )
    return jsonify(todo)


@todos_bp.route("/api/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    existing = query("SELECT task FROM todos WHERE id = %s", (todo_id,))
    if not existing:
        return jsonify({"error": "Todo not found"}), 404

    execute("DELETE FROM todos WHERE id = %s", (todo_id,))
    log_activity("todos", "deleted", f"Deleted todo: {existing[0]['task']}")
    return jsonify({"deleted": todo_id})
