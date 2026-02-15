"""Social media OAuth and connection status endpoints."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from backend.services.linkedin_service import (
    is_configured as linkedin_configured,
    is_connected as linkedin_connected,
    get_auth_url,
    exchange_code,
    disconnect as linkedin_disconnect,
)
from backend.services.twitter_service import is_configured as twitter_configured

social_bp = Blueprint("social", __name__)


@social_bp.route("/api/social/status")
def connection_status():
    """Return connection status for all social platforms."""
    return jsonify({
        "linkedin": {
            "configured": linkedin_configured(),
            "connected": linkedin_connected() if linkedin_configured() else False,
        },
        "twitter": {
            "configured": twitter_configured(),
            "connected": twitter_configured(),  # static keys = always connected if configured
        },
    })


@social_bp.route("/api/social/linkedin/auth")
def linkedin_auth():
    """Return the LinkedIn OAuth2 authorization URL."""
    if not linkedin_configured():
        return jsonify({"error": "LinkedIn OAuth2 credentials not configured"}), 400
    url = get_auth_url()
    return jsonify({"auth_url": url})


@social_bp.route("/api/social/linkedin/callback")
def linkedin_callback():
    """Handle LinkedIn OAuth2 callback — exchange code and return HTML that closes the popup."""
    code = request.args.get("code")
    error = request.args.get("error")

    if error:
        return f"""<html><body style="background:#0f172a;color:#f87171;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh">
            <div style="text-align:center"><h2>Authorization Failed</h2><p>{error}</p>
            <script>setTimeout(()=>window.close(),3000)</script></div></body></html>"""

    if not code:
        return f"""<html><body style="background:#0f172a;color:#f87171;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh">
            <div style="text-align:center"><h2>Missing authorization code</h2>
            <script>setTimeout(()=>window.close(),3000)</script></div></body></html>"""

    try:
        exchange_code(code)
    except Exception as exc:
        return f"""<html><body style="background:#0f172a;color:#f87171;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh">
            <div style="text-align:center"><h2>Token Exchange Failed</h2><p>{exc}</p>
            <script>setTimeout(()=>window.close(),3000)</script></div></body></html>"""

    return """<html><body style="background:#0f172a;color:#34d399;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh">
        <div style="text-align:center">
            <h2 style="font-size:24px">&#10003; LinkedIn Connected!</h2>
            <p style="color:#94a3b8;margin-top:8px">You can close this window.</p>
        </div>
        <script>
            window.opener && window.opener.postMessage({type:'linkedin-connected'},'*');
            setTimeout(()=>window.close(),2000);
        </script>
    </body></html>"""


@social_bp.route("/api/social/linkedin/disconnect", methods=["DELETE"])
def linkedin_disconnect_endpoint():
    """Remove LinkedIn tokens."""
    linkedin_disconnect()
    return jsonify({"success": True})
