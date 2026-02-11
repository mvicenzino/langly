import { apiGet } from './client';
import type { StockData } from '../types/stocks';

export function fetchStock(ticker: string) {
  return apiGet<StockData>(`/api/stocks/${ticker}`);
}

export function fetchWatchlist(tickers: string[]) {
  return apiGet<StockData[]>(`/api/stocks/watchlist?tickers=${tickers.join(',')}`);
}
