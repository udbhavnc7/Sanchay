import React, { useMemo, useState } from 'react';
import type {
  Account,
  Category,
  Contact,
  Currency,
  MoneyResult,
  PaymentAttempt,
  PaymentAttemptInput,
} from '../types/finance';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react';
import {
  compareMoney,
  formatMoney,
  initialsFromName,
  parseMoneyInput,
} from '../utils/money';
import {
  isLikelyUpiId,
  paymentAttemptStatusLabel,
  paymentDetailsText,
} from '../utils/paymentAttempts';
import { MetalAction } from './MetalAction';

export interface TransfersTabProps {
  accounts: Account[];
  contacts: Contact[];
  paymentAttempts?: PaymentAttempt[];
  onPreparePaymentAttempt?: (input: PaymentAttemptInput) => {
    ok: true;
    attempt: PaymentAttempt;
  } | {
    ok: false;
    error: string;
  };
  onConfirmPaymentAttempt?: (
    attemptId: string,
    userReference?: string
  ) => MoneyResult & { duplicate?: boolean; attempt?: PaymentAttempt };
  onUpdatePaymentAttemptStatus?: (
    attemptId: string,
    status: 'needs_reconciliation' | 'cancelled_or_failed'
  ) => void;
  onSendPayment?: (input: {
    payee: Contact;
    amount: number;
    accountId: string;
    category: Category;
    note?: string;
  }) => MoneyResult;
  onAddContact: (contact: Contact) => void;
  onToggleFavorite: (contactId: string) => void;
}

const CURRENCIES: Currency[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

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
  'Travel',
];

const AVATAR_COLORS = ['#ff9800', '#3b82f6', '#a855f7', '#10b981', '#f43f5e'];

