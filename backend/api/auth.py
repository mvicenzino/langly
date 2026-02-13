"""Authentication endpoints — password gate for Langly."""
from __future__ import annotations

import os
import secrets

import bcrypt
from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__)

# In-memory token store — server restart = re-login (fine for personal app)
_valid_tokens: set[str] = set()


def _get_password_hash() -> bytes:
    h = os.environ.get("LANGLY_PASSWORD_HASH", "")
    if not h:
        raise RuntimeError("LANGLY_PASSWORD_HASH not set in environment")
    return h.encode("utf-8")


def is_token_valid(token: str | None) -> bool:
    return token is not None and token in _valid_tokens


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    password = body.get("password", "")
    if not password:
        return jsonify({"error": "Password required"}), 400

    try:
        pw_hash = _get_password_hash()
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500

    if bcrypt.checkpw(password.encode("utf-8"), pw_hash):
        token = secrets.token_hex(32)
        _valid_tokens.add(token)
        return jsonify({"token": token})
    else:
        return jsonify({"error": "Invalid password"}), 401


@auth_bp.route("/api/auth/verify")
def verify():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        if is_token_valid(token):
            return jsonify({"valid": True})
    return jsonify({"valid": False, "error": "Invalid token"}), 401
