import type { Category, Transaction } from '../types/finance';

export interface CategorySuggestion {
  category: Category;
  matchCount: number;
  matchedText: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function suggestCategory(
  transactions: Transaction[],
  type: 'expense' | 'income',
  title: string,
  options: Category[],
  minQueryLength = 3
): CategorySuggestion | null {
  const query = normalize(title);
  if (query.length < minQueryLength) return null;

  const allowed = new Set(options);
  const matches = transactions
    .filter((transaction) => {
      if (transaction.status !== 'Completed' || transaction.kind === 'transfer') return false;
      if (!allowed.has(transaction.category)) return false;
      return type === 'income'
        ? transaction.type === 'credit'
        : transaction.type === 'debit';
    })
    .map((transaction) => {
      const titleMatch = normalize(transaction.title);
      const counterpartyMatch = normalize(transaction.counterparty ?? '');
      const exact = titleMatch === query || counterpartyMatch === query;
      const partial = titleMatch.includes(query) || counterpartyMatch.includes(query);
      return { transaction, score: exact ? 2 : partial ? 1 : 0 };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (
        new Date(right.transaction.date).getTime() -
        new Date(left.transaction.date).getTime()
      );
    });

  const best = matches[0];
  if (!best) return null;

  const categoryMatches = matches.filter(
    (match) => match.transaction.category === best.transaction.category
  );

  return {
    category: best.transaction.category,
    matchCount: categoryMatches.length,
    matchedText:
      best.transaction.counterparty?.trim() ||
      best.transaction.title.trim() ||
      best.transaction.category,
  };
}
