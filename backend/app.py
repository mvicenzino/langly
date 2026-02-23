"""Flask application factory with CORS and SocketIO."""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO

import os
_async_mode = "gevent" if os.getenv("RAILWAY_ENVIRONMENT") else "threading"
socketio = SocketIO(cors_allowed_origins="*", async_mode=_async_mode)


def create_app():
    # No static file serving — frontend is on Vercel, backend is API-only
    app = Flask(__name__, static_folder=None)
    app.config["SECRET_KEY"] = "dev-secret-key"

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from backend.api.auth import auth_bp
    from backend.api.health import health_bp
    from backend.api.chat import chat_bp
    from backend.api.stocks import stocks_bp
    from backend.api.weather import weather_bp
    from backend.api.todos import todos_bp
    from backend.api.notes import notes_bp
    from backend.api.openclaw import openclaw_bp
    from backend.api.system import system_bp
    from backend.api.skills import skills_bp
    from backend.api.activity import activity_bp
    from backend.api.drive import drive_bp
    from backend.api.reminders import reminders_bp
    from backend.api.contacts import contacts_bp
    from backend.api.finance import finance_bp
    from backend.api.calendar import calendar_bp
    from backend.api.stride import stride_bp
    from backend.api.content_calendar import content_calendar_bp
    from backend.api.social import social_bp
    from backend.api.briefs import briefs_bp
    from backend.api.docs import docs_bp
    from backend.api.travel import travel_bp
    from backend.api.emails import emails_bp
    from backend.api.projects import projects_bp
    from backend.api.sync import sync_bp
    from backend.api.github import github_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(stocks_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(todos_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(openclaw_bp)
    app.register_blueprint(system_bp)
    app.register_blueprint(skills_bp)
    app.register_blueprint(activity_bp)
    app.register_blueprint(drive_bp)
    app.register_blueprint(reminders_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(calendar_bp)
    app.register_blueprint(stride_bp)
    app.register_blueprint(content_calendar_bp)
    app.register_blueprint(social_bp)
    app.register_blueprint(briefs_bp)
    app.register_blueprint(docs_bp)
    app.register_blueprint(travel_bp)
    app.register_blueprint(emails_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(sync_bp)
    app.register_blueprint(github_bp)

    # Register socket handlers
    from backend.sockets.chat_handler import register_handlers
    register_handlers(socketio)

    from backend.sockets.travel_handler import register_travel_handlers
    register_travel_handlers(socketio)

    # ── Auth middleware ──────────────────────────────────────────
    @app.before_request
    def require_auth():
        # Skip auth for non-API routes, login endpoint, health, and CORS preflight
        path = request.path
        if request.method == "OPTIONS":
            return None
        if path == "/" or path.startswith("/api/auth/"):
            return None
        if path == "/api/social/linkedin/callback":
            return None
        if not path.startswith("/api/"):
            return None
        # Skip auth for localhost requests (OpenClaw, CLI tools)
        if request.remote_addr in ("127.0.0.1", "::1"):
            return None

        from backend.api.auth import is_token_valid
        auth_header = request.headers.get("Authorization", "")
        token = auth_header[7:] if auth_header.startswith("Bearer ") else None
        if not is_token_valid(token):
            return jsonify({"error": "Unauthorized"}), 401

    @app.route("/")
    def index():
        return "Langly API is running.", 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    socketio.init_app(app)
    return app
