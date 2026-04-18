"""Token usage tracking — log and query LLM token consumption and cost."""

from flask import Blueprint, jsonify, request
from backend.db import get_conn, put_conn

token_usage_bp = Blueprint('token_usage', __name__)

# ── Pricing per 1K tokens (USD) ──────────────────────────────────────────────
MODEL_PRICING = {
    'gpt-4o':                          {'input': 0.005,    'output': 0.015},
    'gpt-4o-mini':                     {'input': 0.000150, 'output': 0.000600},
    'gpt-4-turbo':                     {'input': 0.010,    'output': 0.030},
    'gpt-4':                           {'input': 0.030,    'output': 0.060},
    'gpt-3.5-turbo':                   {'input': 0.0005,   'output': 0.0015},
    'claude-sonnet-4':                 {'input': 0.003,    'output': 0.015},
    'claude-sonnet-4-5-20250929':      {'input': 0.003,    'output': 0.015},
    'claude-haiku':                    {'input': 0.00025,  'output': 0.00125},
    'claude-haiku-4-5-20251001':       {'input': 0.00025,  'output': 0.00125},
}


def calc_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    pricing = MODEL_PRICING.get(model, MODEL_PRICING['gpt-4o-mini'])
    return (prompt_tokens / 1000 * pricing['input']) + (completion_tokens / 1000 * pricing['output'])


def _q(sql, params=None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            cols = [d[0] for d in cur.description] if cur.description else []
            rows = cur.fetchall() if cur.description else []
            return [dict(zip(cols, r)) for r in rows]
    finally:
        put_conn(conn)


def _exec(sql, params=None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            conn.commit()
            if cur.description:
                cols = [d[0] for d in cur.description]
                row = cur.fetchone()
                return dict(zip(cols, row)) if row else None
            return None
    finally:
        put_conn(conn)


@token_usage_bp.route('/api/token-usage/log', methods=['POST'])
def log_usage():
    data = request.get_json() or {}
    model = data.get('model', 'gpt-4o-mini')
    prompt_tokens = int(data.get('prompt_tokens', 0))
    completion_tokens = int(data.get('completion_tokens', 0))
    total_tokens = prompt_tokens + completion_tokens
    cost = calc_cost(model, prompt_tokens, completion_tokens)

    try:
        row = _exec("""
            INSERT INTO token_usage
                (source, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, session_id, context)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data.get('source', 'langly'), model,
            prompt_tokens, completion_tokens, total_tokens, cost,
            data.get('session_id', ''), data.get('context', ''),
        ))
        return jsonify({'ok': True, 'id': row['id'] if row else None, 'cost_usd': float(cost)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@token_usage_bp.route('/api/token-usage', methods=['GET'])
def get_usage():
    days = int(request.args.get('days', 30))
    try:
        totals = _q("""
            SELECT COUNT(*) as calls,
                   COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
                   COALESCE(SUM(completion_tokens), 0) as completion_tokens,
                   COALESCE(SUM(total_tokens), 0) as total_tokens,
                   COALESCE(SUM(cost_usd), 0) as total_cost
            FROM token_usage WHERE created_at >= NOW() - INTERVAL '%s days'
        """ % days)

        by_model = _q("""
            SELECT model, COUNT(*) as calls,
                   COALESCE(SUM(total_tokens), 0) as tokens,
                   COALESCE(SUM(cost_usd), 0) as cost
            FROM token_usage WHERE created_at >= NOW() - INTERVAL '%s days'
            GROUP BY model ORDER BY cost DESC
        """ % days)

        daily = _q("""
            SELECT DATE(created_at AT TIME ZONE 'America/New_York') as date,
                   COALESCE(SUM(total_tokens), 0) as tokens,
                   COALESCE(SUM(cost_usd), 0) as cost
            FROM token_usage WHERE created_at >= NOW() - INTERVAL '14 days'
            GROUP BY date ORDER BY date ASC
        """)

        by_source = _q("""
            SELECT source, COUNT(*) as calls,
                   COALESCE(SUM(total_tokens), 0) as tokens,
                   COALESCE(SUM(cost_usd), 0) as cost
            FROM token_usage WHERE created_at >= NOW() - INTERVAL '%s days'
            GROUP BY source ORDER BY cost DESC
        """ % days)

        recent = _q("""
            SELECT id, source, model, prompt_tokens, completion_tokens,
                   total_tokens, cost_usd, context, created_at
            FROM token_usage ORDER BY created_at DESC LIMIT 20
        """)

        t = totals[0] if totals else {}
        return jsonify({
            'period_days': days,
            'totals': {
                'calls': int(t.get('calls', 0)),
                'prompt_tokens': int(t.get('prompt_tokens', 0)),
                'completion_tokens': int(t.get('completion_tokens', 0)),
                'total_tokens': int(t.get('total_tokens', 0)),
                'total_cost': float(t.get('total_cost', 0)),
            },
            'by_model': [
                {'model': r['model'], 'calls': r['calls'], 'tokens': int(r['tokens']), 'cost': float(r['cost'])}
                for r in by_model
            ],
            'by_source': [
                {'source': r['source'], 'calls': r['calls'], 'tokens': int(r['tokens']), 'cost': float(r['cost'])}
                for r in by_source
            ],
            'daily': [
                {'date': str(r['date']), 'tokens': int(r['tokens']), 'cost': float(r['cost'])}
                for r in daily
            ],
            'recent': [
                {**r, 'cost_usd': float(r['cost_usd']),
                 'created_at': r['created_at'].isoformat() if r.get('created_at') else None}
                for r in recent
            ],
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@token_usage_bp.route('/api/token-usage/stats', methods=['GET'])
def get_stats():
    try:
        rows = _q("""
            SELECT
                COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 day'   THEN cost_usd  ELSE 0 END), 0) as today_cost,
                COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days'  THEN cost_usd  ELSE 0 END), 0) as week_cost,
                COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN cost_usd  ELSE 0 END), 0) as month_cost,
                COALESCE(SUM(cost_usd), 0) as all_time_cost,
                COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 day'   THEN total_tokens ELSE 0 END), 0) as today_tokens,
                COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN total_tokens ELSE 0 END), 0) as month_tokens
            FROM token_usage
        """)
        r = rows[0] if rows else {}
        return jsonify({
            'today':      {'cost': float(r.get('today_cost', 0)),     'tokens': int(r.get('today_tokens', 0))},
            'this_week':  {'cost': float(r.get('week_cost', 0))},
            'this_month': {'cost': float(r.get('month_cost', 0)),     'tokens': int(r.get('month_tokens', 0))},
            'all_time':   {'cost': float(r.get('all_time_cost', 0))},
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