export const TransfersTab: React.FC<TransfersTabProps> = ({
  accounts,
  contacts,
  paymentAttempts = [],
  onPreparePaymentAttempt,
  onConfirmPaymentAttempt,
  onUpdatePaymentAttemptStatus,
  onSendPayment,
  onAddContact,
  onToggleFavorite,
}) => {
  const [selectedContactId, setSelectedContactId] = useState(contacts[0]?.id ?? '');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [amountInput, setAmountInput] = useState('1000');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'businesses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<
    (MoneyResult & { duplicate?: boolean; attempt?: PaymentAttempt }) | null
  >(null);
  const [copied, setCopied] = useState(false);

  const [activeAttempt, setActiveAttempt] = useState<PaymentAttempt | null>(null);
  const [reconcileAttempt, setReconcileAttempt] = useState<PaymentAttempt | null>(null);
  const [userReference, setUserReference] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newUpiId, setNewUpiId] = useState('');
  const [newType, setNewType] = useState<'Person' | 'Business'>('Person');
  const [newCurrency, setNewCurrency] = useState<Currency>('INR');
  const [newFavorite, setNewFavorite] = useState(true);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0];
  const payeeCurrency = selectedContact?.currency ?? 'INR';

  const [payeeUpiId, setPayeeUpiId] = useState(selectedContact?.upiId ?? '');
  const [prevContactId, setPrevContactId] = useState(selectedContact?.id);

  if (selectedContact && selectedContact.id !== prevContactId) {
    setPrevContactId(selectedContact.id);
    setPayeeUpiId(selectedContact.upiId ?? '');
  }

  const unresolvedAttempts = useMemo(() => {
    return (paymentAttempts ?? []).filter(
      (a) => a.status === 'prepared' || a.status === 'needs_reconciliation'
    );
  }, [paymentAttempts]);

  const matchingAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.currency === payeeCurrency && account.status === 'Active'
      ),
    [accounts, payeeCurrency]
  );

  const sourceAccount =
    matchingAccounts.find((account) => account.id === sourceAccountId) ?? matchingAccounts[0];

  const parsedAmount = parseMoneyInput(amountInput, payeeCurrency);
  const amount = parsedAmount.ok ? parsedAmount.amount : 0;
  const presets = payeeCurrency === 'INR' ? [500, 1000, 2500, 5000] : [50, 100, 250, 500];

  const favorites = contacts.filter((contact) => contact.isFavorite);

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.upiId ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.accountNumber ?? '').includes(searchQuery);
    if (filterType === 'favorites') return matchesSearch && contact.isFavorite;
    if (filterType === 'businesses') return matchesSearch && contact.type === 'Business';
    return matchesSearch;
  });

  const validationError = (() => {
    if (!selectedContact) return 'Choose someone to pay.';
    if (!payeeUpiId.trim()) return 'Enter the payee UPI ID you were given.';
    if (!isLikelyUpiId(payeeUpiId)) return 'Enter a valid UPI ID (e.g. name@bank).';
    if (!parsedAmount.ok) return parsedAmount.error;
    if (!sourceAccount) return `You have no active ${payeeCurrency} account to pay from.`;
    if (compareMoney(sourceAccount.balance, amount) < 0) {
      return `Not enough in ${sourceAccount.name}. Available ${formatMoney(sourceAccount.balance, sourceAccount.currency)}.`;
    }
    return '';
  })();

  const handleSelectPreset = (value: number) => {
    sound.click();
    setAmountInput(String(value));
  };

  const handleReview = () => {
    if (validationError || !selectedContact || !sourceAccount) return;
    sound.click();

    if (onPreparePaymentAttempt) {
      const prepResult = onPreparePaymentAttempt({
        payee: selectedContact,
        upiId: payeeUpiId.trim(),
        amount,
        accountId: sourceAccount.id,
        category,
        note,
      });

      if (!prepResult.ok) {
        return;
      }
      setActiveAttempt(prepResult.attempt);
    } else {
      setActiveAttempt({
        id: `pa_${Date.now()}`,
        payeeId: selectedContact.id,
        payeeName: selectedContact.name,
        upiId: payeeUpiId.trim(),
        amount,
        currency: payeeCurrency,
        accountId: sourceAccount.id,
        category,
        note,
        status: 'prepared',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setUserReference('');
    setResult(null);
    setReviewOpen(true);
  };

  const handleConfirmAttempt = (attempt: PaymentAttempt) => {
    if (!sourceAccount || isSending) return;
    setIsSending(true);
    sound.click();

    window.setTimeout(() => {
      let paymentResult: MoneyResult & { duplicate?: boolean; attempt?: PaymentAttempt };
      if (onConfirmPaymentAttempt) {
        paymentResult = onConfirmPaymentAttempt(attempt.id, userReference.trim() || undefined);
      } else if (onSendPayment) {
        paymentResult = onSendPayment({
          payee: selectedContact,
          amount: attempt.amount,
          accountId: attempt.accountId,
          category: attempt.category,
          note: attempt.note,
        });
      } else {
        paymentResult = { ok: false, error: 'Payment processing unavailable.' };
      }

      setIsSending(false);
      setResult(paymentResult);

      if (paymentResult.ok) {
        sound.success();
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF5722', '#10B981', '#38BDF8', '#F59E0B'],
        });
        setAmountInput('');
        setNote('');
        setReconcileAttempt(null);
      }
    }, 350);
  };

  const handleUpdateStatus = (
    attemptId: string,
    status: 'needs_reconciliation' | 'cancelled_or_failed'
  ) => {
    sound.click();
    if (onUpdatePaymentAttemptStatus) {
      onUpdatePaymentAttemptStatus(attemptId, status);
    }
    setReviewOpen(false);
    setReconcileAttempt(null);
    setActiveAttempt(null);
  };

  const handleCopyUpiId = async (upi: string) => {
    try {
      await navigator.clipboard.writeText(upi);
      setCopiedUpi(true);
      sound.click();
      window.setTimeout(() => setCopiedUpi(false), 2000);
    } catch {
      setCopiedUpi(false);
    }
  };

  const handleCopyPaymentDetails = async (attempt: PaymentAttempt) => {
    try {
      await navigator.clipboard.writeText(paymentDetailsText(attempt));
      setCopiedDetails(true);
      sound.click();
      window.setTimeout(() => setCopiedDetails(false), 2000);
    } catch {
      setCopiedDetails(false);
    }
  };

  const handleCopyReference = async () => {
    if (!result?.transaction?.reference) return;
    try {
      await navigator.clipboard.writeText(result.transaction.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCreateContact = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || (!newAccountNumber.trim() && !newUpiId.trim())) return;

    const newContact: Contact = {
      id: `c_${Date.now()}`,
      name: newName.trim(),
      handle: `••${(newAccountNumber.trim() || newUpiId.trim()).slice(-4)}`,
      type: newType,
      bank: newBank.trim() || 'Sanchay partner bank',
      accountNumber: newAccountNumber.trim() || undefined,
      upiId: newUpiId.trim() || undefined,
      currency: newCurrency,
      initials: initialsFromName(newName) || 'CO',
      avatarColor: AVATAR_COLORS[contacts.length % AVATAR_COLORS.length],
      isFavorite: newFavorite,
      lastTransfer: 'Never paid',
    };

    onAddContact(newContact);
    setSelectedContactId(newContact.id);
    setSourceAccountId('');
    setShowAddModal(false);
    setNewName('');
    setNewAccountNumber('');
    setNewBank('');
    setNewUpiId('');
    setNewType('Person');
    setNewCurrency('INR');
    setNewFavorite(true);
    sound.success();
  };

  const activeAccount = result?.transaction?.accountId
    ? accounts.find((account) => account.id === result.transaction?.accountId)
    : undefined;

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--text-main)',
            }}
          >
            Payees
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Send money, review the details, and keep a receipt you can trust.
          </p>
        </div>

        <button
          onClick={() => {
            sound.click();
            setShowAddModal(true);
          }}
          className="btn-action-dark"
        >
          <Plus size={15} />
          <span>Add payee</span>
        </button>
      </div>

      <div className="s-card payees-hero-card">
        <div
          className="payees-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Quick transfer
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pick a favourite, choose the account, and check it before sending.
            </p>

            <div
              className="quick-transfer-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '20px',
                flexWrap: 'wrap',
              }}
            >
              {favorites.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                const index = contacts.findIndex((item) => item.id === contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      sound.click();
                      setSelectedContactId(contact.id);
                      setSourceAccountId('');
                      setResult(null);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '15px',
                        color: '#ffffff',
                        background: AVATAR_COLORS[index % AVATAR_COLORS.length],
                        border: isSelected
                          ? '3px solid var(--accent-orange)'
                          : '3px solid transparent',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                        boxShadow: isSelected ? '0 4px 14px rgba(255,87,34,0.35)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {contact.initials}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isSelected ? 'var(--accent-orange)' : 'var(--text-main)',
                      }}
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
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: '2px dashed var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Plus size={20} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  New
                </span>
              </button>
            </div>

            <div
              className="payee-form-card"
              style={{
                marginTop: '24px',
                padding: '16px',
                borderRadius: '18px',
                background: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--accent-orange)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {selectedContact?.initials ?? '?'}
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sending to</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedContact?.name ?? 'No payee selected'}
                  </div>
                  {selectedContact?.accountNumber && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {selectedContact.bank} · {selectedContact.accountNumber}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {payeeCurrency}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Payee UPI ID
                  </label>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-orange)' }}>
                    User-entered · Not verified
                  </span>
                </div>
                <input
                  type="text"
                  value={payeeUpiId}
                  onChange={(event) => setPayeeUpiId(event.target.value)}
                  placeholder="e.g. name@okhdfcbank"
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
              </div>

              <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
                Pay from
              </label>
              <select
                value={sourceAccount?.id ?? ''}
                onChange={(event) => setSourceAccountId(event.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              >
                {matchingAccounts.length === 0 && <option value="">No matching account</option>}
                {matchingAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} — {formatMoney(account.balance, account.currency)}
                  </option>
                ))}
              </select>

              <label
                style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  marginTop: '12px',
                }}
              >
                Amount
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '4px',
                }}
              >
                <span
                  className="font-mono-numbers"
                  style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-muted)' }}
                >
                  {payeeCurrency}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(event) =>
                    setAmountInput(event.target.value.replace(/[^0-9.]/g, ''))
                  }
                  placeholder="0"
                  style={{
                    fontSize: '22px',
                    fontWeight: 900,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    width: '100%',
                    outline: 'none',
                    marginLeft: '8px',
                  }}
                  className="font-mono-numbers"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSelectPreset(preset)}
                    className="font-mono-numbers"
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        amount === preset ? '#111317' : 'var(--bg-card)',
                      color: amount === preset ? '#ffffff' : 'var(--text-main)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {formatMoney(preset, payeeCurrency, { decimals: false })}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as Category)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                >
                  {PAYMENT_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Note (optional)"
                  style={{
                    flex: 2,
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
              </div>

              {validationError && amountInput !== '' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginTop: '10px',
                    fontSize: '10px',
                    color: '#b45309',
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={12} style={{ marginTop: '1px', flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              <button
                onClick={handleReview}
                disabled={Boolean(validationError)}
                className="btn-action-dark"
                style={{
                  width: '100%',
                  marginTop: '14px',
                  padding: '13px 0',
                  opacity: validationError ? 0.5 : 1,
                  cursor: validationError ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={14} />
                <span>Review payment</span>
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                How payment assistance works
              </h2>
              <ShieldCheck size={16} color="#10b981" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {[
                {
                  title: '1. Copy payee details',
                  body: 'Copy the payee UPI ID and payment details to your clipboard.',
                },
                {
                  title: '2. Pay in your UPI app',
                  body: 'Open Google Pay, PhonePe, Paytm, or BHIM, check the payee name matches, and enter your UPI PIN.',
                },
                {
                  title: '3. Record in Sanchay',
                  body: 'Return to Sanchay and confirm payment to record the expense in your local ledger.',
                },
              ].map((step) => (
                <div
                  key={step.title}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                      lineHeight: 1.5,
                    }}
                  >
                    {step.body}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'rgba(56, 189, 248, 0.08)',
                color: '#0284c7',
                fontSize: '11px',
                lineHeight: 1.5,
              }}
            >
              <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                Sanchay does not connect to the UPI network or process funds. Balances are user-maintained records.
              </span>
            </div>
          </div>
        </div>
      </div>

      {unresolvedAttempts.length > 0 && (
        <div
          className="s-card animate-fade-in"
          style={{
            marginBottom: '24px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            background: 'rgba(245, 158, 11, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={15} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Unresolved payment assistance ({unresolvedAttempts.length})
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Pending confirmation — not recorded as an expense yet.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {unresolvedAttempts.map((attempt) => (
              <div
                key={attempt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {attempt.payeeName}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background:
                          attempt.status === 'prepared'
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color: attempt.status === 'prepared' ? '#0369a1' : '#b45309',
                      }}
                    >
                      {paymentAttemptStatusLabel(attempt.status)}
                    </span>
                  </div>
                  <div
                    className="font-mono-numbers"
                    style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}
                  >
                    UPI ID: {attempt.upiId} · {formatMoney(attempt.amount, attempt.currency)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setReconcileAttempt(attempt);
                      setUserReference(attempt.userReference ?? '');
                      setResult(null);
                    }}
                    className="btn-action-dark"
                    style={{ padding: '6px 14px', fontSize: '11px' }}
                  >
                    Reconcile
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(attempt.id, 'cancelled_or_failed')}
                    className="btn-action-light"
                    style={{ padding: '6px 12px', fontSize: '11px', color: '#ef4444' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="s-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
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
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: filterType === filter.key ? '#111317' : 'var(--bg-pill)',
                  color: filterType === filter.key ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search payees..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{
                padding: '6px 12px 6px 28px',
                borderRadius: '9999px',
                fontSize: '11px',
                background: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                outline: 'none',
                width: '190px',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredContacts.map((contact) => {
            const index = contacts.findIndex((item) => item.id === contact.id);
            return (
              <div
                key={contact.id}
                onClick={() => {
                  sound.click();
                  setSelectedContactId(contact.id);
                  setSourceAccountId('');
                  setResult(null);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '20px',
                  background:
                    selectedContact?.id === contact.id
                      ? 'rgba(255,87,34,0.06)'
                      : 'var(--bg-pill)',
                  border:
                    selectedContact?.id === contact.id
                      ? '1px solid var(--accent-orange)'
                      : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite(contact.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    border: 'none',
                    background: 'transparent',
                    color: contact.isFavorite ? '#f59e0b' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  title={contact.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Star size={13} fill={contact.isFavorite ? 'currentColor' : 'none'} />
                </button>

                <div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                      color: '#ffffff',
                      background: AVATAR_COLORS[index % AVATAR_COLORS.length],
                      marginBottom: '12px',
                    }}
                  >
                    {contact.initials}
                  </div>

                  <h3
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {contact.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {contact.handle}
                  </div>

                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {contact.type === 'Business' ? <Building2 size={9} /> : <User size={9} />}
                      {contact.type}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {contact.currency ?? 'INR'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {contact.bank}
                  </div>
                  <div style={{ marginTop: '2px', opacity: 0.8 }}>
                    {contact.accountNumber ?? 'No account on file'}
                  </div>
                  {contact.lastTransfer && (
                    <div style={{ marginTop: '2px', opacity: 0.8 }}>
                      Last paid {contact.lastTransfer}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredContacts.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            No payees match that search.
          </p>
        )}
      </div>

      {(reviewOpen || reconcileAttempt !== null) && !result && Boolean(reconcileAttempt || activeAttempt) && (() => {
        const currentAttempt = reconcileAttempt ?? activeAttempt;
        if (!currentAttempt) return null;
        const attemptAccount = accounts.find((acc) => acc.id === currentAttempt.accountId) ?? sourceAccount;
        const isReconciling = Boolean(reconcileAttempt);

        return (
          <div
            className="sanchay-modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              padding: '16px',
            }}
            onClick={() => {
              if (!isSending) {
                setReviewOpen(false);
                setReconcileAttempt(null);
              }
            }}
          >
            <div
              className="s-card"
              style={{ maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {isReconciling ? 'Reconcile payment attempt' : 'Review & pay externally'}
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'var(--bg-pill)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {paymentAttemptStatusLabel(currentAttempt.status)}
                </span>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                Sanchay assists with details and records your ledger. Pay securely inside your external UPI app.
              </p>

              <div
                style={{
                  background: 'var(--bg-pill)',
                  borderRadius: '14px',
                  padding: '14px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payee</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {currentAttempt.payeeName}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recipient UPI ID</span>
                    <span
                      className="font-mono-numbers"
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {currentAttempt.upiId}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      Entered by you · Not verified by Sanchay
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyUpiId(currentAttempt.upiId)}
                    className="btn-action-light"
                    style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
                  >
                    {copiedUpi ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copiedUpi ? 'Copied' : 'Copy UPI'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Amount</span>
                  <span
                    className="font-mono-numbers"
                    style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}
                  >
                    {formatMoney(currentAttempt.amount, currentAttempt.currency)}
                  </span>
                </div>

                {attemptAccount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Source Account</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                      {attemptAccount.name}
                    </span>
                  </div>
                )}

                {currentAttempt.note && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Note</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {currentAttempt.note}
                    </span>
                  </div>
                )}

                <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyPaymentDetails(currentAttempt)}
                    className="btn-action-light"
                    style={{ padding: '6px 10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    {copiedDetails ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                    {copiedDetails ? 'Details Copied' : 'Copy all payment text'}
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 152, 0, 0.06)',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: 'var(--text-muted)',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Next steps in your UPI app:
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px' }}>
                  <li>Open your preferred UPI app (PhonePe, Google Pay, Paytm, BHIM, etc.).</li>
                  <li>Paste the UPI ID and check that the payee name matches.</li>
                  <li>Pay {formatMoney(currentAttempt.amount, currentAttempt.currency)} and verify bank debit.</li>
                </ol>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: '4px',
                  }}
                >
                  Bank / UPI reference or UTR (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-digit UTR from your bank or UPI app"
                  value={userReference}
                  onChange={(event) => setUserReference(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  For your own reconciliation. Sanchay does not verify this with your bank.
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleConfirmAttempt(currentAttempt)}
                  disabled={isSending}
                  className="btn-action-dark"
                  style={{ width: '100%', padding: '12px 0', fontSize: '13px', fontWeight: 700 }}
                >
                  {isSending ? 'Recording…' : 'I completed this payment'}
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(currentAttempt.id, 'needs_reconciliation')}
                    disabled={isSending}
                    className="btn-action-light"
                    style={{ flex: 1, padding: '10px 0', fontSize: '11px' }}
                  >
                    I'm not sure / Check later
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(currentAttempt.id, 'cancelled_or_failed')}
                    disabled={isSending}
                    className="btn-action-light"
                    style={{ flex: 1, padding: '10px 0', fontSize: '11px', color: '#ef4444' }}
                  >
                    Cancelled / Failed
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReviewOpen(false);
                    setReconcileAttempt(null);
                  }}
                  disabled={isSending}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    padding: '6px 0',
                    cursor: 'pointer',
                  }}
                >
                  Close without changing
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {result && (
        <div
          className="sanchay-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={() => {
            setResult(null);
            setReviewOpen(false);
            setReconcileAttempt(null);
          }}
        >
          <div
            className="s-card"
            style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}
            onClick={(event) => event.stopPropagation()}
          >
            {result.ok && result.transaction ? (
              <>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Marked paid by you — not verified by Sanchay
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {formatMoney(result.transaction.amount, payeeCurrency)} recorded to {selectedContact?.name ?? 'payee'}
                  {activeAccount ? ` from ${activeAccount.name}` : ''}.
                </p>

                {result.duplicate && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#d97706',
                      fontSize: '11px',
                      textAlign: 'left',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>This payment attempt was already confirmed. No duplicate expense recorded.</span>
                  </div>
                )}

                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Sanchay Reference</div>
                      <div
                        className="font-mono-numbers"
                        style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}
                      >
                        {result.transaction.reference}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyReference}
                      className="btn-action-light"
                      style={{ padding: '6px 10px', fontSize: '10px' }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {result.transaction.userReference && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>User-entered UTR</div>
                      <div
                        className="font-mono-numbers"
                        style={{ fontSize: '11px', color: 'var(--text-main)' }}
                      >
                        {result.transaction.userReference}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginTop: '14px',
                    marginBottom: '16px',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    textAlign: 'left',
                    lineHeight: 1.4,
                  }}
                >
                  <ShieldCheck size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    Recorded in Sanchay ledger based on your confirmation. Sanchay has no access to your bank or UPI network.
                  </span>
                </div>

                <MetalAction
                  className="metal-action--receipt"
                  text="Done"
                  onClick={() => {
                    setResult(null);
                    setReviewOpen(false);
                    setReconcileAttempt(null);
                    setActiveAttempt(null);
                  }}
                />
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <AlertTriangle size={26} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Payment not recorded
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {result.error}
                </p>
                <button
                  onClick={() => setResult(null)}
                  className="btn-action-dark"
                  style={{ width: '100%', marginTop: '18px', padding: '11px 0' }}
                >
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="sanchay-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="s-card"
            style={{ maxWidth: '440px', width: '100%' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}
            >
              Add a payee
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Save the account details once, then payments are one review away.
            </p>

            <form
              onSubmit={handleCreateContact}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <Field label="Name">
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="UPI ID (optional)">
                <input
                  type="text"
                  placeholder="e.g. ananya@okhdfcbank"
                  value={newUpiId}
                  onChange={(event) => setNewUpiId(event.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Account number">
                <input
                  type="text"
                  placeholder="Account or bank reference"
                  value={newAccountNumber}
                  onChange={(event) => setNewAccountNumber(event.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Bank or provider">
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={newBank}
                  onChange={(event) => setNewBank(event.target.value)}
                  style={inputStyle}
                />
              </Field>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Field label="Type" style={{ flex: 1 }}>
                  <select
                    value={newType}
                    onChange={(event) => setNewType(event.target.value as 'Person' | 'Business')}
                    style={inputStyle}
                  >
                    <option value="Person">Person</option>
                    <option value="Business">Business</option>
                  </select>
                </Field>
                <Field label="Currency" style={{ flex: 1 }}>
                  <select
                    value={newCurrency}
                    onChange={(event) => setNewCurrency(event.target.value as Currency)}
                    style={inputStyle}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={newFavorite}
                  onChange={(event) => setNewFavorite(event.target.checked)}
                />
                Show in quick transfer
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-action-light"
                  style={{ flex: 1, padding: '10px 0' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action-dark"
                  style={{ flex: 1, padding: '10px 0' }}
                >
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  background: 'var(--bg-pill)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  outline: 'none',
  marginTop: '4px',
};

const Field: React.FC<{
  label: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ label, style, children }) => (
  <div style={style}>
    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</label>
    {children}
  </div>
);



