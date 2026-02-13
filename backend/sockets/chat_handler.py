"""WebSocket handler for streaming chat with the LangChain agent."""
import queue
import time
import threading
from flask import request as flask_request
from flask_socketio import SocketIO, emit
from backend.agent.callbacks import StreamingCallbackHandler
from backend.router import classify, execute_fast


def register_handlers(socketio: SocketIO):

    @socketio.on("connect")
    def handle_connect():
        from backend.api.auth import is_token_valid
        token = flask_request.args.get("token")
        if not is_token_valid(token):
            print("[SOCKET] Client rejected — invalid token", flush=True)
            return False  # reject connection
        print("[SOCKET] Client connected", flush=True)

    @socketio.on("chat:send")
    def handle_chat(data):
        print(f"[SOCKET] chat:send received: {str(data)[:100]}", flush=True)
        user_message = data.get("message", "")
        if not user_message:
            emit("chat:error", {"error": "No message provided"})
            return

        # ── Fast path: check if we can skip the agent ────────────────
        route_info = classify(user_message)
        print(f"[SOCKET] classify result: {route_info}", flush=True)
        if route_info:
            try:
                result = execute_fast(route_info)
                print(f"[SOCKET] fast-path result: sections in response = {result['response'].count('###')}, len = {len(result['response'])}", flush=True)
                tool_calls = []
                if result.get("tool"):
                    tool_calls = [{"tool": result["tool"], "input": user_message, "output": result["response"]}]
                    emit("chat:tool_start", {"tool": result["tool"], "input": user_message})
                    emit("chat:tool_result", {"output": result["response"]})

                emit("chat:done", {
                    "response": result["response"],
                    "toolCalls": tool_calls,
                    "fastPath": True,
                })

                # Log activity
                try:
                    from backend.db import log_activity
                    log_activity(
                        "chat", "fast_query",
                        f"Q: {user_message[:80]}",
                        {"route": route_info["route"], "label": route_info["label"], "response_len": len(result["response"])}
                    )
                except Exception:
                    pass
                return
            except Exception as e:
                print(f"[SOCKET] fast-path ERROR: {e}", flush=True)
                import traceback; traceback.print_exc()
                # If fast path fails, fall through to full agent
                pass

        # ── Full agent path ──────────────────────────────────────────
        print("[SOCKET] Entering full agent path", flush=True)
        from backend.agent.wrapper import get_executor

        callback = StreamingCallbackHandler()
        try:
            executor = get_executor()
            print(f"[SOCKET] Got executor: {type(executor).__name__}", flush=True)
        except Exception as e:
            print(f"[SOCKET] ERROR getting executor: {e}", flush=True)
            emit("chat:error", {"error": f"Agent initialization failed: {e}"})
            return
        executor.handle_parsing_errors = True

        def run_agent():
            try:
                print("[SOCKET] Agent thread starting invoke...", flush=True)
                result = executor.invoke(
                    {"input": user_message},
                    config={"callbacks": [callback]}
                )
                print(f"[SOCKET] Agent invoke returned: {str(result)[:200]}", flush=True)
                if not callback.is_done:
                    output = result.get("output", "") if isinstance(result, dict) else str(result)
                    callback.queue.put({
                        "event": "done",
                        "data": {"output": output}
                    })
                    callback._done = True
            except Exception as e:
                print(f"[SOCKET] Agent thread ERROR: {e}", flush=True)
                callback.queue.put({
                    "event": "error",
                    "data": str(e)
                })
                callback._done = True

        thread = threading.Thread(target=run_agent, daemon=True)
        thread.start()

        tool_calls = []
        timeout_at = time.time() + 120
        while time.time() < timeout_at:
            try:
                item = callback.queue.get(timeout=0.2)
            except queue.Empty:
                if callback.is_done:
                    break
                continue

            event_type = item["event"]
            event_data = item["data"]

            if event_type == "thinking":
                emit("chat:thinking", {"text": event_data})
            elif event_type == "tool_start":
                tool_calls.append(event_data)
                emit("chat:tool_start", event_data)
            elif event_type == "tool_result":
                emit("chat:tool_result", event_data)
            elif event_type == "done":
                response_text = event_data.get("output", "")
                emit("chat:done", {
                    "response": response_text,
                    "toolCalls": tool_calls,
                })
                try:
                    from backend.db import log_activity
                    tools_used = [tc.get("tool", "") for tc in tool_calls]
                    log_activity(
                        "chat", "query",
                        f"Q: {user_message[:80]}",
                        {"tools": tools_used, "response_len": len(response_text)}
                    )
                except Exception:
                    pass
                break
            elif event_type == "error":
                emit("chat:error", {"error": event_data})
                break
        else:
            emit("chat:error", {"error": "Agent timed out after 120 seconds"})
