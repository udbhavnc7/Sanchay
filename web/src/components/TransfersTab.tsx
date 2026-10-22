import React, { useEffect, useMemo, useState } from 'react';
import type { Account, Category, Contact, MoneyResult } from '../types/finance';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Send,
  ArrowRight,
  ArrowLeft,
  Star,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { formatMoney, initialsFromName, isValidAmount } from '../utils/money';

interface TransfersTabProps {
  contacts: Contact[];
  accounts: Account[];
  onSendPayment: (input: {
    payee: Contact;
    amount: number;
    accountId: string;
    category: Category;
    note?: string;
  }) => MoneyResult;
  onAddContact: (contact: Contact) => void;
  onToggleFavorite: (contactId: string) => void;
}

type Step = 'compose' | 'review' | 'result';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];
const PAYMENT_CATEGORIES: Category[] = [
  'Other',
  'Groceries',
  'Dining',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Rent',
];

export const TransfersTab: React.FC<TransfersTabProps> = ({
  contacts,
  accounts,
  onSendPayment,
  onAddContact,
  onToggleFavorite,
}) => {
  const [selectedContactId, setSelectedContactId] = useState(contacts[0]?.id ?? '');
  const [accountId, setAccountId] = useState('');
  const [amountInput, setAmountInput] = useState('1000');
  const [category, setCategory] = useState<Category>('Other');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<Step>('compose');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<MoneyResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'businesses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newContactName, setNewContactName] = useState('');
  const [newContactHandle, setNewContactHandle] = useState('');
  const [newContactBank, setNewContactBank] = useState('');
  const [newContactAccount, setNewContactAccount] = useState('');
  const [newContactType, setNewContactType] = useState<'Person' | 'Business'>('Person');
  const [newContactCurrency, setNewContactCurrency] = useState<'INR' | 'USD' | 'EUR'>('INR');
  const [formError, setFormError] = useState('');

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0],
    [contacts, selectedContactId]
  );

  const eligibleAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.status === 'Active' &&
          (!selectedContact || account.currency === selectedContact.currency)
      ),
    [accounts, selectedContact]
  );

  useEffect(() => {
    if (!eligibleAccounts.some((account) => account.id === accountId)) {
      setAccountId(eligibleAccounts[0]?.id ?? '');
    }
  }, [eligibleAccounts, accountId]);

  const selectedAccount = eligibleAccounts.find((account) => account.id === accountId);
  const parsedAmount = Number.parseFloat(amountInput);
  const amountValid = isValidAmount(parsedAmount);
  const insufficient =
    !!selectedAccount && amountValid && parsedAmount > selectedAccount.balance;

  const amountError = !amountValid
    ? 'Enter an amount greater than zero.'
    : insufficient && selectedAccount
      ? `Not enough money. ${selectedAccount.name} has ${formatMoney(
          selectedAccount.balance,
          selectedAccount.currency
        )}.`
      : '';

  const canReview = !!selectedContact && !!selectedAccount && !amountError;

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesSearch =
        !query ||
        contact.name.toLowerCase().includes(query) ||
        contact.handle.toLowerCase().includes(query) ||
        contact.bank.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (filterType === 'favorites') return contact.isFavorite;
      if (filterType === 'businesses') return contact.type === 'Business';
      return true;
    });
  }, [contacts, searchQuery, filterType]);

  const favorites = contacts.filter((contact) => contact.isFavorite);

  const resetFlow = (keepContact: boolean) => {
    setStep('compose');
    setResult(null);
    setIsSending(false);
    setCopied(false);
    setAmountInput('1000');
    setNote('');
    setCategory('Other');
    if (!keepContact) {
      setSelectedContactId(contacts[0]?.id ?? '');
    }
  };

  const handleSelectContact = (contact: Contact) => {
    sound.click();
    setSelectedContactId(contact.id);
    setStep('compose');
    setResult(null);
  };

  const handleContinue = () => {
    if (!canReview) return;
    sound.click();
    setStep('review');
  };

  const handleConfirm = () => {
    if (!selectedContact || !selectedAccount || !canReview || isSending) return;

    setIsSending(true);
    sound.click();

    window.setTimeout(() => {
      const paymentResult = onSendPayment({
        payee: selectedContact,
        amount: parsedAmount,
        accountId: selectedAccount.id,
        category,
        note,
      });

      setResult(paymentResult);
      setIsSending(false);
      setStep('result');

      if (paymentResult.ok) {
        sound.success();
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.65 },
          colors: ['#FF5722', '#10B981', '#38BDF8', '#F59E0B'],
        });
      }
    }, 550);
  };

  const handleCopyReference = async () => {
    const reference = result?.transaction?.reference;
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      sound.click();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCreateContact = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newContactName.trim();
    if (!name) {
      setFormError('Enter a name for this payee.');
      return;
    }

    const digits = newContactAccount.replace(/\D/g, '').slice(-4);
    const handleSeed = newContactHandle.trim();
    const handle = handleSeed
      ? handleSeed.startsWith('@') || handleSeed.includes('.')
        ? handleSeed
        : `@${handleSeed}`
      : `@${name.toLowerCase().replace(/\s+/g, '')}`;

    const newContact: Contact = {
      id: `c_${Date.now()}`,
      name,
      handle,
      type: newContactType,
      bank: newContactBank.trim() || 'Sanchay Pay',
      accountNumber: digits ? `•••• ${digits}` : '•••• 0000',
      currency: newContactCurrency,
      initials: initialsFromName(name) || 'CO',
      avatarColor: 'from-orange-500 to-amber-600',
      isFavorite: true,
      lastTransfer: 'No payments yet',
    };

    onAddContact(newContact);
    setSelectedContactId(newContact.id);
    setShowAddModal(false);
    setNewContactName('');
    setNewContactHandle('');
    setNewContactBank('');
    setNewContactAccount('');
    setNewContactType('Person');
    setNewContactCurrency('INR');
    setFormError('');
    sound.success();
  };

  if (!selectedContact) {
    return (
      <div className="glass-panel p-10 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No payees yet</h2>
        <p className="text-xs text-slate-400 mt-1">Add someone before sending money.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Payees
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose who to pay, review the details, then confirm.
          </p>
        </div>

        <button
          onClick={() => {
            sound.click();
            setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>Add payee</span>
        </button>
      </div>

      <div className="glass-panel p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Quick pay</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Your favourite payees, one tap away.
            </p>

            <div className="mt-6 flex items-center gap-4 flex-wrap">
              {favorites.map((contact) => {
                const isSelected = selectedContact.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm text-white transition-all duration-200 shadow-md ${
                        isSelected
                          ? 'ring-4 ring-orange-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 scale-110 shadow-orange-500/30'
                          : 'opacity-85 hover:opacity-100 hover:scale-105'
                      } bg-gradient-to-tr ${contact.avatarColor}`}
                    >
                      {contact.initials}
                    </div>
                    <span
                      className={`text-xs font-semibold truncate max-w-[70px] ${
                        isSelected
                          ? 'text-orange-500 dark:text-orange-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {contact.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  sound.click();
                  setShowAddModal(true);
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center text-slate-400 group-hover:border-orange-500 group-hover:text-orange-500 transition-all">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-400 group-hover:text-orange-500">
                  New
                </span>
              </button>
            </div>

            <div className="mt-8 p-4 rounded-3xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr ${selectedContact.avatarColor}`}
                >
                  {selectedContact.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">Paying</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedContact.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {selectedContact.bank} · {selectedContact.accountNumber}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Last payment
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {selectedContact.lastTransfer ?? 'No payments yet'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Payee currency
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {selectedContact.currency}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 text-[11px] text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>
                This is a prototype. No real money moves and no bank credentials are requested.
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="p-5 rounded-3xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 shadow-inner">
              {step === 'compose' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Amount
                    </label>
                    <div className="mt-1.5 flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5">
                      <div className="flex items-center gap-1 font-mono-numbers">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {selectedContact.currency === 'INR'
                            ? '₹'
                            : selectedContact.currency === 'USD'
                              ? '$'
                              : '€'}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={amountInput}
                          onChange={(event) => {
                            const next = event.target.value.replace(/[^0-9.]/g, '');
                            setAmountInput(next);
                          }}
                          className="text-2xl font-black text-slate-900 dark:text-white bg-transparent w-32 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        {selectedContact.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {PRESET_AMOUNTS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          sound.click();
                          setAmountInput(String(preset));
                        }}
                        className={`flex-1 py-1.5 rounded-full text-xs font-bold font-mono-numbers transition-all cursor-pointer ${
                          parsedAmount === preset
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                            : 'bg-white/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {formatMoney(preset, selectedContact.currency, { decimals: false })}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Pay from
                    </label>
                    <select
                      value={accountId}
                      onChange={(event) => {
                        sound.click();
                        setAccountId(event.target.value);
                      }}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {eligibleAccounts.length === 0 && <option value="">No eligible account</option>}
                      {eligibleAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} — {formatMoney(account.balance, account.currency)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(event) => {
                          sound.click();
                          setCategory(event.target.value as Category);
                        }}
                        className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {PAYMENT_CATEGORIES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Note (optional)
                      </label>
                      <input
                        type="text"
                        value={note}
                        maxLength={60}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="What is this for?"
                        className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {amountError && amountInput.trim() !== '' && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                      <span>{amountError}</span>
                    </div>
                  )}

                  {eligibleAccounts.length === 0 && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                      <span>
                        No active {selectedContact.currency} account is available for this payee.
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleContinue}
                    disabled={!canReview}
                    className="w-full py-3.5 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Review payment</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {step === 'review' && selectedAccount && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Review payment
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Step 2 of 3
                    </span>
                  </div>

                  <div className="text-center py-3">
                    <div className="text-3xl font-black font-mono-numbers text-slate-900 dark:text-white">
                      {formatMoney(parsedAmount, selectedAccount.currency)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      to {selectedContact.name}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 space-y-2.5 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">To</span>
                      <span className="font-bold text-slate-900 dark:text-white text-right">
                        {selectedContact.name}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {selectedContact.bank} · {selectedContact.accountNumber}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">From</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-right">
                        {selectedAccount.name}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {formatMoney(selectedAccount.balance, selectedAccount.currency)}{' '}
                          available
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {category}
                      </span>
                    </div>
                    {note.trim() && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Note</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-right">
                          {note.trim()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transfer fee</span>
                      <span className="font-bold text-emerald-500">₹0.00</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck size={13} className="shrink-0 mt-0.5" />
                    <span>
                      After this payment, {selectedAccount.name} will have{' '}
                      <strong>
                        {formatMoney(selectedAccount.balance - parsedAmount, selectedAccount.currency)}
                      </strong>
                      .
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        sound.click();
                        setStep('compose');
                      }}
                      disabled={isSending}
                      className="flex-1 py-3 rounded-2xl text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowLeft size={14} />
                      Back
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isSending}
                      className="flex-[1.4] py-3 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Confirm & send</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 'result' && result && (
                <div className="space-y-4">
                  {result.ok ? (
                    <>
                      <div className="text-center py-2">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                          <CheckCircle2 size={28} />
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                          Payment sent
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatMoney(parsedAmount, selectedAccount?.currency ?? 'INR')} to{' '}
                          {selectedContact.name}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-400">Reference</span>
                          <button
                            onClick={handleCopyReference}
                            className="flex items-center gap-1.5 font-mono-numbers font-bold text-slate-900 dark:text-white hover:text-orange-500 cursor-pointer"
                          >
                            {result.transaction?.reference}
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">From</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedAccount?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">New balance</span>
                          <span className="font-bold font-mono-numbers text-slate-900 dark:text-white">
                            {selectedAccount
                              ? formatMoney(
                                  Math.max(0, selectedAccount.balance - parsedAmount),
                                  selectedAccount.currency
                                )
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status</span>
                          <span className="font-bold text-emerald-500">Completed</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => resetFlow(true)}
                          className="flex-1 py-3 rounded-2xl text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 cursor-pointer"
                        >
                          Send again
                        </button>
                        <button
                          onClick={() => resetFlow(false)}
                          className="flex-1 py-3 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center py-2">
                        <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                          <AlertTriangle size={26} />
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                          Payment not sent
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 px-4">{result.error}</p>
                      </div>
                      <button
                        onClick={() => {
                          setStep('compose');
                          setResult(null);
                        }}
                        className="w-full py-3 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Edit payment
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { key: 'all', label: `All ${contacts.length}` },
                { key: 'favorites', label: `Favourites ${favorites.length}` },
                {
                  key: 'businesses',
                  label: `Businesses ${contacts.filter((contact) => contact.type === 'Business').length}`,
                },
              ] as const
            ).map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  sound.click();
                  setFilterType(filter.key);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterType === filter.key
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search payees…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-8 pr-4 py-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 w-48 sm:w-60"
            />
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No payees match that search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredContacts.map((contact) => {
              const isSelected = selectedContact.id === contact.id;
              return (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border transition-all flex flex-col justify-between group cursor-pointer relative ${
                    isSelected
                      ? 'border-orange-500/60 ring-1 ring-orange-500/30'
                      : 'border-slate-200/60 dark:border-white/5 hover:border-orange-500/40'
                  }`}
                >
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFavorite(contact.id);
                    }}
                    className={`absolute top-4 right-4 cursor-pointer transition-colors ${
                      contact.isFavorite
                        ? 'text-amber-400'
                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                    }`}
                    title={contact.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <Star size={13} fill={contact.isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  <div>
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-sm mb-3 bg-gradient-to-tr ${contact.avatarColor}`}
                    >
                      {contact.initials}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {contact.name}
                    </h3>
                    <div className="text-xs text-slate-400 truncate">{contact.handle}</div>

                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                        {contact.type === 'Business' ? <Building2 size={10} /> : <User size={10} />}
                        {contact.type}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200/50 dark:border-white/5 text-[11px] text-slate-400">
                    <div className="truncate">
                      {contact.bank} · {contact.accountNumber}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {contact.lastTransfer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Add a payee
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Store the details once, then pay in two taps.
            </p>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ayesha Khan"
                  value={newContactName}
                  onChange={(event) => setNewContactName(event.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Handle</label>
                  <input
                    type="text"
                    placeholder="@handle"
                    value={newContactHandle}
                    onChange={(event) => setNewContactHandle(event.target.value)}
                    className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Bank</label>
                  <input
                    type="text"
                    placeholder="HDFC Bank"
                    value={newContactBank}
                    onChange={(event) => setNewContactBank(event.target.value)}
                    className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Account number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Last 4 digits are stored"
                    value={newContactAccount}
                    onChange={(event) => setNewContactAccount(event.target.value)}
                    className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Currency</label>
                  <select
                    value={newContactCurrency}
                    onChange={(event) =>
                      setNewContactCurrency(event.target.value as 'INR' | 'USD' | 'EUR')
                    }
                    className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Type</label>
                <div className="flex gap-2 mt-1">
                  {(['Person', 'Business'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => {
                        sound.click();
                        setNewContactType(type);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        newContactType === type
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormError('');
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-2 text-xs">
                  Save payee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
