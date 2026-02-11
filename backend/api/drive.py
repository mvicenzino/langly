"""Google Drive integration — lists recent files from a shared folder using a service account."""
from __future__ import annotations

import json
import os
from flask import Blueprint, jsonify, request

drive_bp = Blueprint("drive", __name__)

# Lazy-load the Google client to avoid import errors if not configured
_service = None


def _get_service():
    global _service
    if _service is not None:
        return _service

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        return None

    creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    creds_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")

    if creds_json:
        info = json.loads(creds_json)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/drive.readonly"]
        )
    elif creds_file and os.path.exists(creds_file):
        creds = service_account.Credentials.from_service_account_file(
            creds_file, scopes=["https://www.googleapis.com/auth/drive.readonly"]
        )
    else:
        return None

    _service = build("drive", "v3", credentials=creds, cache_discovery=False)
    return _service


@drive_bp.route("/api/drive/status")
def drive_status():
    """Check if Google Drive is configured."""
    svc = _get_service()
    return jsonify({"configured": svc is not None})


@drive_bp.route("/api/drive/files")
def drive_files():
    """List recent files from Google Drive."""
    svc = _get_service()
    if not svc:
        return jsonify({"configured": False, "files": []})

    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")
    page_size = request.args.get("limit", "20", type=str)

    try:
        query_parts = ["trashed = false"]
        if folder_id:
            query_parts.append(f"'{folder_id}' in parents")

        result = svc.files().list(
            q=" and ".join(query_parts),
            pageSize=int(page_size),
            fields="files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink)",
            orderBy="modifiedTime desc",
        ).execute()

        files = []
        for f in result.get("files", []):
            mime = f.get("mimeType", "")
            files.append({
                "id": f["id"],
                "name": f["name"],
                "mimeType": mime,
                "modifiedTime": f.get("modifiedTime", ""),
                "size": int(f.get("size", 0)) if f.get("size") else 0,
                "webViewLink": f.get("webViewLink", ""),
                "iconLink": f.get("iconLink", ""),
                "isFolder": mime == "application/vnd.google-apps.folder",
                "isGoogleDoc": mime.startswith("application/vnd.google-apps."),
            })

        return jsonify({"configured": True, "files": files})
    except Exception as e:
        return jsonify({"configured": True, "files": [], "error": str(e)}), 500
