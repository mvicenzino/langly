"""Monarch Money service — async-to-sync bridge for Flask's threading context.

Singleton client with session persistence, in-memory caching, and auto-retry
on expired sessions.  Python 3.9 compatible.
"""
from __future__ import annotations

import asyncio
import os
import time
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from monarchmoney import MonarchMoney

# ── Config ────────────────────────────────────────────────────────────────────

SESSION_FILE = str(Path.home() / ".monarch_session")
CACHE_TTL = 300  # 5 minutes

# ── Singleton state ───────────────────────────────────────────────────────────

_client: Optional[MonarchMoney] = None
_lock = threading.Lock()
_cache: dict = {}


def _run(coro):
    """Run an async coroutine from sync Flask context."""
    return asyncio.run(coro)


def _get_client() -> MonarchMoney:
    """Return an authenticated MonarchMoney client (lazy init, session reuse)."""
    global _client
    if _client is not None:
        return _client

    mm = MonarchMoney()

    # Try loading a saved session first
    if os.path.exists(SESSION_FILE):
        try:
            mm.load_session(SESSION_FILE)
            _client = mm
            return _client
        except Exception:
            pass  # session expired or corrupt — fall through to login

    # Try login directly (works on Python with modern OpenSSL)
    email = os.getenv("MONARCH_EMAIL", "")
    password = os.getenv("MONARCH_PASSWORD", "")
    if not email or not password:
        raise RuntimeError(
            "No saved session at ~/.monarch_session and "
            "MONARCH_EMAIL/MONARCH_PASSWORD not set in .env"
        )

    try:
        _run(mm.login(email, password))
        mm.save_session(SESSION_FILE)
        _client = mm
        return _client
    except Exception:
        pass

    # Fallback: use Homebrew Python 3.13 for login (system Python 3.9 has old SSL)
    _relogin_via_python313(email, password)

    mm2 = MonarchMoney()
    mm2.load_session(SESSION_FILE)
    _client = mm2
    return _client


def _relogin_via_python313(email: str, password: str):
    """Shell out to Homebrew Python 3.13 to re-authenticate (modern OpenSSL)."""
    import subprocess
    py13 = "/opt/homebrew/bin/python3.13"
    if not os.path.exists(py13):
        raise RuntimeError(
            "Session expired and cannot re-login: system Python SSL too old, "
            "and Homebrew Python 3.13 not found at /opt/homebrew/bin/python3.13"
        )
    script = (
        "from monarchmoney import MonarchMoney; import asyncio, os; "
        "mm = MonarchMoney(); "
        f"asyncio.run(mm.login({email!r}, {password!r})); "
        f"mm.save_session({SESSION_FILE!r}); "
        "print('OK')"
    )
    result = subprocess.run([py13, "-c", script], capture_output=True, text=True, timeout=30)
    if result.returncode != 0 or "OK" not in result.stdout:
        raise RuntimeError(f"Re-login via Python 3.13 failed: {result.stderr}")


def _invalidate_client():
    """Clear the cached client so next call re-authenticates."""
    global _client
    _client = None
    try:
        os.remove(SESSION_FILE)
    except OSError:
        pass


def _cached(key: str, fetcher):
    """Return cached value or call fetcher, caching the result for CACHE_TTL seconds."""
    now = time.time()
    entry = _cache.get(key)
    if entry and now - entry["ts"] < CACHE_TTL:
        return entry["val"]
    val = fetcher()
    _cache[key] = {"val": val, "ts": now}
    return val


def _is_auth_error(exc: Exception) -> bool:
    """Check if the exception is an authentication/authorization error."""
    msg = str(exc).lower()
    return any(s in msg for s in ("401", "403", "unauthorized", "forbidden", "token"))


def _call(key: str, async_method, *args, **kwargs):
    """Thread-safe fetch with auto-retry on auth errors only."""
    with _lock:
        try:
            client = _get_client()
            return _cached(key, lambda: _run(async_method(client, *args, **kwargs)))
        except Exception as e:
            if not _is_auth_error(e):
                raise  # Don't retry on timeouts/network errors
            # Auth error — retry once after clearing session
            _invalidate_client()
            _cache.pop(key, None)
            client = _get_client()
            return _cached(key, lambda: _run(async_method(client, *args, **kwargs)))


