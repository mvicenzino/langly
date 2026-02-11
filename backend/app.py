"""Flask application factory with CORS and SocketIO."""
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")


def create_app():
    app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
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

    # Register socket handlers
    from backend.sockets.chat_handler import register_handlers
    register_handlers(socketio)

    # Serve frontend in production
    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    @app.errorhandler(404)
    def not_found(e):
        # SPA fallback — serve index.html for client-side routing
        return app.send_static_file("index.html")

    socketio.init_app(app)
    return app
