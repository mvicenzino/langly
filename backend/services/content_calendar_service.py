"""Content Calendar generation service — direct LLM call for 4-week content planning."""
from __future__ import annotations

import json
import os
import uuid
from datetime import date, timedelta
from typing import Optional

from langchain_openai import ChatOpenAI

from backend.db import query, execute, execute_returning

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

SYSTEM_PROMPT = """You are a content strategist for Stride — a personal brand built by Michael Vicenzino.

Brand voice: confident, strategic, data-grounded, never generic. Michael is an AI strategy consultant and builder who helps leaders operationalize AI. He speaks from experience, shares frameworks, and isn't afraid of bold takes.

Key themes:
- AI adoption & operationalization (not hype — practical deployment)
- Data strategy & decision intelligence
- Career growth in the AI era
- Building in public (Langly, OpenClaw, personal AI tools)
- Leadership & executive communication

Tone: authoritative but approachable, punchy hooks, concrete examples, no fluff.
Platform conventions:
- Newsletter: 800-1200 word deep-dive, one core insight, actionable takeaways
- LinkedIn: professional but authentic, hook in first line, 150-300 words, end with question or CTA
- X/Twitter: punchy, bold, 280 chars max per tweet, threads use numbered format, hot takes welcome

You MUST respond with a valid JSON array and nothing else — no markdown fences, no explanation."""

USER_PROMPT_TEMPLATE = """Generate a 4-week content calendar starting {start_date}.

Week ranges:
{week_ranges}

For each week produce:
- 1 newsletter topic (schedule on Tuesday or Wednesday)
- 4 LinkedIn posts (spread across weekdays)
- 5 X/Twitter posts (spread across weekdays)

Return a JSON array of objects with these exact fields:
- "platform": "newsletter" | "linkedin" | "twitter"
- "scheduled_date": "YYYY-MM-DD"
- "week_number": 1-4
- "title": short title (max 80 chars)
- "body": full post content
- "hashtags": comma-separated hashtags (empty string for newsletter)

Make each piece unique and varied. Mix formats: hot takes, how-tos, threads, stories, data insights, frameworks.
Return ONLY the JSON array."""


def _next_monday(d: Optional[date] = None) -> date:
    """Return the next Monday on or after the given date."""
    d = d or date.today()
    days_ahead = (7 - d.weekday()) % 7
    if days_ahead == 0 and d.weekday() != 0:
        days_ahead = 7
    return d + timedelta(days=days_ahead) if d.weekday() != 0 else d


def generate_content_calendar(start_date_str: Optional[str] = None) -> dict:
    """Generate a 4-week content calendar via LLM and save to database."""
    if start_date_str:
        start = date.fromisoformat(start_date_str)
    else:
        start = _next_monday()

    # Build week ranges for the prompt
    week_ranges = []
    for i in range(4):
        w_start = start + timedelta(weeks=i)
        w_end = w_start + timedelta(days=4)  # Mon-Fri
        week_ranges.append(f"Week {i + 1}: {w_start.isoformat()} to {w_end.isoformat()}")

    user_prompt = USER_PROMPT_TEMPLATE.format(
        start_date=start.isoformat(),
        week_ranges="\n".join(week_ranges),
    )

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        api_key=OPENAI_API_KEY,
    )

    response = llm.invoke([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ])

    raw = response.content.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = lines[1:]  # remove opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines)

    items = json.loads(raw)

    batch_id = f"batch_{start.isoformat()}_{uuid.uuid4().hex[:8]}"

    saved = []
    for item in items:
        row = execute_returning(
            """INSERT INTO content_calendar
               (batch_id, platform, scheduled_date, week_number, title, body, hashtags, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft')
               RETURNING *""",
            (
                batch_id,
                item["platform"],
                item["scheduled_date"],
                item["week_number"],
                item["title"],
                item["body"],
                item.get("hashtags", ""),
            ),
        )
        if row:
            saved.append(row)

    return {"batch_id": batch_id, "count": len(saved), "items": saved}


def list_items(batch_id: Optional[str] = None, week: Optional[int] = None,
               platform: Optional[str] = None, status: Optional[str] = None) -> list:
    """List content calendar items with optional filters."""
    sql = "SELECT * FROM content_calendar WHERE 1=1"
    params = []

    if batch_id:
        sql += " AND batch_id = %s"
        params.append(batch_id)
    if week:
        sql += " AND week_number = %s"
        params.append(week)
    if platform:
        sql += " AND platform = %s"
        params.append(platform)
    if status:
        sql += " AND status = %s"
        params.append(status)

    sql += " ORDER BY week_number, scheduled_date, platform"
    return query(sql, params or None)


def list_batches() -> list:
    """List all batches with counts."""
    return query("""
        SELECT batch_id,
               MIN(scheduled_date) AS start_date,
               MAX(scheduled_date) AS end_date,
               COUNT(*) AS item_count,
               MIN(created_at) AS created_at
        FROM content_calendar
        GROUP BY batch_id
        ORDER BY MIN(created_at) DESC
    """)


def update_item(item_id: int, updates: dict) -> Optional[dict]:
    """Update a content calendar item."""
    allowed = {"title", "body", "hashtags", "status", "notes", "scheduled_date"}
    fields = {k: v for k, v in updates.items() if k in allowed}
    if not fields:
        return None

    sets = ", ".join(f"{k} = %s" for k in fields)
    sets += ", updated_at = NOW()"
    params = list(fields.values()) + [item_id]

    execute(f"UPDATE content_calendar SET {sets} WHERE id = %s", params)
    rows = query("SELECT * FROM content_calendar WHERE id = %s", (item_id,))
    return rows[0] if rows else None


def delete_item(item_id: int) -> bool:
    """Delete a single content calendar item."""
    count = execute("DELETE FROM content_calendar WHERE id = %s", (item_id,))
    return count > 0


def delete_batch(batch_id: str) -> int:
    """Delete all items in a batch."""
    return execute("DELETE FROM content_calendar WHERE batch_id = %s", (batch_id,))


def publish_item(item_id: int) -> dict:
    """Publish a content calendar item to its platform and update the record."""
    rows = query("SELECT * FROM content_calendar WHERE id = %s", (item_id,))
    if not rows:
        raise ValueError("Item not found")

    item = rows[0]
    platform = item["platform"]

    # Use body as-is — hashtags are already inline for tweets/posts
    text = item["body"]

    if platform == "twitter":
        from backend.services.twitter_service import publish_tweet
        result = publish_tweet(text)
    elif platform == "linkedin":
        from backend.services.linkedin_service import publish_post
        result = publish_post(text)
    else:
        raise ValueError(f"Publishing not supported for platform: {platform}")

    published_url = result.get("url", "")

    execute(
        """UPDATE content_calendar
           SET status = 'published', published_url = %s, published_at = NOW(), updated_at = NOW()
           WHERE id = %s""",
        (published_url, item_id),
    )

    updated = query("SELECT * FROM content_calendar WHERE id = %s", (item_id,))
    return updated[0] if updated else {"id": item_id, "status": "published", "published_url": published_url}
