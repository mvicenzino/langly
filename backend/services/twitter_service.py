"""X/Twitter posting service via OAuth 1.0a."""
from __future__ import annotations

import os
from typing import Optional

from requests_oauthlib import OAuth1Session


TWITTER_API_KEY = os.getenv("TWITTER_API_KEY", "")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET", "")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN", "")
TWITTER_ACCESS_TOKEN_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET", "")

TWEET_URL = "https://api.twitter.com/2/tweets"


def is_configured() -> bool:
    """Check that all 4 Twitter API keys are present."""
    return all([TWITTER_API_KEY, TWITTER_API_SECRET,
                TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET])


def publish_tweet(text: str) -> dict:
    """Post a tweet and return {"url": "https://x.com/i/status/..."}.

    Raises on failure.
    """
    if not is_configured():
        raise RuntimeError("Twitter API keys not configured — add TWITTER_API_KEY, "
                           "TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, "
                           "TWITTER_ACCESS_TOKEN_SECRET to .env")

    session = OAuth1Session(
        TWITTER_API_KEY,
        client_secret=TWITTER_API_SECRET,
        resource_owner_key=TWITTER_ACCESS_TOKEN,
        resource_owner_secret=TWITTER_ACCESS_TOKEN_SECRET,
    )

    resp = session.post(TWEET_URL, json={"text": text})
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Twitter API error {resp.status_code}: {resp.text}")

    data = resp.json()
    tweet_id = data["data"]["id"]
    return {"url": f"https://x.com/i/status/{tweet_id}"}
