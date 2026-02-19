"""Sync API - Calendar and other integrations."""
from flask import Blueprint, request, jsonify
import os
from datetime import datetime
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import pickle

sync_bp = Blueprint('sync', __name__, url_prefix='/api/sync')

GOOGLE_CALENDAR_ID = 'primary'
CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar']
TOKEN_FILE = os.path.expanduser('~/.openclaw/google_calendar_token.pickle')
CREDS_FILE = os.path.expanduser('~/.openclaw/gmail_creds.json')


def get_calendar_service():
    """Get authenticated Google Calendar service."""
    creds = None
    
    # Load saved token if exists
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)
    
    # If no valid creds, refresh
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, 'wb') as token:
            pickle.dump(creds, token)
    
    if creds and creds.valid:
        return build('calendar', 'v3', credentials=creds)
    
    return None


@sync_bp.route('/calendora-to-google', methods=['POST'])
def sync_calendora_to_google():
    """Sync Calendora events to Google Calendar."""
    try:
        calendora_events = request.json.get('events', [])
        
        if not calendora_events:
            return jsonify({'status': 'no events', 'synced': 0})
        
        service = get_calendar_service()
        if not service:
            return jsonify({'error': 'Google Calendar not authenticated'}), 401
        
        synced_count = 0
        errors = []
        
        for event in calendora_events:
            try:
                title = event.get('title', '')
                start_time = event.get('startTime', '')
                end_time = event.get('endTime', '')
                description = event.get('description', '')
                
                if not title or not start_time:
                    continue
                
                # Build Google Calendar event
                google_event = {
                    'summary': title,
                    'description': description or '',
                    'start': {'dateTime': start_time, 'timeZone': 'America/New_York'},
                    'end': {'dateTime': end_time, 'timeZone': 'America/New_York'},
                }
                
                # Create event in Google Calendar
                result = service.events().insert(
                    calendarId=GOOGLE_CALENDAR_ID,
                    body=google_event
                ).execute()
                
                synced_count += 1
                    
            except Exception as e:
                errors.append(f"{title}: {str(e)[:100]}")
                continue
        
        return jsonify({
            'status': 'success',
            'synced': synced_count,
            'total': len(calendora_events),
            'errors': errors if errors else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sync_bp.route('/calendora-sync-status', methods=['GET'])
def get_sync_status():
    """Get the status of the last Calendora sync."""
    try:
        log_file = '/Users/michaelvicenzino/.openclaw/cron/logs/calendora-sync.log'
        with open(log_file, 'r') as f:
            lines = f.readlines()
        
        # Get last 20 lines
        recent_lines = lines[-20:]
        
        return jsonify({
            'status': 'ok',
            'recent_logs': recent_lines
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
