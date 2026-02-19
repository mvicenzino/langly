"""Socket handler for streaming AI travel insights."""
import queue
import time
import threading
from flask_socketio import SocketIO, emit
from backend.agent.callbacks import StreamingCallbackHandler
from backend.profile import FAMILY_PROFILE


def build_travel_prompt(data: dict) -> str:
    """Build a comprehensive travel insight prompt from trip context + search results."""
    destination = data.get("destination", "Unknown")
    start_date = data.get("startDate", "?")
    end_date = data.get("endDate", "?")
    passengers = data.get("passengers", 3)
    origin = data.get("originAirport", "EWR")
    dest_airport = data.get("destinationAirport", "?")
    flights = data.get("flights", [])
    hotels = data.get("hotels", [])

    # Calculate nights
    nights = "?"
    try:
        from datetime import datetime
        d1 = datetime.strptime(start_date, "%Y-%m-%d")
        d2 = datetime.strptime(end_date, "%Y-%m-%d")
        nights = str((d2 - d1).days)
    except Exception:
        pass

    # Build flight summary
    flight_section = ""
    if flights:
        flight_section = f"\n**Available Flights ({len(flights)} options):**\n"
        for i, f in enumerate(flights[:10], 1):
            stops = "nonstop" if f.get("stops", 0) == 0 else f"{f['stops']} stop(s)"
            flight_section += (
                f"{i}. {f.get('airlineName', '?')} — ${f.get('price', 0):.0f}/pp "
                f"(${f.get('totalPrice', 0):.0f} total) | {stops} | {f.get('duration', '?')}\n"
            )

    # Build hotel summary
    hotel_section = ""
    if hotels:
        hotel_section = f"\n**Available Hotels ({len(hotels)} options):**\n"
        for i, h in enumerate(hotels[:10], 1):
            stars = f" {h.get('stars')}★" if h.get("stars") else ""
            rating = f" Rating: {h.get('rating')}/10" if h.get("rating") else ""
            reviews = f" ({h.get('reviews')} reviews)" if h.get("reviews") else ""
            amenities = ", ".join((h.get("amenities") or [])[:4])
            hotel_section += (
                f"{i}. {h.get('name', '?')}{stars} — ${h.get('price', 0):.0f}/night "
                f"(${h.get('totalPrice', 0):.0f} total) |{rating}{reviews}"
                f"{f' | {amenities}' if amenities else ''}\n"
            )

    prompt = f"""You are a family travel planning advisor. Use the Search and Weather tools
to look up real-time information about the destination when helpful.

**Family Context:** Traveling family of {passengers}:
- Michael (father), Carolyn (pregnant wife), Sebastian "Sebby" (4 years old), possibly Jax (dog)
- Based in Morristown, NJ. Flying from {origin}.

**Trip:** {destination}
**Dates:** {start_date} to {end_date} ({nights} nights)
**Route:** {origin} → {dest_airport}
{flight_section}
{hotel_section}

Provide a comprehensive, personalized travel guide with these sections:

## Destination Overview
What makes {destination} special. Key highlights for a family visit during these dates.

## Family Travel Tips
Specific advice for traveling with a 4-year-old and a pregnant woman:
- Kid-friendly activities, restaurants, and attractions
- Pregnancy considerations (nearby medical facilities, comfort tips, activity restrictions)
- Pet-friendly options if bringing Jax, or boarding recommendations

## Weather & Packing
Expected weather for {start_date} to {end_date}. Use Weather tool if available.
What to pack for the family.

## Day-by-Day Itinerary
Suggest a {nights}-day itinerary balancing activities with rest:
- Morning, afternoon, and evening suggestions each day
- Include specific restaurant names and activity names where possible
- Factor in nap time / rest periods for Sebby and Carolyn
- Include estimated costs where possible

## Flight Recommendation
{"Analyze the flight options above. Which offers the best combination of price, timing, stops, and comfort for a family with a young child and pregnant woman? Rank your top 2-3 picks with reasoning." if flights else "No flight results available yet. Provide general flight advice for this route — best airlines, typical prices, best times to fly."}

## Hotel Recommendation
{"Analyze the hotel options above. Which is best for a family considering location, amenities (pool, kid-friendly), comfort, and value? Rank your top 2-3 picks with reasoning." if hotels else "No hotel results available yet. Suggest what type of accommodation to look for — best neighborhoods/areas for families, resort vs hotel, what amenities to prioritize."}

## Budget Estimate
Estimated total trip cost breakdown:
- Flights ({"based on options above" if flights else "estimated for this route"})
- Hotel ({"based on options above" if hotels else "estimated"} × {nights} nights)
- Food & dining (family of {passengers}, {nights} days)
- Activities & attractions
- Local transportation
- **Total estimated cost**

Be specific with names, prices, and actionable details. No generic filler."""

    return prompt


def register_travel_handlers(socketio: SocketIO):

    @socketio.on("travel:insights")
    def handle_travel_insights(data):
        destination = data.get("destination", "")
        if not destination:
            emit("travel:error", {"error": "Destination is required"})
            return

        print(f"[TRAVEL] Generating insights for: {destination}", flush=True)
        prompt = build_travel_prompt(data)

        from backend.agent.wrapper import get_executor

        callback = StreamingCallbackHandler()
        try:
            executor = get_executor()
            print(f"[TRAVEL] Got executor: {type(executor).__name__}", flush=True)
        except Exception as e:
            print(f"[TRAVEL] ERROR getting executor: {e}", flush=True)
            emit("travel:error", {"error": f"Agent initialization failed: {e}"})
            return

        executor.handle_parsing_errors = (
            "Parsing error. You must respond using EXACTLY this format:\n"
            "Thought: I now know the final answer\n"
            "Final Answer: <your complete response here>"
        )

        def run_agent():
            try:
                print("[TRAVEL] Agent thread starting invoke...", flush=True)
                result = executor.invoke(
                    {"input": prompt},
                    config={"callbacks": [callback]}
                )
                print(f"[TRAVEL] Agent invoke returned: {str(result)[:200]}", flush=True)
                if not callback.is_done:
                    output = result.get("output", "") if isinstance(result, dict) else str(result)
                    callback.queue.put({
                        "event": "done",
                        "data": {"output": output}
                    })
                    callback._done = True
            except Exception as e:
                print(f"[TRAVEL] Agent thread ERROR: {e}", flush=True)
                callback.queue.put({
                    "event": "error",
                    "data": str(e)
                })
                callback._done = True

        thread = threading.Thread(target=run_agent, daemon=True)
        thread.start()

        tool_calls = []
        timeout_at = time.time() + 180  # 3 min timeout for travel research
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
                emit("travel:thinking", {"text": event_data})
            elif event_type == "tool_start":
                tool_calls.append(event_data)
                emit("travel:tool_start", event_data)
            elif event_type == "tool_result":
                emit("travel:tool_result", event_data)
            elif event_type == "done":
                response_text = event_data.get("output", "")
                emit("travel:done", {
                    "response": response_text,
                    "toolCalls": tool_calls,
                })
                try:
                    from backend.db import log_activity
                    tools_used = [tc.get("tool", "") for tc in tool_calls]
                    log_activity(
                        "travel", "insights",
                        f"Insights: {destination}",
                        {"tools": tools_used, "response_len": len(response_text)}
                    )
                except Exception:
                    pass
                break
            elif event_type == "error":
                emit("travel:error", {"error": event_data})
                break
        else:
            emit("travel:error", {"error": "Travel insights timed out after 180 seconds"})
