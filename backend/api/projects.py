"""Project and sprint management API."""
from flask import Blueprint, request, jsonify
from datetime import datetime, date
from backend.db import query, execute, execute_returning

projects_bp = Blueprint('projects', __name__)


def ensure_tasks_table():
    """Create tasks table if it doesn't exist."""
    try:
        execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                project VARCHAR(50) DEFAULT 'calendora',
                title VARCHAR(255) NOT NULL,
                description TEXT DEFAULT '',
                status VARCHAR(20) DEFAULT 'todo',
                priority VARCHAR(20) DEFAULT 'normal',
                due_date DATE,
                assigned_to VARCHAR(100) DEFAULT 'Mike',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
    except Exception as e:
        print(f"Error creating tasks table: {e}")


def ensure_resources_table():
    """Create resources table if it doesn't exist."""
    try:
        execute("""
            CREATE TABLE IF NOT EXISTS resources (
                id SERIAL PRIMARY KEY,
                project VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                url VARCHAR(2048) NOT NULL,
                description TEXT DEFAULT '',
                resource_type VARCHAR(50) DEFAULT 'document',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
    except Exception as e:
        print(f"Error creating resources table: {e}")


# Ensure tables exist on startup
ensure_tasks_table()
ensure_resources_table()


@projects_bp.route('/api/projects/tasks', methods=['GET'])
def get_tasks():
    """Get tasks filtered by project, date, and status."""
    project = request.args.get('project', 'calendora')
    date_str = request.args.get('date')
    status_filter = request.args.get('status')
    
    sql = "SELECT * FROM tasks WHERE project = %s"
    params = [project]
    
    if date_str:
        sql += " AND due_date = %s"
        params.append(date_str)
    
    if status_filter:
        sql += " AND status = %s"
        params.append(status_filter)
    
    sql += " ORDER BY priority DESC, created_at ASC"
    
    try:
        tasks = query(sql, params)
        return jsonify(tasks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/tasks/today', methods=['GET'])
def get_today_tasks():
    """Get today's tasks for daily sprint view."""
    project = request.args.get('project', 'calendora')
    today = date.today().isoformat()
    
    try:
        # Get all tasks for today
        sql = "SELECT * FROM tasks WHERE project = %s AND due_date = %s ORDER BY status ASC, priority DESC"
        tasks = query(sql, [project, today])
        
        # Calculate summary
        summary = {
            'total': len(tasks),
            'todo': len([t for t in tasks if t['status'] == 'todo']),
            'in_progress': len([t for t in tasks if t['status'] == 'in_progress']),
            'done': len([t for t in tasks if t['status'] == 'done']),
        }
        
        return jsonify({
            'date': today,
            'tasks': tasks,
            'summary': summary
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/tasks', methods=['POST'])
def create_task():
    """Create a new task."""
    data = request.json
    
    try:
        sql = """
            INSERT INTO tasks (project, title, description, status, priority, due_date, assigned_to)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        
        params = [
            data.get('project', 'calendora'),
            data.get('title'),
            data.get('description', ''),
            data.get('status', 'todo'),
            data.get('priority', 'normal'),
            data.get('dueDate'),
            data.get('assignedTo', 'Mike'),
        ]
        
        result = execute_returning(sql, params)
        if result:
            return jsonify(result), 201
        return jsonify({'error': 'Failed to create task'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task."""
    data = request.json
    
    try:
        # Build dynamic UPDATE statement
        updates = []
        params = []
        
        if 'title' in data:
            updates.append('title = %s')
            params.append(data['title'])
        if 'description' in data:
            updates.append('description = %s')
            params.append(data['description'])
        if 'status' in data:
            updates.append('status = %s')
            params.append(data['status'])
        if 'priority' in data:
            updates.append('priority = %s')
            params.append(data['priority'])
        if 'dueDate' in data:
            updates.append('due_date = %s')
            params.append(data['dueDate'])
        if 'assignedTo' in data:
            updates.append('assigned_to = %s')
            params.append(data['assignedTo'])
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        updates.append('updated_at = NOW()')
        params.append(task_id)
        
        sql = f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s RETURNING *"
        result = query(sql, params)
        
        if result:
            return jsonify(result[0])
        return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task."""
    try:
        sql = "DELETE FROM tasks WHERE id = %s"
        execute(sql, [task_id])
        return jsonify({'status': 'deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/tasks/<int:task_id>/complete', methods=['PATCH'])
def complete_task(task_id):
    """Mark a task as done."""
    try:
        sql = "UPDATE tasks SET status = 'done', updated_at = NOW() WHERE id = %s RETURNING *"
        result = query(sql, [task_id])
        
        if result:
            return jsonify(result[0])
        return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/tasks/<int:task_id>/start', methods=['PATCH'])
def start_task(task_id):
    """Mark a task as in progress."""
    try:
        sql = "UPDATE tasks SET status = 'in_progress', updated_at = NOW() WHERE id = %s RETURNING *"
        result = query(sql, [task_id])
        
        if result:
            return jsonify(result[0])
        return jsonify({'error': 'Task not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/sprint/week', methods=['GET'])
def get_week_sprint():
    """Get sprint for the current week (Mon-Sun)."""
    project = request.args.get('project', 'calendora')
    today = date.today()
    
    # Calculate week start (Monday) and end (Sunday)
    start = today - __import__('datetime').timedelta(days=today.weekday())
    end = start + __import__('datetime').timedelta(days=6)
    
    try:
        sql = """
            SELECT * FROM tasks 
            WHERE project = %s AND due_date >= %s AND due_date <= %s 
            ORDER BY due_date ASC, status ASC
        """
        tasks = query(sql, [project, start.isoformat(), end.isoformat()])
        
        # Group by date
        by_date = {}
        for task in tasks:
            day = task['due_date'].isoformat() if task['due_date'] else 'unscheduled'
            if day not in by_date:
                by_date[day] = []
            by_date[day].append(task)
        
        summary = {
            'total': len(tasks),
            'todo': len([t for t in tasks if t['status'] == 'todo']),
            'in_progress': len([t for t in tasks if t['status'] == 'in_progress']),
            'done': len([t for t in tasks if t['status'] == 'done']),
        }
        
        return jsonify({
            'week': f"{start.isoformat()} to {end.isoformat()}",
            'tasks_by_date': by_date,
            'summary': summary
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# RESOURCES API
# ============================================================================

@projects_bp.route('/api/projects/<project>/resources', methods=['GET'])
def get_resources(project):
    """Get all resources for a project."""
    try:
        sql = "SELECT * FROM resources WHERE project = %s ORDER BY created_at DESC"
        resources = query(sql, [project])
        return jsonify(resources)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/<project>/resources', methods=['POST'])
def create_resource(project):
    """Create a new resource for a project."""
    data = request.json
    
    try:
        sql = """
            INSERT INTO resources (project, name, url, description, resource_type)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """
        
        params = [
            project,
            data.get('name'),
            data.get('url'),
            data.get('description', ''),
            data.get('type', 'document'),
        ]
        
        result = execute_returning(sql, params)
        if result:
            return jsonify(result), 201
        return jsonify({'error': 'Failed to create resource'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/<project>/resources/<int:resource_id>', methods=['PUT'])
def update_resource(project, resource_id):
    """Update a resource."""
    data = request.json
    
    try:
        # Build dynamic UPDATE statement
        updates = []
        params = []
        
        if 'name' in data:
            updates.append('name = %s')
            params.append(data['name'])
        if 'url' in data:
            updates.append('url = %s')
            params.append(data['url'])
        if 'description' in data:
            updates.append('description = %s')
            params.append(data['description'])
        if 'type' in data:
            updates.append('resource_type = %s')
            params.append(data['type'])
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        updates.append('updated_at = NOW()')
        params.extend([project, resource_id])
        
        sql = f"UPDATE resources SET {', '.join(updates)} WHERE project = %s AND id = %s RETURNING *"
        result = query(sql, params)
        
        if result:
            return jsonify(result[0])
        return jsonify({'error': 'Resource not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/<project>/resources/<int:resource_id>', methods=['DELETE'])
def delete_resource(project, resource_id):
    """Delete a resource."""
    try:
        sql = "DELETE FROM resources WHERE id = %s AND project = %s"
        execute(sql, [resource_id, project])
        return jsonify({'status': 'deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
