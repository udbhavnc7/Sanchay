import React, { useMemo, useState } from 'react';
import type { Account, Category, Contact, Currency, MoneyResult } from '../types/finance';
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
import { formatMoney, initialsFromName, isValidAmount } from '../utils/money';
import { MetalAction } from './MetalAction';

interface TransfersTabProps {
  accounts: Account[];
  contacts: Contact[];
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
  const [result, setResult] = useState<MoneyResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newType, setNewType] = useState<'Person' | 'Business'>('Person');
  const [newCurrency, setNewCurrency] = useState<Currency>('INR');
  const [newFavorite, setNewFavorite] = useState(true);

  const selectedContact =
    contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0];
  const payeeCurrency = selectedContact?.currency ?? 'INR';

  const matchingAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.currency === payeeCurrency && account.status === 'Active'
      ),
    [accounts, payeeCurrency]
  );

  const sourceAccount =
    matchingAccounts.find((account) => account.id === sourceAccountId) ?? matchingAccounts[0];

  const amount = Number.parseFloat(amountInput);
  const amountValid = isValidAmount(amount);
  const presets = payeeCurrency === 'INR' ? [500, 1000, 2500, 5000] : [50, 100, 250, 500];

  const favorites = contacts.filter((contact) => contact.isFavorite);

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.accountNumber ?? '').includes(searchQuery);
    if (filterType === 'favorites') return matchesSearch && contact.isFavorite;
    if (filterType === 'businesses') return matchesSearch && contact.type === 'Business';
    return matchesSearch;
  });

  const validationError = (() => {
    if (!selectedContact) return 'Choose someone to pay.';
    if (!amountValid) return 'Enter an amount greater than zero.';
    if (!sourceAccount) return `You have no active ${payeeCurrency} account to pay from.`;
    if (sourceAccount.balance < amount) {
      return `Not enough in ${sourceAccount.name}. Available ${formatMoney(sourceAccount.balance, sourceAccount.currency)}.`;
    }
    return '';
  })();

  const handleSelectPreset = (value: number) => {
    sound.click();
    setAmountInput(String(value));
  };

  const handleReview = () => {
    if (validationError) return;
    sound.click();
    setResult(null);
    setReviewOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedContact || !sourceAccount || validationError || isSending) return;
    setIsSending(true);
    sound.click();

    window.setTimeout(() => {
      const paymentResult = onSendPayment({
        payee: selectedContact,
        amount,
        accountId: sourceAccount.id,
        category,
        note,
      });

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
      }
    }, 500);
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
    if (!newName.trim() || !newAccountNumber.trim()) return;

    const newContact: Contact = {
      id: `c_${Date.now()}`,
      name: newName.trim(),
      handle: `••${newAccountNumber.trim().slice(-4)}`,
      type: newType,
      bank: newBank.trim() || 'Sanchay partner bank',
      accountNumber: newAccountNumber.trim(),
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
                What happens next
              </h2>
              <ShieldCheck size={16} color="#10b981" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {[
                {
                  title: '1. Check the details',
                  body: 'You review the payee, account, amount, category and note before anything moves.',
                },
                {
                  title: '2. Confirm once',
                  body: 'The payment is recorded locally and the balance updates immediately.',
                },
                {
                  title: '3. Keep the receipt',
                  body: 'Every payment gets a reference you can copy from the transaction drawer.',
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
                background: 'rgba(255,87,34,0.08)',
                color: 'var(--accent-orange)',
                fontSize: '11px',
                lineHeight: 1.5,
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>Payments can only be sent from an active account in the payee's currency.</span>
            </div>
          </div>
        </div>
      </div>

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

      {reviewOpen && !result && selectedContact && sourceAccount && (
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
          onClick={() => !isSending && setReviewOpen(false)}
        >
          <div
            className="s-card"
            style={{ maxWidth: '420px', width: '100%' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
              Review payment
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '4px',
                marginBottom: '16px',
              }}
            >
              Nothing moves until you confirm.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SummaryRow label="Paying" value={selectedContact.name} />
              <SummaryRow
                label="Account"
                value={`${selectedContact.bank} · ${selectedContact.accountNumber ?? '—'}`}
              />
              <SummaryRow label="From" value={sourceAccount.name} />
              <SummaryRow
                label="Amount"
                value={formatMoney(amount, payeeCurrency)}
                strong
              />
              <SummaryRow label="Category" value={category} />
              {note.trim() && <SummaryRow label="Note" value={note.trim()} />}
              <SummaryRow
                label="Balance after"
                value={formatMoney(sourceAccount.balance - amount, sourceAccount.currency)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                marginTop: '14px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              <ShieldCheck size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>This payment is simulated locally. No real money leaves an account.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                disabled={isSending}
                className="btn-action-light"
                style={{ flex: 1, padding: '11px 0' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isSending}
                className="btn-action-dark"
                style={{ flex: 1, padding: '11px 0' }}
              >
                {isSending ? 'Sending…' : `Send ${formatMoney(amount, payeeCurrency)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewOpen && result && (
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
          onClick={() => setReviewOpen(false)}
        >
          <div
            className="s-card"
            style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}
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
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Payment sent
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {formatMoney(result.transaction.amount, payeeCurrency)} to {selectedContact?.name}
                  {activeAccount ? ` from ${activeAccount.name}` : ''}.
                </p>

                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Reference</div>
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
                    style={{ padding: '7px 10px', fontSize: '10px' }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <MetalAction
                  className="metal-action--receipt"
                  text="Done"
                  onClick={() => setReviewOpen(false)}
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
                  Payment not sent
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

              <Field label="Account number">
                <input
                  type="text"
                  required
                  placeholder="Account or UPI reference"
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

const SummaryRow: React.FC<{ label: string; value: string; strong?: boolean }> = ({
  label,
  value,
  strong,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '14px',
      fontSize: '12px',
      paddingBottom: '8px',
      borderBottom: '1px solid var(--border-subtle)',
    }}
  >
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span
      className={strong ? 'font-mono-numbers' : undefined}
      style={{
        fontWeight: strong ? 900 : 700,
        color: 'var(--text-main)',
        textAlign: 'right',
        fontSize: strong ? '14px' : '12px',
      }}
    >
      {value}
    </span>
  </div>
);

