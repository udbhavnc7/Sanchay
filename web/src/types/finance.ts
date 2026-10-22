export interface Transaction {
  id: string;
  orderId: string;
  title: string;
  category: 'Subscription' | 'Payroll' | 'Infrastructure' | 'Client Payment' | 'Equipment' | 'Travel';
  amount: number;
  type: 'credit' | 'debit';
  status: 'Completed' | 'Pending' | 'Flagged';
  date: string;
  recipient: string;
  avatar?: string;
  wallet: string;
}

export interface Contact {
  id: string;
  name: string;
  handle: string;
  type: 'Person' | 'Business';
  bank: string;
  initials: string;
  avatarColor: string;
  isFavorite: boolean;
  lastTransfer?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  icon: string;
  savedAmount: number;
  targetAmount: number;
  targetDate: string;
  color: string;
}

export interface Wallet {
  id: string;
  currency: string;
  symbol: string;
  balance: number;
  flag: string;
  status: 'Active' | 'Inactive';
  change: string;
}
