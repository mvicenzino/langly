"""Project and sprint management API."""
from flask import Blueprint, request, jsonify
from datetime import datetime, date
from backend.db import query, execute, execute_returning
import os
import json
import re

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


# ============================================================================
# HERMES/OBSIDIAN DASHBOARD API
# ============================================================================

def read_markdown_file(filepath):
    """Read and parse a markdown file."""
    try:
        if not os.path.exists(filepath):
            return None
        with open(filepath, 'r') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None


def extract_frontmatter(content):
    """Extract YAML frontmatter from markdown."""
    if not content or not content.startswith('---'):
        return {}, content
    
    try:
        parts = content.split('---', 2)
        if len(parts) < 3:
            return {}, content
        
        fm_text = parts[1]
        body = parts[2]
        
        # Simple YAML parser for our use case
        fm = {}
        for line in fm_text.strip().split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                fm[key] = value
        
        return fm, body
    except Exception as e:
        print(f"Error parsing frontmatter: {e}")
        return {}, content


def parse_projects_dashboard():
    """Parse Obsidian projects and return structured data."""
    obsidian_path = os.path.expanduser('~/Documents/Obsidian-Hermes/Hermes/entities/Active-Projects')
    
    if not os.path.exists(obsidian_path):
        return {
            'error': 'Obsidian vault not found',
            'path': obsidian_path
        }
    
    projects = {}
    critical_items = []
    revenue_total = 0
    
    # Read all .md files in Active-Projects
    for filename in os.listdir(obsidian_path):
        if not filename.endswith('.md'):
            continue
        
        filepath = os.path.join(obsidian_path, filename)
        content = read_markdown_file(filepath)
        if not content:
            continue
        
        fm, body = extract_frontmatter(content)
        
        # Skip dashboard and meta files
        if filename in ['DASHBOARD.md']:
            continue
        
        # Extract project name (remove .md)
        project_name = filename.replace('.md', '')
        
        # Extract blockers from content (look for 🔴 markers and checklists)
        blockers = []
        lines = body.split('\n')
        for i, line in enumerate(lines):
            if '🔴' in line or '[ ]' in line:
                # Clean up the line
                clean_line = line.replace('- [ ]', '').replace('- [x]', '').strip()
                if clean_line and len(clean_line) > 3:
                    blockers.append(clean_line)
        
        # Extract deadline if present
        deadline = fm.get('deadline') or fm.get('due')
        
        # Determine status color
        status = fm.get('status', 'unknown')
        status_color = {
            'Live': '🟢',
            'Active': '🔵',
            'Planning': '🔵',
            'Under Review': '🔵',
            'In Progress': '🔵',
            'Completed': '✅'
        }.get(status, '⚪')
        
        # Extract revenue if mentioned
        revenue = fm.get('revenue', '')
        
        projects[project_name] = {
            'name': project_name,
            'status': status,
            'status_color': status_color,
            'type': fm.get('type', 'project'),
            'deadline': deadline,
            'blockers': blockers[:3],  # Top 3 blockers
            'revenue': revenue,
            'canonical_path': fm.get('canonical') or f'~/Documents/Active/{project_name}/',
            'file': filename
        }
        
        # Track critical items
        if '🔴' in body or 'URGENT' in body:
            if deadline:
                critical_items.append({
                    'project': project_name,
                    'deadline': deadline,
                    'blockers': blockers[:2]
                })
    
    # Sort critical items by deadline
    critical_items.sort(key=lambda x: x['deadline'] or '9999-12-31')
    
    return {
        'projects': projects,
        'critical_items': critical_items[:3],  # Top 3 critical
        'total_projects': len(projects),
        'last_updated': datetime.now().isoformat()
    }


@projects_bp.route('/api/projects/dashboard/hermes', methods=['GET'])
def get_hermes_dashboard():
    """Get Hermes/Obsidian projects dashboard (visual summary)."""
    try:
        dashboard = parse_projects_dashboard()
        return jsonify(dashboard)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/dashboard/hermes/<project_name>', methods=['GET'])
def get_hermes_project(project_name):
    """Get detailed view of a specific Hermes project."""
    try:
        obsidian_path = os.path.expanduser(f'~/Documents/Obsidian-Hermes/Hermes/entities/Active-Projects/{project_name}.md')
        
        content = read_markdown_file(obsidian_path)
        if not content:
            return jsonify({'error': 'Project not found'}), 404
        
        fm, body = extract_frontmatter(content)
        
        return jsonify({
            'name': project_name,
            'frontmatter': fm,
            'body': body,
            'file_path': obsidian_path
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
