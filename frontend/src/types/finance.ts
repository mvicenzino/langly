export interface MonarchAccount {
  id: string;
  name: string;
  balance: number;
  institution: string;
  type: string;
  subtype: string;
  lastUpdated: string;
}

export interface AccountsOverview {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  accountsByType: Record<string, MonarchAccount[]>;
}

export interface MonarchTransaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  account: string;
  isPending: boolean;
  notes: string;
}

export interface BudgetCategory {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface BudgetOverview {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  categories: BudgetCategory[];
}

export interface CashflowSummary {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  nextDate: string;
}

export interface NetWorthPoint {
  month: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface NetWorthHistory {
  points: NetWorthPoint[];
  currentNetWorth: number;
  change: number;
  changePercent: number;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percent: number;
}

export interface SpendingBreakdown {
  totalSpending: number;
  categories: SpendingCategory[];
  period: string;
}

export interface CashflowPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CashflowTrend {
  points: CashflowPoint[];
}
