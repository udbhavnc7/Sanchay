export type Currency = 'INR' | 'USD' | 'EUR';

export type AccountType = 'Bank' | 'Cash' | 'Savings' | 'Card';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  status: 'Active' | 'Inactive';
  change: number;
}

export type Category =
  | 'Income'
  | 'Groceries'
  | 'Dining'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Health'
  | 'Rent'
  | 'Savings'
  | 'Other';

export type TxStatus = 'Completed' | 'Pending' | 'Failed';
export type TxKind = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  reference: string;
  title: string;
  category: Category;
  amount: number;
  type: 'credit' | 'debit';
  status: TxStatus;
  date: string;
  accountId: string;
  counterparty: string;
  note?: string;
  kind: TxKind;
  fee?: number;
}

export interface Contact {
  id: string;
  name: string;
  handle: string;
  type: 'Person' | 'Business';
  bank: string;
  accountNumber: string;
  currency: Currency;
  initials: string;
  avatarColor: string;
  isFavorite: boolean;
  lastTransfer?: string;
}

export type GoalIcon = 'laptop' | 'plane' | 'shield' | 'car' | 'gift';

export interface SavingsGoal {
  id: string;
  title: string;
  icon: GoalIcon;
  savedAmount: number;
  targetAmount: number;
  targetDate: string;
  color: string;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  color: string;
}

export interface PaymentInput {
  payee: Contact;
  amount: number;
  accountId: string;
  category: Category;
  note?: string;
}

export interface GoalDepositInput {
  goalId: string;
  amount: number;
  accountId: string;
}

export interface MoneyResult {
  ok: boolean;
  error?: string;
  transaction?: Transaction;
}
