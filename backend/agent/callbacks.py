"""
Streaming callback handler that pushes agent events to a Queue.
The SocketIO handler drains this queue and emits events to the client.
"""
import queue
from typing import Any
from langchain_core.callbacks import BaseCallbackHandler


class StreamingCallbackHandler(BaseCallbackHandler):
    """Pushes agent lifecycle events into a thread-safe queue."""

    def __init__(self):
        self.queue: queue.Queue = queue.Queue()
        self._done = False

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        self.queue.put({"event": "token", "data": token})

    def on_agent_action(self, action, **kwargs: Any) -> None:
        self.queue.put({
            "event": "tool_start",
            "data": {
                "tool": action.tool,
                "input": str(action.tool_input),
            }
        })

    def on_tool_end(self, output: str, **kwargs: Any) -> None:
        self.queue.put({
            "event": "tool_result",
            "data": {"output": output[:2000]}  # Truncate large outputs
        })

    def on_chain_end(self, outputs: dict, **kwargs: Any) -> None:
        # Only emit thinking for intermediate chain steps
        if "output" not in outputs:
            text = str(outputs)
            if len(text) > 10:
                self.queue.put({
                    "event": "thinking",
                    "data": text[:1000]
                })

    def on_agent_finish(self, finish, **kwargs: Any) -> None:
        self.queue.put({
            "event": "done",
            "data": {"output": finish.return_values.get("output", "")}
        })
        self._done = True

    def on_llm_error(self, error: BaseException, **kwargs: Any) -> None:
        self.queue.put({
            "event": "error",
            "data": str(error)
        })
        self._done = True

    def on_chain_error(self, error: BaseException, **kwargs: Any) -> None:
        self.queue.put({
            "event": "error",
            "data": str(error)
        })
        self._done = True

    @property
    def is_done(self):
        return self._done
