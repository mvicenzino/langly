"""LinkedIn OAuth2 + posting service."""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

import requests

from backend.db import query, execute, execute_returning

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI",
                                   "http://localhost:5001/api/social/linkedin/callback")

AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
POSTS_URL = "https://api.linkedin.com/rest/posts"

SCOPES = "openid profile w_member_social"


def is_configured() -> bool:
    """Check that LinkedIn OAuth2 credentials are set."""
    return bool(LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET)


def get_auth_url(state: str = "langly") -> str:
    """Build the LinkedIn OAuth2 authorization URL."""
    params = {
        "response_type": "code",
        "client_id": LINKEDIN_CLIENT_ID,
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": SCOPES,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    """Exchange authorization code for tokens, fetch person URN, and save to DB."""
    resp = requests.post(TOKEN_URL, data={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "client_id": LINKEDIN_CLIENT_ID,
        "client_secret": LINKEDIN_CLIENT_SECRET,
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})

    if resp.status_code != 200:
        raise RuntimeError(f"LinkedIn token exchange failed: {resp.text}")

    token_data = resp.json()
    access_token = token_data["access_token"]
    expires_in = token_data.get("expires_in", 5184000)  # default 60 days

    # Fetch person URN via userinfo
    me_resp = requests.get(USERINFO_URL, headers={
        "Authorization": f"Bearer {access_token}",
    })
    person_sub = ""
    if me_resp.status_code == 200:
        person_sub = me_resp.json().get("sub", "")

    from datetime import timedelta
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    raw = {**token_data, "person_urn": f"urn:li:person:{person_sub}" if person_sub else ""}

    # Upsert into social_oauth_tokens
    execute("""
        INSERT INTO social_oauth_tokens (platform, access_token, refresh_token, token_type, expires_at, scope, raw_response, updated_at)
        VALUES ('linkedin', %s, %s, 'Bearer', %s, %s, %s, NOW())
        ON CONFLICT (platform)
        DO UPDATE SET access_token = EXCLUDED.access_token,
                      refresh_token = EXCLUDED.refresh_token,
                      expires_at = EXCLUDED.expires_at,
                      scope = EXCLUDED.scope,
                      raw_response = EXCLUDED.raw_response,
                      updated_at = NOW()
    """, (
        access_token,
        token_data.get("refresh_token", ""),
        expires_at,
        SCOPES,
        json.dumps(raw),
    ))

    return {"connected": True, "expires_at": expires_at.isoformat()}


def get_valid_token() -> Optional[str]:
    """Get the current LinkedIn access token if it exists and hasn't expired."""
    rows = query("SELECT * FROM social_oauth_tokens WHERE platform = 'linkedin'")
    if not rows:
        return None
    row = rows[0]
    if row.get("expires_at"):
        exp = row["expires_at"]
        if hasattr(exp, 'tzinfo') and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return None
    return row["access_token"]


def _get_person_urn() -> Optional[str]:
    """Get the stored person URN from the raw_response."""
    rows = query("SELECT raw_response FROM social_oauth_tokens WHERE platform = 'linkedin'")
    if not rows:
        return None
    raw = rows[0].get("raw_response", {})
    if isinstance(raw, str):
        raw = json.loads(raw)
    return raw.get("person_urn", "")


def is_connected() -> bool:
    """Check if LinkedIn has a valid token."""
    return get_valid_token() is not None


def publish_post(text: str) -> dict:
    """Publish a post to LinkedIn and return {"url": "..."}.

    Raises on failure.
    """
    token = get_valid_token()
    if not token:
        raise RuntimeError("LinkedIn not connected — authorize via Settings first")

    person_urn = _get_person_urn()
    if not person_urn:
        raise RuntimeError("LinkedIn person URN not found — re-authorize")

    payload = {
        "author": person_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        },
    }

    resp = requests.post(
        "https://api.linkedin.com/v2/ugcPosts",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
        },
    )

    if resp.status_code not in (200, 201):
        raise RuntimeError(f"LinkedIn API error {resp.status_code}: {resp.text}")

    data = resp.json()
    post_id = data.get("id", "")
    # Build a share URL from the activity URN
    activity_id = post_id.split(":")[-1] if post_id else ""
    url = f"https://www.linkedin.com/feed/update/{post_id}" if post_id else ""

    return {"url": url}


def disconnect():
    """Remove LinkedIn tokens from the database."""
    execute("DELETE FROM social_oauth_tokens WHERE platform = 'linkedin'")
