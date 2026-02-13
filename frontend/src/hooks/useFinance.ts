import { useState, useEffect, useCallback } from 'react';
import { fetchAccounts, fetchTransactions, fetchBudgets } from '../api/finance';
import type { AccountsOverview, MonarchTransaction, BudgetOverview } from '../types/finance';

export function useFinance() {
  const [accounts, setAccounts] = useState<AccountsOverview | null>(null);
  const [transactions, setTransactions] = useState<MonarchTransaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [acct, txns, budg] = await Promise.all([
        fetchAccounts(),
        fetchTransactions(20),
        fetchBudgets(),
      ]);
      setAccounts(acct);
      setTransactions(txns);
      setBudgets(budg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch finance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 300000); // 5 min
    return () => clearInterval(interval);
  }, [refresh]);

  return { accounts, transactions, budgets, loading, error, refresh };
}
