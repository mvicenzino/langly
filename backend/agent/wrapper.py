"""
Wraps the existing langchain_agent module.
In production (Railway), uses the bundled copy in backend/agent/.
Locally, imports from LANGCHAIN_AGENT_PATH.
"""
import sys
import os
from pathlib import Path

# Try bundled agent first, then external path
bundled = str(Path(__file__).parent)
if bundled not in sys.path:
    sys.path.insert(0, bundled)

# If LANGCHAIN_AGENT_PATH is set and exists, prefer it (local dev)
agent_path = os.getenv("LANGCHAIN_AGENT_PATH", "")
if agent_path and os.path.isdir(agent_path):
    if agent_path not in sys.path:
        sys.path.insert(0, agent_path)

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
