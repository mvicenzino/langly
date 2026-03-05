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


def run_query(user_input: str, session_id: str = '') -> dict:
    """Run a query through the agent and return the result dict."""
    from langchain.callbacks.base import BaseCallbackHandler

    class TokenLogger(BaseCallbackHandler):
        def __init__(self):
            self.prompt_tokens = 0
            self.completion_tokens = 0

        def on_llm_end(self, response, **kwargs):
            try:
                usage = response.llm_output.get('token_usage', {}) if response.llm_output else {}
                self.prompt_tokens += usage.get('prompt_tokens', 0)
                self.completion_tokens += usage.get('completion_tokens', 0)
            except Exception:
                pass

    token_logger = TokenLogger()
    result = _executor.invoke({"input": user_input}, config={"callbacks": [token_logger]})

    # Log to DB asynchronously
    try:
        import threading
        import requests as _req

        def _log():
            try:
                _req.post('http://localhost:5001/api/token-usage/log', json={
                    'source': 'langly',
                    'model': 'gpt-4o-mini',
                    'prompt_tokens': token_logger.prompt_tokens,
                    'completion_tokens': token_logger.completion_tokens,
                    'session_id': session_id,
                    'context': user_input[:120],
                }, timeout=3)
            except Exception:
                pass

        threading.Thread(target=_log, daemon=True).start()
    except Exception:
        pass

    return result
