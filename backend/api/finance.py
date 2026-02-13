"""Personal finance endpoints — Monarch Money integration."""
from __future__ import annotations

from flask import Blueprint, request, jsonify

finance_bp = Blueprint("finance", __name__)


def _get_service():
    """Lazy import to avoid startup failure if creds aren't set."""
    from backend.services.monarch_service import (
        get_accounts, get_transactions, get_budgets, get_cashflow, get_recurring,
    )
    return get_accounts, get_transactions, get_budgets, get_cashflow, get_recurring


@finance_bp.route("/api/finance/accounts")
def accounts():
    try:
        get_accounts, *_ = _get_service()
        data = get_accounts()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@finance_bp.route("/api/finance/transactions")
def transactions():
    try:
        _, get_transactions, *_ = _get_service()
        limit = request.args.get("limit", 50, type=int)
        offset = request.args.get("offset", 0, type=int)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        data = get_transactions(limit=limit, offset=offset,
                                start_date=start_date, end_date=end_date)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@finance_bp.route("/api/finance/budgets")
def budgets():
    try:
        *_, get_budgets, _, _ = _get_service()
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        data = get_budgets(start_date=start_date, end_date=end_date)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@finance_bp.route("/api/finance/cashflow")
def cashflow():
    try:
        *_, get_cashflow, _ = _get_service()
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        data = get_cashflow(start_date=start_date, end_date=end_date)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@finance_bp.route("/api/finance/recurring")
def recurring():
    try:
        *_, get_recurring = _get_service()
        data = get_recurring()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@finance_bp.route("/api/finance/net-worth-history")
def net_worth_history():
    try:
        from backend.services.monarch_service import get_net_worth_history
        months = request.args.get("months", 12, type=int)
        data = get_net_worth_history(months=months)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@finance_bp.route("/api/finance/spending-breakdown")
def spending_breakdown():
    try:
        from backend.services.monarch_service import get_spending_breakdown
        months = request.args.get("months", 2, type=int)
        data = get_spending_breakdown(months=months)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@finance_bp.route("/api/finance/cashflow-trend")
def cashflow_trend():
    try:
        from backend.services.monarch_service import get_cashflow_trend
        months = request.args.get("months", 6, type=int)
        data = get_cashflow_trend(months=months)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
