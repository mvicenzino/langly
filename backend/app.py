"""Flask application factory with CORS and SocketIO."""
from flask import Flask, jsonify
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

    @app.route("/")
    def index():
        return "Langly API is running.", 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    socketio.init_app(app)
    return app
