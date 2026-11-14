export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export type AccountType = 'Bank' | 'Cash' | 'Savings' | 'Card';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  openingBalance?: number;
  status: 'Active' | 'Inactive';
  change: number | string;
  flag?: string;
  symbol?: string;
  createdAt?: string;
}

export type Wallet = Account;

/** Built-in names or stable custom_ identifiers; labels live in CategoryDefinition. */
export type Category = string;

export interface CategoryDefinition {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  archived?: boolean;
  builtIn?: boolean;
}

export type TxStatus = 'Completed' | 'Pending' | 'Failed' | 'Flagged';
export type TxKind = 'expense' | 'income' | 'transfer' | 'refund';

export interface Transaction {
  id: string;
  reference?: string;
  orderId?: string;
  title: string;
  category: Category;
  amount: number;
  currency?: Currency;
  type: 'credit' | 'debit';
  status: TxStatus;
  date: string;
  accountId?: string;
  counterparty?: string;
  recipient?: string;
  note?: string;
  kind?: TxKind;
  fee?: number;
  wallet?: string;
  goalId?: string;
  paymentAttemptId?: string;
  userReference?: string;
  transferId?: string;
  transferRate?: number;
  refundOfId?: string;
  tags?: string[];
  plannedOccurrenceKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  name: string;
  handle: string;
  type: 'Person' | 'Business';
  bank: string;
  accountNumber?: string;
  upiId?: string;
  currency?: Currency;
  initials: string;
  avatarColor: string;
  isFavorite: boolean;
  lastTransfer?: string;
  archived?: boolean;
}

export type GoalIcon = 'laptop' | 'plane' | 'shield' | 'car' | 'gift' | string;

export interface SavingsGoal {
  id: string;
  title: string;
  icon: GoalIcon;
  savedAmount: number;
  targetAmount: number;
  targetDate: string;
  color: string;
  status?: 'active' | 'paused' | 'completed' | 'archived';
  note?: string;
}

export interface BudgetPeriod {
  id: string;
  limit: number;
  /** First day of the month this limit applies from (YYYY-MM-01). */
  effectiveFrom: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  color: string;
  /** Optional so legacy stored budgets without history keep working. */
  history?: BudgetPeriod[];
  archived?: boolean;
}

export interface RecurrenceRule {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
}

export interface PlannedPayment {
  id: string;
  title: string;
  amount: number;
  direction: 'in' | 'out';
  dueDate: string;
  category: Category;
  accountId?: string;
  note?: string;
  recurrence?: RecurrenceRule;
  paused?: boolean;
  skippedDates?: string[];
  currency?: Currency;
}

export type PaymentAttemptStatus =
  | 'prepared'
  | 'needs_reconciliation'
  | 'marked_paid_by_user'
  | 'cancelled_or_failed';

export interface PaymentAttempt {
  id: string;
  payeeId: string;
  payeeName: string;
  upiId: string;
  amount: number;
  currency: Currency;
  accountId: string;
  category: Category;
  note?: string;
  status: PaymentAttemptStatus;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
  userReference?: string;
}

export interface PaymentInput {
  payee: Contact;
  amount: number;
  accountId: string;
  category: Category;
  note?: string;
}

export interface PaymentAttemptInput {
  payee: Contact;
  upiId: string;
  amount: number;
  accountId: string;
  category: Category;
  note?: string;
}

export interface PaymentAttemptResult {
  ok: boolean;
  error?: string;
  attempt?: PaymentAttempt;
  transaction?: Transaction;
  duplicate?: boolean;
}

export interface GoalDepositInput {
  goalId: string;
  amount: number;
  accountId: string;
}

export interface NewTransactionInput {
  type: 'expense' | 'income';
  title: string;
  category: Category;
  amount: number;
  accountId: string;
  date: string;
  note?: string;
  tags?: string[];
}

export interface UpdateTransactionInput extends NewTransactionInput {
  id: string;
}

export interface MoneyResult {
  ok: boolean;
  error?: string;
  transaction?: Transaction;
}

export type PreferredUpiApp =
  | 'Google Pay'
  | 'PhonePe'
  | 'Paytm'
  | 'BHIM'
  | 'Cred'
  | 'Navi'
  | 'Other';

export interface UserProfile {
  name: string;
  email: string;
  upiId?: string;
  preferredUpiApp?: PreferredUpiApp;
  avatarColor?: string;
}

export interface ConnectAccountInput {
  name: string;
  type: Account['type'];
  currency: Currency;
  balance: number;
  openingBalance?: number;
  status?: Account['status'];
}