# ── Async method wrappers (called via _call) ──────────────────────────────────

async def _fetch_accounts(client: MonarchMoney):
    return await client.get_accounts()


async def _fetch_transactions(client: MonarchMoney, limit: int = 50,
                               offset: int = 0,
                               start_date: Optional[str] = None,
                               end_date: Optional[str] = None):
    kwargs = {"limit": limit, "offset": offset}
    if start_date:
        kwargs["start_date"] = start_date
    if end_date:
        kwargs["end_date"] = end_date
    return await client.get_transactions(**kwargs)


async def _fetch_budgets(client: MonarchMoney, start_date: Optional[str] = None,
                          end_date: Optional[str] = None):
    # Monarch expects YYYY-MM-DD; default to current month
    if not start_date:
        now = datetime.now()
        start_date = now.replace(day=1).strftime("%Y-%m-%d")
    if not end_date:
        now = datetime.now()
        # Last day of current month
        if now.month == 12:
            end_date = now.replace(year=now.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = now.replace(month=now.month + 1, day=1) - timedelta(days=1)
        end_date = end_date.strftime("%Y-%m-%d")
    return await client.get_budgets(start_date=start_date, end_date=end_date)


async def _fetch_cashflow(client: MonarchMoney, start_date: Optional[str] = None,
                           end_date: Optional[str] = None):
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    return await client.get_cashflow(start_date=start_date, end_date=end_date)


async def _fetch_recurring(client: MonarchMoney):
    return await client.get_recurring_transactions()


async def _fetch_net_worth_history(client: MonarchMoney, start_date: str):
    return await client.get_account_snapshots_by_type(
        start_date=start_date, timeframe="month"
    )


async def _fetch_cashflow_summary(client: MonarchMoney, start_date: str,
                                   end_date: str):
    return await client.get_cashflow_summary(
        limit=100, start_date=start_date, end_date=end_date
    )


async def _fetch_spending_by_category(client: MonarchMoney, start_date: str,
                                       end_date: str):
    return await client.get_transactions(limit=500, start_date=start_date,
                                          end_date=end_date)


# ── Public API (sync, JSON-serializable) ──────────────────────────────────────

def get_accounts() -> dict:
    """Return accounts grouped by type with net worth summary."""
    raw = _call("accounts", _fetch_accounts)
    accounts = raw.get("accounts", [])

    by_type: dict = {}
    total_assets = 0.0
    total_liabilities = 0.0

    for acct in accounts:
        atype = acct.get("type", {})
        type_name = atype.get("display", "Other") if isinstance(atype, dict) else str(atype)
        balance = acct.get("currentBalance", 0) or 0

        entry = {
            "id": acct.get("id"),
            "name": acct.get("displayName", acct.get("name", "Unknown")),
            "balance": round(balance, 2),
            "institution": (acct.get("credential", {}) or {}).get("institution", {}).get("name", ""),
            "type": type_name,
            "subtype": acct.get("subtype", {}).get("display", "") if isinstance(acct.get("subtype"), dict) else "",
            "lastUpdated": acct.get("updatedAt", ""),
        }

        is_liability = acct.get("isAsset") is False or type_name.lower() in (
            "credit cards", "loan", "loans", "mortgage",
        )
        if is_liability:
            total_liabilities += abs(balance)
        else:
            total_assets += balance

        by_type.setdefault(type_name, []).append(entry)

    return {
        "netWorth": round(total_assets - total_liabilities, 2),
        "totalAssets": round(total_assets, 2),
        "totalLiabilities": round(total_liabilities, 2),
        "accountsByType": by_type,
    }


def get_transactions(limit: int = 50, offset: int = 0,
                     start_date: Optional[str] = None,
                     end_date: Optional[str] = None) -> list:
    """Return recent transactions as a flat list."""
    cache_key = f"txns:{limit}:{offset}:{start_date}:{end_date}"
    raw = _call(cache_key, _fetch_transactions, limit=limit, offset=offset,
                start_date=start_date, end_date=end_date)
    txns = raw.get("allTransactions", {}).get("results", [])

    return [
        {
            "id": t.get("id"),
            "date": t.get("date"),
            "merchant": (t.get("merchant", {}) or {}).get("name", t.get("plaidName", "")),
            "category": (t.get("category", {}) or {}).get("name", "Uncategorized"),
            "amount": round(t.get("amount", 0), 2),
            "account": (t.get("account", {}) or {}).get("displayName", ""),
            "isPending": t.get("pending", False),
            "notes": t.get("notes", ""),
        }
        for t in txns
    ]


def get_budgets(start_date: Optional[str] = None,
                end_date: Optional[str] = None) -> dict:
    """Return budget categories with spent vs. planned."""
    cache_key = f"budgets:{start_date}:{end_date}"
    raw = _call(cache_key, _fetch_budgets, start_date=start_date, end_date=end_date)

    budget_data = raw.get("budgetData", raw)
    # Handle different response shapes
    if isinstance(budget_data, dict):
        items = budget_data.get("budgetItems", budget_data.get("budget", []))
    else:
        items = []

    categories = []
    total_budgeted = 0.0
    total_spent = 0.0

    if isinstance(items, list):
        for item in items:
            planned = abs(item.get("budgetAmount", {}).get("amount", 0)
                         if isinstance(item.get("budgetAmount"), dict)
                         else item.get("plannedAmount", item.get("budgeted", 0)))
            actual = abs(item.get("actualAmount", {}).get("amount", 0)
                        if isinstance(item.get("actualAmount"), dict)
                        else item.get("actualAmount", item.get("spent", 0)))
            cat_name = (item.get("category", {}) or {}).get("name", "Unknown") if isinstance(item.get("category"), dict) else str(item.get("category", "Unknown"))

            if planned > 0:
                categories.append({
                    "category": cat_name,
                    "budgeted": round(planned, 2),
                    "spent": round(actual, 2),
                    "remaining": round(planned - actual, 2),
                    "percentUsed": round((actual / planned) * 100, 1) if planned else 0,
                })
                total_budgeted += planned
                total_spent += actual

    return {
        "totalBudgeted": round(total_budgeted, 2),
        "totalSpent": round(total_spent, 2),
        "totalRemaining": round(total_budgeted - total_spent, 2),
        "categories": sorted(categories, key=lambda c: c["percentUsed"], reverse=True),
    }


def get_cashflow(start_date: Optional[str] = None,
                 end_date: Optional[str] = None) -> dict:
    """Return income vs expenses summary."""
    cache_key = f"cashflow:{start_date}:{end_date}"
    raw = _call(cache_key, _fetch_cashflow, start_date=start_date, end_date=end_date)

    summary = raw.get("summary", [raw]) if isinstance(raw, dict) else [raw]
    first = summary[0] if summary else {}

    income = first.get("sumIncome", 0) or 0
    expenses = first.get("sumExpense", 0) or 0
    savings = first.get("savings", income - abs(expenses))

    return {
        "income": round(abs(income), 2),
        "expenses": round(abs(expenses), 2),
        "savings": round(savings, 2),
        "savingsRate": round((savings / abs(income)) * 100, 1) if income else 0,
    }


def get_recurring() -> list:
    """Return recurring transactions (subscriptions, bills)."""
    raw = _call("recurring", _fetch_recurring)

    items = raw if isinstance(raw, list) else raw.get("recurringTransactions", [])

    return [
        {
            "id": r.get("id"),
            "name": (r.get("merchant", {}) or {}).get("name", r.get("title", "Unknown")),
            "amount": round(abs(r.get("amount", 0)), 2),
            "frequency": r.get("frequency", "monthly"),
            "category": (r.get("category", {}) or {}).get("name", ""),
            "nextDate": r.get("nextExpectedDate", ""),
        }
        for r in items
    ]


def get_net_worth_history(months: int = 12) -> dict:
    """Return monthly net worth snapshots for trend chart."""
    start = (datetime.now() - timedelta(days=months * 31)).strftime("%Y-%m-01")
    cache_key = f"nw_history:{start}"
    raw = _call(cache_key, _fetch_net_worth_history, start_date=start)

    snapshots = raw.get("snapshotsByAccountType", [])
    liability_types = {"credit_card", "credit", "loan", "mortgage"}

    # Group by month
    by_month: dict = {}
    for s in snapshots:
        month = s.get("month", "")
        atype = s.get("accountType", "")
        bal = s.get("balance", 0) or 0
        if month not in by_month:
            by_month[month] = {"assets": 0.0, "liabilities": 0.0}
        if atype in liability_types:
            by_month[month]["liabilities"] += abs(bal)
        else:
            by_month[month]["assets"] += bal

    points = []
    for month in sorted(by_month.keys()):
        d = by_month[month]
        nw = d["assets"] - d["liabilities"]
        points.append({
            "month": month,
            "netWorth": round(nw, 2),
            "assets": round(d["assets"], 2),
            "liabilities": round(d["liabilities"], 2),
        })

    change = points[-1]["netWorth"] - points[0]["netWorth"] if len(points) >= 2 else 0

    return {
        "points": points,
        "currentNetWorth": points[-1]["netWorth"] if points else 0,
        "change": round(change, 2),
        "changePercent": round((change / points[0]["netWorth"]) * 100, 1) if points and points[0]["netWorth"] else 0,
    }


def get_spending_breakdown(months: int = 2) -> dict:
    """Return spending grouped by category for the given period."""
    start = (datetime.now() - timedelta(days=months * 31)).replace(day=1).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")
    cache_key = f"spending:{start}:{end}"
    raw = _call(cache_key, _fetch_spending_by_category, start_date=start, end_date=end)

    txns = raw.get("allTransactions", {}).get("results", [])

    by_cat: dict = {}
    total_spending = 0.0
    for t in txns:
        amount = t.get("amount", 0)
        if amount >= 0:
            continue  # skip income
        cat = (t.get("category", {}) or {}).get("name", "Uncategorized")
        if cat in ("Transfer", "Credit Card Payment"):
            continue  # skip transfers
        abs_amount = abs(amount)
        by_cat[cat] = by_cat.get(cat, 0) + abs_amount
        total_spending += abs_amount

    categories = []
    for cat, total in sorted(by_cat.items(), key=lambda x: -x[1]):
        categories.append({
            "category": cat,
            "amount": round(total, 2),
            "percent": round((total / total_spending) * 100, 1) if total_spending else 0,
        })

    return {
        "totalSpending": round(total_spending, 2),
        "categories": categories[:12],
        "period": f"{start} to {end}",
    }


def get_cashflow_trend(months: int = 6) -> dict:
    """Return monthly income vs expenses trend."""
    start = (datetime.now() - timedelta(days=months * 31)).replace(day=1).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")
    cache_key = f"cf_trend:{start}:{end}"

    # Get transactions and group by month
    raw = _call(cache_key, _fetch_spending_by_category, start_date=start, end_date=end)
    txns = raw.get("allTransactions", {}).get("results", [])

    by_month: dict = {}
    for t in txns:
        date_str = t.get("date", "")
        if not date_str:
            continue
        month = date_str[:7]  # YYYY-MM
        amount = t.get("amount", 0)
        cat = (t.get("category", {}) or {}).get("name", "")
        if cat in ("Transfer", "Credit Card Payment"):
            continue
        if month not in by_month:
            by_month[month] = {"income": 0.0, "expenses": 0.0}
        if amount > 0:
            by_month[month]["income"] += amount
        else:
            by_month[month]["expenses"] += abs(amount)

    points = []
    for month in sorted(by_month.keys()):
        d = by_month[month]
        points.append({
            "month": month,
            "income": round(d["income"], 2),
            "expenses": round(d["expenses"], 2),
            "savings": round(d["income"] - d["expenses"], 2),
        })

    return {"points": points}
