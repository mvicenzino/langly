"""Stock data endpoints — calls yfinance directly for structured JSON."""
from flask import Blueprint, request, jsonify
import yfinance as yf

stocks_bp = Blueprint("stocks", __name__)


def _get_stock_data(ticker: str) -> dict:
    """Fetch stock data for a single ticker."""
    try:
        stock = yf.Ticker(ticker.upper())
        info = stock.info
        hist = stock.history(period="5d", interval="1h")

        price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose", 0)
        change = price - prev_close if price and prev_close else 0
        change_pct = (change / prev_close * 100) if prev_close else 0

        sparkline = hist["Close"].dropna().tolist()[-24:] if not hist.empty else []

        return {
            "ticker": ticker.upper(),
            "name": info.get("shortName", ticker.upper()),
            "price": round(price, 2) if price else None,
            "change": round(change, 2),
            "changePercent": round(change_pct, 2),
            "previousClose": round(prev_close, 2) if prev_close else None,
            "marketCap": info.get("marketCap"),
            "volume": info.get("volume"),
            "sparkline": [round(v, 2) for v in sparkline],
        }
    except Exception as e:
        return {"ticker": ticker.upper(), "error": str(e)}


@stocks_bp.route("/api/stocks/<ticker>")
def get_stock(ticker):
    data = _get_stock_data(ticker)
    if "error" in data:
        return jsonify(data), 404
    return jsonify(data)


@stocks_bp.route("/api/stocks/watchlist")
def get_watchlist():
    tickers_param = request.args.get("tickers", "AAPL,TSLA,GOOGL")
    tickers = [t.strip() for t in tickers_param.split(",") if t.strip()]
    results = [_get_stock_data(t) for t in tickers]
    return jsonify(results)
