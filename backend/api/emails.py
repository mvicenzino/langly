from flask import Blueprint, request, jsonify
from backend.services.gmail_service import search_emails

emails_bp = Blueprint('emails', __name__, url_prefix='/api/emails')


@emails_bp.route('/important', methods=['GET'])
def get_important_emails():
    """Get important emails (tax, bills, unemployment, personal contacts)."""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        # Search for important emails: unread or starred (Gmail will filter by smart importance)
        # The filtering happens in gmail_service.py is_important_email()
        emails = search_emails('(is:unread OR is:starred) -is:spam -category:promotions -category:updates', max_results=limit)
        
        if emails is None:
            return jsonify({
                'emails': [],
                'error': 'Gmail auth not configured',
                'hint': 'Run: python3 auth_gmail.py'
            }), 200
        
        return jsonify({'emails': emails or []}), 200
    
    except Exception as e:
        return jsonify({'error': str(e), 'emails': []}), 500


@emails_bp.route('/unread', methods=['GET'])
def get_unread_emails():
    """Get recent unread emails (excluding spam)."""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        emails = search_emails('is:unread -is:spam', max_results=limit)
        
        if emails is None:
            return jsonify({
                'emails': [],
                'error': 'Gmail auth not configured',
                'hint': 'Run: python3 auth_gmail.py'
            }), 200
        
        return jsonify({'emails': emails or []}), 200
    
    except Exception as e:
        return jsonify({'error': str(e), 'emails': []}), 500
