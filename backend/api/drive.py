"""Google Drive integration — lists recent files from a shared folder using a service account."""
from __future__ import annotations

import io
import json
import os
import threading
from flask import Blueprint, Response, jsonify, request

drive_bp = Blueprint("drive", __name__)

# Lazy-load the Google client to avoid import errors if not configured
_service = None
_drive_lock = threading.Lock()


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


def _list_folder(svc, fid, recursive=False, depth=0):
    """List files in a folder, optionally recursing into subfolders."""
    q = f"'{fid}' in parents and trashed = false" if fid else "trashed = false"
    with _drive_lock:
        result = svc.files().list(
            q=q,
            pageSize=100,
            fields="files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink)",
            orderBy="modifiedTime desc",
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        ).execute()

    files = []
    for f in result.get("files", []):
        mime = f.get("mimeType", "")
        is_folder = mime == "application/vnd.google-apps.folder"

        if is_folder and recursive and depth < 3:
            sub_files = _list_folder(svc, f["id"], recursive, depth + 1)
            for sf in sub_files:
                if not sf.get("folder"):
                    sf["folder"] = f["name"]
            files.extend(sub_files)
        elif not is_folder:
            files.append({
                "id": f["id"],
                "name": f["name"],
                "mimeType": mime,
                "modifiedTime": f.get("modifiedTime", ""),
                "size": int(f.get("size", 0)) if f.get("size") else 0,
                "webViewLink": f.get("webViewLink", ""),
                "iconLink": f.get("iconLink", ""),
                "isFolder": False,
                "isGoogleDoc": mime.startswith("application/vnd.google-apps."),
                "folder": "",
            })
    return files


@drive_bp.route("/api/drive/thumbnail/<file_id>")
def drive_thumbnail(file_id: str):
    """Proxy an image from Google Drive so the browser can display it."""
    svc = _get_service()
    if not svc:
        return jsonify({"error": "Drive not configured"}), 500

    try:
        from googleapiclient.http import MediaIoBaseDownload

        with _drive_lock:
            meta = svc.files().get(fileId=file_id, fields="mimeType", supportsAllDrives=True).execute()
            mime = meta.get("mimeType", "application/octet-stream")

            buf = io.BytesIO()
            req = svc.files().get_media(fileId=file_id, supportsAllDrives=True)
            dl = MediaIoBaseDownload(buf, req)
            done = False
            while not done:
                _, done = dl.next_chunk()

        buf.seek(0)
        return Response(buf.read(), mimetype=mime, headers={"Cache-Control": "public, max-age=3600"})
    except Exception as e:
        status = 404 if "not found" in str(e).lower() or "404" in str(e) else 500
        return jsonify({"error": str(e)}), status


@drive_bp.route("/api/drive/files")
def drive_files():
    """List recent files from Google Drive."""
    svc = _get_service()
    if not svc:
        return jsonify({"configured": False, "files": []})

    folder_id = request.args.get("folder_id", os.getenv("GOOGLE_DRIVE_FOLDER_ID", ""))
    page_size = int(request.args.get("limit", "20"))
    recursive = request.args.get("recursive", "false").lower() == "true"

    try:
        all_files = _list_folder(svc, folder_id, recursive)
        all_files.sort(key=lambda f: f.get("modifiedTime", ""), reverse=True)
        return jsonify({"configured": True, "files": all_files[:page_size]})
    except Exception as e:
        return jsonify({"configured": True, "files": [], "error": str(e)}), 500


@drive_bp.route("/api/drive/multi")
def drive_multi():
    """List files from multiple Google Drive folders in a single request."""
    svc = _get_service()
    if not svc:
        return jsonify({"configured": False, "groups": []})

    # folder_ids=id1:label1,id2:label2,...
    raw = request.args.get("folders", "")
    page_size = int(request.args.get("limit", "50"))
    recursive = request.args.get("recursive", "false").lower() == "true"

    groups = []
    for entry in raw.split(","):
        entry = entry.strip()
        if not entry:
            continue
        if ":" in entry:
            fid, label = entry.split(":", 1)
        else:
            fid, label = entry, entry

        try:
            files = _list_folder(svc, fid, recursive)
            files.sort(key=lambda f: f.get("modifiedTime", ""), reverse=True)
            groups.append({"label": label, "files": files[:page_size]})
        except Exception:
            groups.append({"label": label, "files": [], "error": "Failed to load"})

    return jsonify({"configured": True, "groups": groups})
