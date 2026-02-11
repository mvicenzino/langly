"""
Wraps the existing langchain_agent module.
Adds its directory to sys.path so we can import it directly.
"""
import sys
from backend.config import LANGCHAIN_AGENT_PATH

# Make langchain_agent importable
if LANGCHAIN_AGENT_PATH not in sys.path:
    sys.path.insert(0, LANGCHAIN_AGENT_PATH)

import langchain_agent  # noqa: E402

_executor = langchain_agent.executor
_tools = langchain_agent.tools


def get_executor():
    return _executor


def get_tools():
    return _tools


def get_tool_map():
    return {t.name: t for t in _tools}


def run_query(user_input: str) -> dict:
    """Run a query through the agent and return the result dict."""
    return _executor.invoke({"input": user_input})
