"""
Anthropic cost tracker — parses Gmail receipts from Anthropic
and returns daily / weekly / monthly / all-time totals.
"""

import re
import subprocess
import json
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from flask import Blueprint, jsonify

anthropic_costs_bp = Blueprint('anthropic_costs', __name__)

CACHE = {'data': None, 'fetched_at': None}
CACHE_TTL_MINUTES = 30


def fetch_receipts():
    """Pull all Anthropic receipts from Gmail and parse amounts."""
    result = subprocess.run(
        ['gog', 'gmail', 'messages', 'search',
         'from:invoice+statements@mail.anthropic.com',
         '--max', '200', '--account', 'mvicenzino@gmail.com', '--plain'],
        capture_output=True, text=True
    )

    lines = result.stdout.strip().split('\n')
    ids = []
    for line in lines[1:]:
        parts = line.split('\t')
        if len(parts) >= 3:
            ids.append((parts[0].strip(), parts[2].strip()[:10]))

    receipts = []
    for msg_id, date_str in ids:
        thread = subprocess.run(
            ['gog', 'gmail', 'thread', 'get', msg_id, '--full',
             '--account', 'mvicenzino@gmail.com'],
            capture_output=True, text=True
        )
        body = thread.stdout

        # Extract amount
        patterns = [
            r'Receipt from Anthropic, PBC \$([0-9,]+\.[0-9]{2})',
            r'Amount paid \$([0-9,]+\.[0-9]{2})',
            r'Total \$([0-9,]+\.[0-9]{2})',
        ]
        amt = None
        for pat in patterns:
            m = re.search(pat, body)
            if m:
                amt = float(m.group(1).replace(',', ''))
                break

        # Extract receipt number from subject line
        receipt_match = re.search(r'#([\d-]+)', body)
        receipt_num = receipt_match.group(1) if receipt_match else msg_id[:8]

        if amt is not None:
            receipts.append({
                'id': msg_id,
                'receipt': receipt_num,
                'date': date_str,
                'amount': amt,
            })

    return receipts


def get_receipts_cached():
    now = datetime.now(timezone.utc)
    if (CACHE['data'] is not None and CACHE['fetched_at'] is not None and
            (now - CACHE['fetched_at']).total_seconds() < CACHE_TTL_MINUTES * 60):
        return CACHE['data']

    receipts = fetch_receipts()
    CACHE['data'] = receipts
    CACHE['fetched_at'] = now
    return receipts


def build_summary(receipts):
    today = datetime.now(timezone.utc).date()

    # Group by date
    by_date = defaultdict(list)
    for r in receipts:
        by_date[r['date']].append(r['amount'])

    # Daily (last 14 days)
    daily = []
    for i in range(13, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        total = sum(by_date.get(d, []))
        count = len(by_date.get(d, []))
        daily.append({'date': d, 'total': round(total, 2), 'count': count})

    # Weekly (last 8 weeks, Mon–Sun)
    weekly = []
    for w in range(7, -1, -1):
        week_start = today - timedelta(days=today.weekday() + w * 7)
        week_end = week_start + timedelta(days=6)
        total = sum(
            amt
            for date_str, amts in by_date.items()
            for amt in amts
            if week_start.isoformat() <= date_str <= week_end.isoformat()
        )
        count = sum(
            len(amts)
            for date_str, amts in by_date.items()
            if week_start.isoformat() <= date_str <= week_end.isoformat()
        )
        weekly.append({
            'week': f"{week_start.strftime('%b %d')} – {week_end.strftime('%b %d')}",
            'week_start': week_start.isoformat(),
            'total': round(total, 2),
            'count': count,
        })

    # Monthly (last 12 months)
    monthly = []
    for m in range(11, -1, -1):
        # Subtract months
        month_date = today.replace(day=1)
        for _ in range(m):
            month_date = (month_date - timedelta(days=1)).replace(day=1)
        month_str = month_date.strftime('%Y-%m')
        total = sum(
            amt
            for date_str, amts in by_date.items()
            for amt in amts
            if date_str.startswith(month_str)
        )
        count = sum(
            len(amts)
            for date_str, amts in by_date.items()
            if date_str.startswith(month_str)
        )
        monthly.append({
            'month': month_date.strftime('%b %Y'),
            'month_key': month_str,
            'total': round(total, 2),
            'count': count,
        })

    # All-time
    all_time_total = round(sum(r['amount'] for r in receipts), 2)
    all_time_count = len(receipts)

    # Today / this week / this month
    week_start_this = today - timedelta(days=today.weekday())
    this_month_str = today.strftime('%Y-%m')

    today_total = round(sum(by_date.get(today.isoformat(), [])), 2)
    today_count = len(by_date.get(today.isoformat(), []))

    this_week_total = round(sum(
        amt for date_str, amts in by_date.items()
        for amt in amts
        if week_start_this.isoformat() <= date_str <= today.isoformat()
    ), 2)
    this_week_count = sum(
        len(amts) for date_str, amts in by_date.items()
        if week_start_this.isoformat() <= date_str <= today.isoformat()
    )

    this_month_total = round(sum(
        amt for date_str, amts in by_date.items()
        for amt in amts
        if date_str.startswith(this_month_str)
    ), 2)
    this_month_count = sum(
        len(amts) for date_str, amts in by_date.items()
        if date_str.startswith(this_month_str)
    )

    return {
        'summary': {
            'today': {'total': today_total, 'count': today_count},
            'this_week': {'total': this_week_total, 'count': this_week_count},
            'this_month': {'total': this_month_total, 'count': this_month_count},
            'all_time': {'total': all_time_total, 'count': all_time_count},
        },
        'daily': daily,
        'weekly': weekly,
        'monthly': monthly,
        'recent': sorted(receipts, key=lambda r: r['date'], reverse=True)[:20],
    }


@anthropic_costs_bp.route('/api/anthropic/costs')
def get_costs():
    receipts = get_receipts_cached()
    return jsonify(build_summary(receipts))


@anthropic_costs_bp.route('/api/anthropic/costs/refresh', methods=['POST'])
def refresh_costs():
    CACHE['data'] = None
    receipts = get_receipts_cached()
    return jsonify(build_summary(receipts))
