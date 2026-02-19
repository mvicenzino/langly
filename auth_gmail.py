#!/usr/bin/env python3
"""One-time Gmail OAuth authentication script.

Run this once to authenticate with Gmail:
    python3 auth_gmail.py

Then the Important Emails widget will work.
"""

import pickle
import os
import sys
from pathlib import Path

# Ensure backend is on path
sys.path.insert(0, str(Path(__file__).parent))

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CREDS_FILE = os.path.expanduser('~/.openclaw/gmail_creds.json')
TOKEN_FILE = os.path.expanduser('~/.openclaw/gmail_token.pickle')


def authenticate():
    """Run OAuth flow and save token."""
    print("=" * 60)
    print("Gmail OAuth Authentication")
    print("=" * 60)
    
    # Check if creds file exists
    if not os.path.exists(CREDS_FILE):
        print(f"❌ Error: Gmail credentials file not found at {CREDS_FILE}")
        print("Create a Google Cloud OAuth app first:")
        print("  1. Go to https://console.cloud.google.com")
        print("  2. Create a new project")
        print("  3. Enable Gmail API")
        print("  4. Create OAuth 2.0 credentials (Desktop application)")
        print("  5. Download JSON and save to ~/.openclaw/gmail_creds.json")
        return False
    
    # Check if already authenticated
    if os.path.exists(TOKEN_FILE):
        print(f"✅ Token already exists at {TOKEN_FILE}")
        try:
            with open(TOKEN_FILE, 'rb') as f:
                creds = pickle.load(f)
            if creds and creds.valid:
                if creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                    with open(TOKEN_FILE, 'wb') as f:
                        pickle.dump(creds, f)
                    print("✅ Token refreshed successfully")
                else:
                    print("✅ Token is still valid")
                return True
        except Exception as e:
            print(f"⚠️  Existing token invalid: {e}")
            print("Re-authenticating...")
    
    # Start OAuth flow
    print("\n📱 Starting OAuth flow...")
    print(f"   Using credentials from: {CREDS_FILE}")
    
    try:
        flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
        creds = flow.run_local_server(port=8080, open_browser=True)
        
        # Save token
        with open(TOKEN_FILE, 'wb') as f:
            pickle.dump(creds, f)
        
        print(f"\n✅ Success! Token saved to: {TOKEN_FILE}")
        print("✅ Gmail API authenticated. The widget will now work!")
        return True
        
    except Exception as e:
        print(f"\n❌ Authentication failed: {e}")
        return False


if __name__ == '__main__':
    success = authenticate()
    sys.exit(0 if success else 1)
