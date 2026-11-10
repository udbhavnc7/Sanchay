import {
  initialAccounts,
  initialBudgets,
  initialContacts,
  initialGoals,
  initialPaymentAttempts,
  initialPlannedPayments,
  initialTransactions,
} from './mockData';
import type {
  Account,
  Budget,
  Contact,
  PaymentAttempt,
  PlannedPayment,
  SavingsGoal,
  Transaction,
} from '../types/finance';

/**
 * First-run data choice (release checklist: blank ledger is the normal path,
 * sample data is explicit opt-in and must stay labeled as fictional).
 */
export type FirstRunChoice = 'blank' | 'sample';

export interface LedgerSeed {
  accounts: Account[];
  transactions: Transaction[];
  contacts: Contact[];
  goals: SavingsGoal[];
  budgets: Budget[];
  plannedPayments: PlannedPayment[];
  paymentAttempts: PaymentAttempt[];
  demoMode: boolean;
}

const BLANK_SEED: LedgerSeed = {
  accounts: [],
  transactions: [],
  contacts: [],
  goals: [],
  budgets: [],
  plannedPayments: [],
  paymentAttempts: [],
  demoMode: false,
};

/**
 * Resolves the ledger a first-run choice (or a full reset) should apply.
 * - `blank`: zero records, demoMode false — the default, trustworthy starting point.
 * - `sample`: the fictional seed records, demoMode true so the UI can keep
 *   showing a persistent "sample data" indicator until the user leaves it.
 */
export function ledgerForChoice(choice: FirstRunChoice): LedgerSeed {
  if (choice === 'blank') {
    return { ...BLANK_SEED };
  }
  return {
    accounts: initialAccounts,
    transactions: initialTransactions,
    contacts: initialContacts,
    goals: initialGoals,
    budgets: initialBudgets,
    plannedPayments: initialPlannedPayments,
    paymentAttempts: initialPaymentAttempts,
    demoMode: true,
  };
}
