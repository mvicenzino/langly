"""Flask application factory with CORS and SocketIO."""
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

import os
_async_mode = "gevent" if os.getenv("RAILWAY_ENVIRONMENT") else "threading"
socketio = SocketIO(cors_allowed_origins="*", async_mode=_async_mode)


def create_app():
    # On Railway, no frontend/dist exists — disable static file serving to
    # prevent Flask's catch-all /<path:filename> from hijacking API routes
    _dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
    if os.path.isdir(_dist):
        app = Flask(__name__, static_folder=_dist, static_url_path="/static-assets")
    else:
        app = Flask(__name__, static_folder=None)
    app.config["SECRET_KEY"] = "dev-secret-key"

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
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

    # Register socket handlers
    from backend.sockets.chat_handler import register_handlers
    register_handlers(socketio)

    # Serve frontend in production (only when dist exists)
    @app.route("/")
    def index():
        try:
            return app.send_static_file("index.html")
        except Exception:
            return "Langly API is running. Frontend is served separately.", 200

    @app.errorhandler(404)
    def not_found(e):
        # For API routes, return JSON 404
        from flask import request as req
        if req.path.startswith("/api/"):
            return {"error": "Not found"}, 404
        # SPA fallback — serve index.html for client-side routing
        try:
            return app.send_static_file("index.html")
        except Exception:
            return {"error": "Not found"}, 404

    socketio.init_app(app)
    return app
