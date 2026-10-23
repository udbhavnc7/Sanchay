import type {
  Account,
  Budget,
  Contact,
  PlannedPayment,
  SavingsGoal,
  Transaction,
} from '../types/finance';

const now = new Date();

function dayThisMonth(daysBeforeToday: number, hour = 12): string {
  const date = new Date(now);
  date.setDate(Math.max(1, now.getDate() - daysBeforeToday));
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function monthsAgo(months: number, day: number, hour = 12): string {
  const date = new Date(now.getFullYear(), now.getMonth() - months, day, hour, 0, 0, 0);
  return date.toISOString();
}

function daysFromNow(days: number, hour = 12): string {
  const date = new Date(now);
  date.setDate(now.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function paymentReference(prefix: string, seed: number): string {
  return `${prefix}-${String(seed).padStart(6, '0')}`;
}

export const initialAccounts: Account[] = [
  {
    id: 'a1',
    name: 'Everyday account',
    type: 'Bank',
    currency: 'INR',
    balance: 68450.75,
    status: 'Active',
    change: 4.2,
  },
  {
    id: 'a2',
    name: 'Salary account',
    type: 'Bank',
    currency: 'INR',
    balance: 142300,
    status: 'Active',
    change: 2.8,
  },
  {
    id: 'a3',
    name: 'Cash wallet',
    type: 'Cash',
    currency: 'INR',
    balance: 6400,
    status: 'Active',
    change: 0,
  },
  {
    id: 'a4',
    name: 'Travel card',
    type: 'Card',
    currency: 'USD',
    balance: 820.5,
    status: 'Inactive',
    change: -1.1,
  },
];

const currentMonthTransactions: Transaction[] = [
  {
    id: 'tx_001',
    reference: paymentReference('SAL', 101),
    title: 'Monthly salary',
    category: 'Income',
    amount: 85000,
    type: 'credit',
    status: 'Completed',
    date: dayThisMonth(3, 9),
    accountId: 'a2',
    counterparty: 'Northstar Technologies',
    kind: 'income',
  },
  {
    id: 'tx_002',
    reference: paymentReference('RNT', 102),
    title: 'Apartment rent',
    category: 'Rent',
    amount: 22000,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(5, 10),
    accountId: 'a2',
    counterparty: 'Landlord',
    kind: 'expense',
  },
  {
    id: 'tx_003',
    reference: paymentReference('GRC', 103),
    title: 'Weekly groceries',
    category: 'Groceries',
    amount: 4850,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(1, 18),
    accountId: 'a1',
    counterparty: 'BigBasket',
    kind: 'expense',
  },
  {
    id: 'tx_004',
    reference: paymentReference('DIN', 104),
    title: 'Dinner with friends',
    category: 'Dining',
    amount: 1240,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(0, 20),
    accountId: 'a3',
    counterparty: 'Green Leaf Café',
    kind: 'expense',
  },
  {
    id: 'tx_005',
    reference: paymentReference('TRN', 105),
    title: 'Metro card top-up',
    category: 'Transport',
    amount: 800,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(2, 8),
    accountId: 'a1',
    counterparty: 'City Metro',
    kind: 'expense',
  },
  {
    id: 'tx_006',
    reference: paymentReference('SHP', 106),
    title: 'Noise-cancelling headphones',
    category: 'Shopping',
    amount: 6999,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(4, 16),
    accountId: 'a1',
    counterparty: 'Croma',
    kind: 'expense',
  },
  {
    id: 'tx_007',
    reference: paymentReference('BIL', 107),
    title: 'Electricity bill',
    category: 'Bills',
    amount: 2340,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(6, 11),
    accountId: 'a2',
    counterparty: 'State Power Board',
    kind: 'expense',
  },
  {
    id: 'tx_008',
    reference: paymentReference('ENT', 108),
    title: 'Streaming subscription',
    category: 'Entertainment',
    amount: 649,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(7, 7),
    accountId: 'a1',
    counterparty: 'Netflix',
    kind: 'expense',
  },
  {
    id: 'tx_009',
    reference: paymentReference('HLT', 109),
    title: 'Pharmacy',
    category: 'Health',
    amount: 1120,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(8, 19),
    accountId: 'a1',
    counterparty: 'Apollo Pharmacy',
    kind: 'expense',
  },
  {
    id: 'tx_010',
    reference: paymentReference('FRB', 110),
    title: 'Freelance project',
    category: 'Income',
    amount: 12000,
    type: 'credit',
    status: 'Completed',
    date: dayThisMonth(9, 15),
    accountId: 'a1',
    counterparty: 'Pixel Studio',
    kind: 'income',
  },
  {
    id: 'tx_011',
    reference: paymentReference('AMZ', 111),
    title: 'Desk organiser',
    category: 'Shopping',
    amount: 3499,
    type: 'debit',
    status: 'Pending',
    date: dayThisMonth(0, 11),
    accountId: 'a1',
    counterparty: 'Amazon India',
    kind: 'expense',
  },
  {
    id: 'tx_012',
    reference: paymentReference('SAV', 112),
    title: 'Moved to Emergency fund',
    category: 'Savings',
    amount: 10000,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(10, 12),
    accountId: 'a1',
    counterparty: 'Emergency fund',
    note: 'Monthly savings transfer',
    kind: 'transfer',
  },
  {
    id: 'tx_013',
    reference: paymentReference('CFE', 113),
    title: 'Morning coffee',
    category: 'Dining',
    amount: 280,
    type: 'debit',
    status: 'Completed',
    date: dayThisMonth(0, 9),
    accountId: 'a3',
    counterparty: 'Blue Tokai',
    kind: 'expense',
  },
];

const history: Transaction[] = [];
const historyCategories = [
  { category: 'Groceries', counterparty: 'BigBasket', base: 7800, seed: 201 },
  { category: 'Dining', counterparty: 'Local restaurants', base: 3600, seed: 202 },
  { category: 'Transport', counterparty: 'City Metro', base: 1600, seed: 203 },
  { category: 'Shopping', counterparty: 'Amazon India', base: 4200, seed: 204 },
  { category: 'Bills', counterparty: 'Utilities', base: 2900, seed: 205 },
  { category: 'Entertainment', counterparty: 'Subscriptions', base: 950, seed: 206 },
] as const;

for (let month = 1; month <= 5; month += 1) {
  history.push({
    id: `tx_hist_salary_${month}`,
    reference: paymentReference('SAL', 300 + month),
    title: 'Monthly salary',
    category: 'Income',
    amount: 85000,
    type: 'credit',
    status: 'Completed',
    date: monthsAgo(month, 3, 9),
    accountId: 'a2',
    counterparty: 'Northstar Technologies',
    kind: 'income',
  });

  history.push({
    id: `tx_hist_rent_${month}`,
    reference: paymentReference('RNT', 310 + month),
    title: 'Apartment rent',
    category: 'Rent',
    amount: 22000,
    type: 'debit',
    status: 'Completed',
    date: monthsAgo(month, 5, 10),
    accountId: 'a2',
    counterparty: 'Landlord',
    kind: 'expense',
  });

  historyCategories.forEach((template, index) => {
    history.push({
      id: `tx_hist_${month}_${index}`,
      reference: paymentReference('HIS', 400 + month * 10 + index),
      title: `${template.category} spend`,
      category: template.category,
      amount: Math.round(template.base * (0.82 + ((month + index) % 4) * 0.09)),
      type: 'debit',
      status: 'Completed',
      date: monthsAgo(month, 8 + index, 12),
      accountId: index % 2 === 0 ? 'a1' : 'a2',
      counterparty: template.counterparty,
      kind: 'expense',
    });
  });
}

export const initialTransactions: Transaction[] = [
  ...currentMonthTransactions,
  ...history,
];

export const initialContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Ayesha Khan',
    handle: '@ayesha.k',
    type: 'Person',
    bank: 'HDFC Bank',
    accountNumber: '•••• 4410',
    currency: 'INR',
    initials: 'AK',
    avatarColor: 'from-amber-500 to-orange-600',
    isFavorite: true,
    lastTransfer: 'Yesterday · ₹1,200.00',
  },
  {
    id: 'c2',
    name: 'Rafiq Ahmed',
    handle: '@rafiq',
    type: 'Person',
    bank: 'ICICI Bank',
    accountNumber: '•••• 1189',
    currency: 'INR',
    initials: 'RA',
    avatarColor: 'from-blue-600 to-indigo-700',
    isFavorite: true,
    lastTransfer: '3 days ago · ₹2,500.00',
  },
  {
    id: 'c3',
    name: 'Pixel Studio',
    handle: 'pixelstudio.in',
    type: 'Business',
    bank: 'Axis Bank',
    accountNumber: '•••• 7731',
    currency: 'INR',
    initials: 'PS',
    avatarColor: 'from-fuchsia-600 to-pink-600',
    isFavorite: true,
    lastTransfer: '12 days ago · ₹12,000.00',
  },
  {
    id: 'c4',
    name: 'Tanvir Hasan',
    handle: '@tanvir.h',
    type: 'Person',
    bank: 'State Bank of India',
    accountNumber: '•••• 8912',
    currency: 'INR',
    initials: 'TH',
    avatarColor: 'from-emerald-500 to-teal-700',
    isFavorite: true,
    lastTransfer: '18 days ago · ₹750.00',
  },
  {
    id: 'c5',
    name: 'Nadia Islam',
    handle: '@nadia.i',
    type: 'Person',
    bank: 'Kotak Mahindra',
    accountNumber: '•••• 3012',
    currency: 'INR',
    initials: 'NI',
    avatarColor: 'from-rose-500 to-red-700',
    isFavorite: false,
    lastTransfer: '2 weeks ago · ₹3,000.00',
  },
  {
    id: 'c6',
    name: 'Green Leaf Café',
    handle: 'greenleaf.cafe',
    type: 'Business',
    bank: 'HDFC Bank',
    accountNumber: '•••• 3302',
    currency: 'INR',
    initials: 'GL',
    avatarColor: 'from-teal-400 to-emerald-600',
    isFavorite: false,
    lastTransfer: 'Today · ₹1,240.00',
  },
  {
    id: 'c7',
    name: 'Sora Media',
    handle: 'sora.media',
    type: 'Business',
    bank: 'ICICI Bank',
    accountNumber: '•••• 6092',
    currency: 'INR',
    initials: 'SM',
    avatarColor: 'from-purple-600 to-violet-800',
    isFavorite: false,
    lastTransfer: '1 month ago · ₹24,000.00',
  },
  {
    id: 'c8',
    name: 'Marcus Vance',
    handle: '@marcus.v',
    type: 'Person',
    bank: 'HSBC',
    accountNumber: '•••• 0921',
    currency: 'INR',
    initials: 'MV',
    avatarColor: 'from-slate-600 to-slate-900',
    isFavorite: false,
    lastTransfer: '28 days ago · ₹15,000.00',
  },
];

export const initialGoals: SavingsGoal[] = [
  {
    id: 'g1',
    title: 'New MacBook Pro',
    icon: 'laptop',
    savedAmount: 85000,
    targetAmount: 249900,
    targetDate: 'Jun 2027',
    color: '#ff5722',
  },
  {
    id: 'g2',
    title: 'Trip to Bali',
    icon: 'plane',
    savedAmount: 62000,
    targetAmount: 150000,
    targetDate: 'Aug 2027',
    color: '#38bdf8',
  },
  {
    id: 'g3',
    title: 'Emergency fund',
    icon: 'shield',
    savedAmount: 240000,
    targetAmount: 500000,
    targetDate: 'Dec 2027',
    color: '#10b981',
  },
  {
    id: 'g4',
    title: 'New car',
    icon: 'car',
    savedAmount: 120000,
    targetAmount: 800000,
    targetDate: 'Mar 2028',
    color: '#8b5cf6',
  },
  {
    id: 'g5',
    title: "Mum's birthday gift",
    icon: 'gift',
    savedAmount: 18000,
    targetAmount: 25000,
    targetDate: 'May 2027',
    color: '#ec4899',
  },
];

export const initialBudgets: Budget[] = [
  { id: 'b1', category: 'Groceries', limit: 12000, color: '#ff5722' },
  { id: 'b2', category: 'Dining', limit: 4000, color: '#f59e0b' },
  { id: 'b3', category: 'Transport', limit: 3000, color: '#38bdf8' },
  { id: 'b4', category: 'Shopping', limit: 9000, color: '#8b5cf6' },
  { id: 'b5', category: 'Bills', limit: 5000, color: '#10b981' },
  { id: 'b6', category: 'Entertainment', limit: 1500, color: '#ec4899' },
  { id: 'b7', category: 'Rent', limit: 22000, color: '#64748b' },
];

export const initialPlannedPayments: PlannedPayment[] = [
  {
    id: 'pp1',
    title: 'Monthly rent',
    amount: 22000,
    direction: 'out',
    dueDate: daysFromNow(5),
    category: 'Rent',
    accountId: 'a1',
    note: 'Recurring rent estimate',
  },
  {
    id: 'pp2',
    title: 'Internet bill',
    amount: 999,
    direction: 'out',
    dueDate: daysFromNow(9),
    category: 'Bills',
    accountId: 'a1',
  },
  {
    id: 'pp3',
    title: 'Salary credit',
    amount: 85000,
    direction: 'in',
    dueDate: daysFromNow(12),
    category: 'Income',
    accountId: 'a2',
    note: 'Expected, not guaranteed',
  },
];

export const initialWallets: Account[] = initialAccounts.map(a => ({
  ...a,
  flag: a.currency === 'USD' ? '🇺🇸' : a.currency === 'EUR' ? '🇪🇺' : '🇮🇳',
  symbol: a.currency === 'USD' ? '$' : a.currency === 'EUR' ? '€' : '₹',
}));
