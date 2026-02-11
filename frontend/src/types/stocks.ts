export interface StockData {
  ticker: string;
  name: string;
  price: number | null;
  change: number;
  changePercent: number;
  previousClose: number | null;
  marketCap: number | null;
  volume: number | null;
  sparkline: number[];
  error?: string;
}
