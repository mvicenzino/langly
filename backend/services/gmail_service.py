"""Gmail service using Google API."""
import pickle
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CREDS_FILE = os.path.expanduser('~/.openclaw/gmail_creds.json')
TOKEN_FILE = os.path.expanduser('~/.openclaw/gmail_token.pickle')


def get_gmail_service():
    """Get authenticated Gmail API service."""
    creds = None
    
    # Load saved token if exists
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)
    
    # If no valid creds, refresh or go through auth flow
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    elif not creds or not creds.valid:
        # Fall back to manual auth if we have credentials file
        if os.path.exists(CREDS_FILE):
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    CREDS_FILE, SCOPES)
                # Try to open browser; if it fails, just print the URL
                try:
                    creds = flow.run_local_server(port=8080, open_browser=True)
                except Exception as browser_err:
                    print(f"Warning: Could not open browser: {browser_err}")
                    print("Please manually visit the authorization URL provided")
                    creds = flow.run_local_server(port=8080, open_browser=False)
                
                # Save token for next time
                with open(TOKEN_FILE, 'wb') as token:
                    pickle.dump(creds, token)
                print(f"✅ Gmail OAuth token saved to {TOKEN_FILE}")
            except Exception as e:
                print(f"❌ Gmail auth failed: {e}")
                return None
        else:
            print(f"❌ Gmail credentials file not found at {CREDS_FILE}")
            return None
    
    if not creds or not creds.valid:
        return None
    
    return build('gmail', 'v1', credentials=creds)


def is_important_email(subject: str, from_addr: str, snippet: str) -> bool:
    """Determine if an email is important (not spam/promo)."""
    subject_lower = subject.lower()
    from_lower = from_addr.lower()
    snippet_lower = snippet.lower()
    full_text = f"{subject_lower} {from_lower} {snippet_lower}"
    
    # EXCLUDE obvious spam/marketing first
    spam_keywords = [
        # Promotions
        'up to ', '% off', 'bogo', 'buy now', 'shop now', 'order now',
        'limited time', 'flash sale', 'special offer', 'limited offer',
        'discount', 'coupon', 'promo code', 'free shipping', 'free delivery',
        'on sale', 'new collection', 'new arrivals', 'just arrived',
        # Marketing/Sales
        'newsletter', 'unsubscribe', 'promotional', 'marketing',
        'we\'re moving', 'warehouse sale', 'clearance',
        # Updates/Notifications  
        'alert:', 'notification:', 'update:', 'news:', 'digest',
        'explore new', 'new in ', 'trending',
    ]
    
    # INCLUDE important categories
    important_keywords = [
        # Tax-related
        'tax', '1099', 'w-2', 'w2', 'irs', 'refund', 'deduction', 'turbotax', 'h&r block',
        # Unemployment
        'unemployment', 'nj unemployment', 'benefits', 'claim', 'weekly filing',
        # Bills, payments, invoices
        'invoice', 'bill', 'receipt', 'payment', 'charge', 'statement', 'due date',
        'order confirmation', 'transaction',
        # Account security & important notices
        'password', 'confirm', 'verify', 'security', 'urgent',
        'from your bank', 'from your card',
        # Important accounts
        'bank', 'credit card', 'paypal', 'stripe', 'square',
        # Work and personal
        'job offer', 'job match', 'recruiter', 'interview', 'hiring',
        'meeting', 'appointment', 'rsvp',
    ]
    
    # If it matches SPAM keywords, exclude it (strongest signal)
    if any(keyword in full_text for keyword in spam_keywords):
        return False
    
    # If it matches important keywords, include it
    if any(keyword in full_text for keyword in important_keywords):
        return True
    
    # List of domains that are known marketing/retail (exclude these)
    marketing_domains = [
        'mail.tommiecopper.com', 'blenderseyewear.com', 'e.wtso.com', 'eml.tjmaxx.com',
        'untuckit.com', 'forwardmotion.blenderseyewear.com',
        'nike.com', 'adidas.com', 'amazon.com', 'ebay.com', 'etsy.com',
        'nordstrom.com', 'gap.com', 'hm.com', 'zara.com', 'uniqlo.com',
        'beehiiv.com',  # Newsletter platform
        '.tdwi.org', '.training',  # Generic training platforms
    ]
    
    domain = from_lower.split('@')[1] if '@' in from_lower else ''
    if any(marketing in domain for marketing in marketing_domains):
        return False
    
    # Check for emails from specific people (personal/work contacts)
    important_personal_domains = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'aol.com', 'icloud.com',  # Personal
    ]
    
    # If from a personal email address, likely important
    if any(domain in from_lower for domain in important_personal_domains):
        # But exclude if it's clearly a service account
        if any(service in from_lower for service in ['noreply', 'no-reply', 'notification', 'alert', 'newsletter']):
            return False
        return True
    
    # For corporate emails: only include if it contains a person's first/last name pattern
    # (to avoid "theteam@" or "sales@" type addresses)
    if '@' in from_addr and domain and not any(service in from_lower for service in ['noreply', 'no-reply', 'notification', 'alert', 'marketing', 'sales', 'support+', 'theteam', 'info@']):
        return True
    
    # Default: exclude (conservative)
    return False


def search_emails(query: str, max_results: int = 8):
    """Search for emails matching the query."""
    try:
        service = get_gmail_service()
        if not service:
            return None
        
        # Search for message IDs
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results * 3  # Fetch extra to account for filtering
        ).execute()
        
        messages = results.get('messages', [])
        
        if not messages:
            return []
        
        # Get full message details
        emails = []
        for msg in messages:
            try:
                message = service.users().messages().get(
                    userId='me',
                    id=msg['id'],
                    format='full'  # Full format includes payload
                ).execute()
                
                headers = {h['name']: h['value'] for h in message.get('payload', {}).get('headers', [])}
                label_ids = message.get('labelIds', [])
                
                # Skip Gmail-marked spam/promotions
                if any(label in label_ids for label in ['SPAM', 'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS']):
                    continue
                
                subject = headers.get('Subject', '(no subject)')
                from_addr = headers.get('From', 'unknown')
                snippet = message.get('snippet', '')[:100]
                
                # Apply smart filtering
                if not is_important_email(subject, from_addr, snippet):
                    continue
                
                emails.append({
                    'id': message['id'],
                    'subject': subject,
                    'from': from_addr,
                    'snippet': snippet,
                    'date': format_email_date(headers.get('Date', '')),
                    'isUnread': 'UNREAD' in label_ids,
                    'isStarred': 'STARRED' in label_ids,
                })
                
                # Stop when we have enough results
                if len(emails) >= max_results:
                    break
                    
            except Exception as e:
                print(f"Error fetching message {msg['id']}: {e}")
                continue
        
        return emails
    
    except Exception as e:
        print(f"Error searching emails: {e}")
        return None


def format_email_date(date_str: str) -> str:
    """Format email date for display."""
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        from datetime import datetime
        
        now = datetime.now(dt.tzinfo)
        delta = now - dt
        
        if delta.days == 0:
            return f"Today · {dt.strftime('%I:%M %p').lstrip('0')}"
        elif delta.days == 1:
            return "Yesterday"
        elif delta.days < 7:
            return f"{delta.days}d ago"
        else:
            return dt.strftime('%b %d')
    except:
        return date_str
