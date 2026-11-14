import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Account, CategoryDefinition, Transaction } from '../types/finance';
import { ActivityTab } from '../components/ActivityTab';
import { OverviewTab } from '../components/OverviewTab';
import { ReportsTab } from '../components/ReportsTab';
import { SearchOverlay } from '../components/SearchOverlay';
import { buildSafeToSpend } from './safeToSpend';
import * as reporting from './reporting';
import { addTransaction, createTransfer, recordRefund, type LedgerState } from './ledgerOps';
import {
  buildStatementCsv,
  computeCategoryBreakdown,
  computeCategorySpending,
  computePayeeBreakdown,
  computeReportTotals,
  reportCurrencies,
  reportsAccountMap,
  scopeToCurrency,
  transactionCurrency,
} from './reporting';

const NOW = new Date('2026-11-10T10:00:00');

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc1',
    name: 'HDFC',
    type: 'Bank',
    currency: 'INR',
    balance: 100000,
    openingBalance: 100000,
    status: 'Active',
    change: '+0%',
    ...overrides,
  };
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx_${Math.random().toString(36).slice(2, 8)}`,
    title: 'Sample',
    category: 'Groceries',
    amount: 100,
    type: 'debit',
    status: 'Completed',
    date: '2026-11-05T12:00:00.000Z',
    kind: 'expense',
    ...overrides,
  };
}

function stateWith(
  accounts: Account[],
  transactions: Transaction[] = []
): LedgerState {
  return { accounts, transactions, goals: [] };
}

describe('reporting totals reconcile with ledger operations', () => {
  it('does not count internal account transfers as goal savings or consumption', () => {
    const main = account();
    const savings = account({ id: 'acc2', name: 'Savings', type: 'Savings' });
    let state = stateWith([main, savings]);

    const expense = addTransaction(
      state,
      {
        type: 'expense',
        title: 'Groceries',
        category: 'Groceries',
        amount: 500,
        accountId: main.id,
        date: '2026-11-05',
      },
      NOW
    );
    expect(expense.ok).toBe(true);
    if (!expense.ok) return;
    state = expense.state;

    const income = addTransaction(
      state,
      {
        type: 'income',
        title: 'Salary',
        category: 'Income',
        amount: 2000,
        accountId: main.id,
        date: '2026-11-01',
      },
      NOW
    );
    expect(income.ok).toBe(true);
    if (!income.ok) return;
    state = income.state;

    const transfer = createTransfer(
      state,
      {
        fromAccountId: main.id,
        toAccountId: savings.id,
        amount: 1000,
        date: '2026-11-06',
      },
      NOW
    );
    expect(transfer.ok).toBe(true);
    if (!transfer.ok) return;
    state = transfer.state;

    const totals = computeReportTotals(state.transactions, 'INR');
    expect(totals).toEqual({ income: 2000, spending: 500, saved: 0, net: 1500 });

    const mainAccount = state.accounts.find((item) => item.id === main.id);
    expect(mainAccount?.balance).toBe(100000 - 500 + 2000 - 1000);
  });

  it('nets refunds against spending and ignores non-completed entries', () => {
    const main = account();
    const original = tx({ id: 'original', amount: 900, accountId: main.id });
    const pending = tx({ amount: 400, status: 'Pending', accountId: main.id });
    const failed = tx({ amount: 700, status: 'Failed', accountId: main.id });

    const state = stateWith([main], [original, pending, failed]);
    const result = recordRefund(state, { originalTransactionId: 'original', amount: 300 }, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const totals = computeReportTotals(result.state.transactions, 'INR');
    expect(totals.spending).toBe(600);
    expect(totals.income).toBe(0);
  });

  it('excludes transfer legs from income and spending', () => {
    const totals = computeReportTotals(
      [
        tx({ kind: 'transfer', type: 'debit', amount: 400 }),
        tx({ kind: 'transfer', type: 'credit', amount: 400 }),
      ],
      'INR'
    );
    expect(totals).toEqual({ income: 0, spending: 0, saved: 0, net: 0 });
  });

  it('csv export covers every ledger row and carries the account currency', () => {
    const main = account();
    const euro = account({ id: 'acc3', name: 'Revolut', currency: 'EUR' });
    const rows = [
      tx({ id: 'a', title: 'Lunch, "team"', amount: 12.5, accountId: main.id }),
      tx({ id: 'b', title: 'Museum', amount: 30, accountId: euro.id, currency: 'EUR' }),
    ];
    const csv = buildStatementCsv(rows, reportsAccountMap([main, euro]));
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('"Currency"');
    expect(lines[1]).toContain('"INR"');
    expect(lines[1]).toContain('"Lunch, ""team"""');
    expect(lines[2]).toContain('"EUR"');
    expect(lines[2]).toContain('"Revolut (EUR)"');
  });
});

describe('multi-currency isolation', () => {
  const main = account();
  const usd = account({ id: 'acc2', name: 'USD Checking', currency: 'USD' });
  const accountsById = reportsAccountMap([main, usd]);

  const rows = [
    tx({ id: 'inr1', amount: 500, accountId: main.id }),
    tx({ id: 'inr2', amount: 250, type: 'credit', kind: 'income', accountId: main.id }),
    tx({ id: 'usd1', amount: 100, accountId: usd.id }),
    tx({ id: 'usd2', amount: 40, type: 'credit', kind: 'income', accountId: usd.id }),
  ];

  it('detects every currency present', () => {
    expect(reportCurrencies(rows, accountsById)).toEqual(['INR', 'USD']);
  });

  it('never mixes amounts across currencies', () => {
    const inr = scopeToCurrency(rows, accountsById, 'INR');
    const usdRows = scopeToCurrency(rows, accountsById, 'USD');
    expect(inr).toHaveLength(2);
    expect(usdRows).toHaveLength(2);
    expect(computeReportTotals(inr, 'INR').spending).toBe(500);
    expect(computeReportTotals(usdRows, 'USD').spending).toBe(100);
  });

  it('prefers an explicit transaction currency over the account currency', () => {
    const explicit = tx({ currency: 'GBP', accountId: main.id });
    expect(transactionCurrency(explicit, accountsById)).toBe('GBP');
    expect(transactionCurrency(rows[0], accountsById)).toBe('INR');
    expect(transactionCurrency(tx({ accountId: undefined }), accountsById)).toBe('INR');
  });

  it('keeps category and payee breakdowns currency-scoped', () => {
    const inrCategories = computeCategoryBreakdown(
      scopeToCurrency(rows, accountsById, 'INR'),
      'INR'
    );
    expect(inrCategories).toEqual([{ category: 'Groceries', amount: 500, pct: 100 }]);

    const usdPayees = computePayeeBreakdown(scopeToCurrency(rows, accountsById, 'USD'), 'USD');
    expect(usdPayees).toHaveLength(1);
    expect(usdPayees[0].amount).toBe(100);
  });
});

const definitions: CategoryDefinition[] = [
  { id: 'custom_care', name: 'Pet care', type: 'expense', color: '#123456', icon: 'heart', archived: true },
];

describe('statement safety and metadata', () => {
  it.each(['=SUM(1,2)', '+cmd', '-cmd', '@SUM(A1)', '\tformula', '\rformula', '\nformula', '  =formula'])('neutralizes spreadsheet text %j', (value) => {
    const csv = buildStatementCsv([tx({ title: value, reference: value, counterparty: value, note: value, category: value })], reportsAccountMap([account({ name: value })]));
    expect(csv).toContain(`"'${value.replace(/"/g, '""')}"`);
    expect(csv).not.toContain(`,"${value.replace(/"/g, '""')}",`);
  });

  it('exports currency-specific minor digits without rounding decimal currencies away', () => {
    const csv = buildStatementCsv([tx({ amount: 1250, currency: 'JPY' }), tx({ amount: 12.34, currency: 'USD' })], new Map());
    expect(csv).toContain('"1250","JPY"');
    expect(csv).toContain('"12.34","USD"');
  });

  it('exports category labels and optional formula-safe tags without changing IDs', () => {
    const row = tx({ category: 'custom_care', tags: ['=danger', 'vet, annual'] });
    const csv = buildStatementCsv([row], new Map(), { categoryDefinitions: definitions });
    expect(csv).toContain('"Pet care"');
    expect(csv).toContain('"Tags"');
    expect(csv).toContain('"\'=danger; vet, annual"');
    expect(buildStatementCsv([row], new Map(), { includeTags: false })).not.toContain('"Tags"');
    expect(row.category).toBe('custom_care');
    expect(row.tags).toEqual(['=danger', 'vet, annual']);
  });
});

