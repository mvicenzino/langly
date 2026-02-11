import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / ".env")

LANGCHAIN_AGENT_PATH = os.getenv(
    "LANGCHAIN_AGENT_PATH",
    str(Path.home() / "langchain-agent")
)
TODOS_PATH = os.path.join(LANGCHAIN_AGENT_PATH, "todos.json")
NOTES_DIR = os.path.join(LANGCHAIN_AGENT_PATH, "notes")

FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
