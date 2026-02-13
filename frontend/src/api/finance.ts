import { apiGet } from './client';
import type { AccountsOverview, MonarchTransaction, BudgetOverview, CashflowSummary, RecurringItem, NetWorthHistory, SpendingBreakdown, CashflowTrend } from '../types/finance';

export function fetchAccounts() {
  return apiGet<AccountsOverview>('/api/finance/accounts');
}

export function fetchTransactions(limit = 50, offset = 0, startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  return apiGet<MonarchTransaction[]>(`/api/finance/transactions?${params}`);
}

export function fetchBudgets(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const qs = params.toString();
  return apiGet<BudgetOverview>(`/api/finance/budgets${qs ? `?${qs}` : ''}`);
}

export function fetchCashflow(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const qs = params.toString();
  return apiGet<CashflowSummary>(`/api/finance/cashflow${qs ? `?${qs}` : ''}`);
}

export function fetchRecurring() {
  return apiGet<RecurringItem[]>('/api/finance/recurring');
}

export function fetchNetWorthHistory(months = 12) {
  return apiGet<NetWorthHistory>(`/api/finance/net-worth-history?months=${months}`);
}

export function fetchSpendingBreakdown(months = 2) {
  return apiGet<SpendingBreakdown>(`/api/finance/spending-breakdown?months=${months}`);
}

export function fetchCashflowTrend(months = 6) {
  return apiGet<CashflowTrend>(`/api/finance/cashflow-trend?months=${months}`);
}