describe('display regression coverage', () => {
  const noop = () => {};
  const accounts = [account(), account({ id: 'usd', currency: 'USD', name: 'Dollar account' })];
  const date = new Date().toISOString();
  const rows = [
    tx({ id: 'income', title: 'Local income', kind: 'income', type: 'credit', amount: 1000, accountId: 'acc1', date }),
    tx({ id: 'expense', title: 'Vet visit', category: 'custom_care', amount: 300, accountId: 'acc1', date }),
    tx({ id: 'refund', title: 'Vet refund', category: 'custom_care', kind: 'refund', type: 'credit', amount: 100, accountId: 'acc1', date }),
    tx({ id: 'goal', title: 'Goal contribution', kind: 'transfer', goalId: 'goal1', category: 'Savings', amount: 50, accountId: 'acc1', date }),
    tx({ id: 'move-out', kind: 'transfer', category: 'Savings', amount: 400, accountId: 'acc1', date }),
    tx({ id: 'move-in', kind: 'transfer', type: 'credit', category: 'Savings', amount: 400, accountId: 'acc1', date }),
    tx({ id: 'usd', title: 'Foreign purchase', currency: 'USD', amount: 999, accountId: 'acc1', date }),
  ];

  it('defaults Activity totals and list to INR, nets refunds and counts only goal debits', () => {
    const html = renderToStaticMarkup(createElement(ActivityTab, { accounts, transactions: rows, categoryDefinitions: definitions, onAddTransaction: noop, onSelectTransaction: noop }));
    expect(html).not.toContain('Foreign purchase');
    expect(html).toContain('₹1,000.00');
    expect(html).toContain('₹200.00');
    expect(html).toContain('₹50.00');
    expect(html).toContain('Pet care');
    expect(html).toContain('aria-label="Activity currency"');
    expect(html).toMatch(/\+₹100\.00/);
    expect(html).toMatch(/\+₹400\.00/);
  });

  it('renders Overview monthly income, category net spending and goal contributions in INR', () => {
    const html = renderToStaticMarkup(createElement(OverviewTab, {
      accounts, transactions: [...rows, tx({ title: 'Foreign income', kind: 'income', type: 'credit', amount: 800, currency: 'USD', date })],
      categoryDefinitions: definitions, budgets: [], goals: [], monthlySpent: 200, monthlyBudget: 1000,
      remainingBudget: 800, availableBalance: 100000, goalBalance: 50, freeToSpend: 99200,
      safeToSpend: buildSafeToSpend({ availableBalance: 100000, remainingBudget: 800, goals: [], plannedPayments: [] }),
      safeToSpendBuffer: 0, whatIfOutflow: 0, netWorth: 100050,
      onOpenPayees: noop, onOpenPlan: noop, onOpenActivity: noop, onRequestMoney: noop,
      onAddTransaction: noop, onSelectTransaction: noop, onSafeToSpendBufferChange: noop, onWhatIfOutflowChange: noop,
    }));
    expect(html).toContain('₹1,000.00');
    expect(html).not.toContain('₹1,800.00');
    expect(html).toContain('₹50.00 added this month');
    expect(html).toContain('Pet care');
    expect(html).toContain('$800.00');
    expect(html).toContain('1 active INR accounts');
  });

  it('renders report trends with refunds reducing spending instead of inflating income', () => {
    const html = renderToStaticMarkup(createElement(ReportsTab, { accounts, transactions: rows, categoryDefinitions: definitions, onSelectTransaction: noop }));
    expect(html).toContain('title="Income ₹1,000.00"');
    expect(html).toContain('title="Spending ₹200.00"');
    expect(html).toContain('Pet care');
    expect(html).toContain('$999.00');
  });

  it('renders search refunds and incoming transfers with credit signs and explicit transaction currency', () => {
    const html = renderToStaticMarkup(createElement(SearchOverlay, { open: true, accounts, transactions: [rows[2], rows[5], rows[6]], contacts: [], goals: [], categoryDefinitions: definitions, onClose: noop, onNavigate: noop, onSelectTransaction: noop }));
    expect(html).toContain('+₹100.00');
    expect(html).toContain('+₹400.00');
    expect(html).toContain('−$999.00');
    expect(html).toContain('Pet care');
  });

  it('searches readable archived categories and tags while preserving original transactions', () => {
    expect(reporting).toHaveProperty('transactionMatchesSearch');
    const row = tx({ category: 'custom_care', tags: ['annual-checkup'] });
    expect(reporting.transactionMatchesSearch(row, 'PET CARE', new Map(), definitions)).toBe(true);
    expect(reporting.transactionMatchesSearch(row, 'checkup', new Map(), definitions)).toBe(true);
    expect(reporting.transactionMatchesSearch(row, 'unrelated', new Map(), definitions)).toBe(false);
    expect(row.category).toBe('custom_care');
  });
});

