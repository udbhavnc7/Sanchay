import type { Account, Category, Transaction } from '../types/finance';

export interface TransactionTemplate {
  id: string;
  title: string;
  category: Category;
  amount: number;
  accountId: string;
}

export function buildRecentTemplates(
  transactions: Transaction[],
  accounts: Account[],
  type: 'expense' | 'income',
  limit = 3
): TransactionTemplate[] {
  const usableAccountIds = new Set(
    accounts
      .filter((account) => account.currency === 'INR' && account.status === 'Active')
      .map((account) => account.id)
  );
  const seen = new Set<string>();

  return [...transactions]
    .filter((transaction) => {
      if (!transaction.accountId || !usableAccountIds.has(transaction.accountId)) return false;
      if (transaction.status !== 'Completed' || transaction.kind === 'transfer') return false;
      return type === 'income' ? transaction.type === 'credit' : transaction.type === 'debit';
    })
    .sort((left, right) => {
      const byDate = new Date(right.date).getTime() - new Date(left.date).getTime();
      return Number.isNaN(byDate) ? 0 : byDate;
    })
    .filter((transaction) => {
      const title = transaction.title.trim() || transaction.category;
      const key = `${title.toLowerCase()}|${transaction.category}|${transaction.accountId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, Math.max(0, limit))
    .map((transaction) => ({
      id: transaction.id,
      title: transaction.title.trim() || transaction.category,
      category: transaction.category,
      amount: transaction.amount,
      accountId: transaction.accountId as string,
    }));
}