describe('breakdown math', () => {
  it('counts only completed goal contribution debits as saved', () => {
    const totals = computeReportTotals([
      tx({ kind: 'transfer', goalId: 'goal', amount: 100 }),
      tx({ kind: 'transfer', goalId: 'goal', type: 'credit', amount: 100 }),
      tx({ kind: 'transfer', amount: 400 }),
      tx({ kind: 'transfer', goalId: 'goal', amount: 50, status: 'Pending' }),
    ]);
    expect(totals).toEqual({ income: 0, spending: 0, saved: 100, net: -100 });
  });

  it('nets payee refunds without treating them as another payment', () => {
    expect(computePayeeBreakdown([
      tx({ counterparty: 'Vet', amount: 300 }),
      tx({ counterparty: 'Vet', amount: 100, kind: 'refund', type: 'credit' }),
    ])).toEqual([{ name: 'Vet', amount: 200, count: 1 }]);
  });
  it('computes category percentages within the active currency', () => {
    const rows = [
      tx({ category: 'Dining', amount: 300 }),
      tx({ category: 'Groceries', amount: 100 }),
      tx({ category: 'Dining', amount: 100 }),
    ];
    const slices = computeCategoryBreakdown(rows, 'INR');
    expect(slices[0]).toEqual({ category: 'Dining', amount: 400, pct: 80 });
    expect(slices[1]).toEqual({ category: 'Groceries', amount: 100, pct: 20 });
  });

  it('nets refunds into category spending and drops categories that net to zero', () => {
    const rows = [
      tx({ category: 'Dining', amount: 300 }),
      tx({ category: 'Groceries', amount: 500 }),
      tx({ category: 'Groceries', amount: 500, type: 'credit', kind: 'refund' }),
      tx({ category: 'Dining', amount: 100, kind: 'transfer' }),
    ];
    const spending = computeCategorySpending(rows, 'INR');
    expect(spending.get('Dining')).toBe(300);
    expect(spending.get('Groceries')).toBe(0);
    expect(computeCategoryBreakdown(rows, 'INR')).toEqual([
      { category: 'Dining', amount: 300, pct: 100 },
    ]);
  });

  it('respects minor-unit precision for zero-decimal currencies', () => {
    const totals = computeReportTotals(
      [
        tx({ amount: 1000, currency: 'JPY' }),
        tx({ amount: 250, currency: 'JPY' }),
      ],
      'JPY'
    );
    expect(totals.spending).toBe(1250);
    expect(Number.isInteger(totals.spending)).toBe(true);
  });

  it('ignores transfers in payee groupings', () => {
    const payees = computePayeeBreakdown(
      [
        tx({ counterparty: 'Amazon', amount: 200 }),
        tx({ counterparty: 'Self', amount: 900, kind: 'transfer' }),
        tx({ counterparty: 'Amazon', amount: 50 }),
      ],
      'INR'
    );
    expect(payees).toEqual([{ name: 'Amazon', amount: 250, count: 2 }]);
  });
});
