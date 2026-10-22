import React, { useState } from 'react';
import type { Contact } from '../types/finance';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Send,
  Star,
  Building2,
  User,
} from 'lucide-react';

interface TransfersTabProps {
  contacts: Contact[];
  onExecuteTransfer: (contact: Contact, amount: number) => void;
  onAddContact: (contact: Contact) => void;
}

export const TransfersTab: React.FC<TransfersTabProps> = ({
  contacts,
  onExecuteTransfer,
  onAddContact,
}) => {
  const [selectedContact, setSelectedContact] = useState<Contact>(contacts[0]);
  const [amount, setAmount] = useState<number>(100);
  const [customInput, setCustomInput] = useState<string>('100');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'businesses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactHandle, setNewContactHandle] = useState('');
  const [newContactType, setNewContactType] = useState<'Person' | 'Business'>('Person');

  const presetAmounts = [50, 100, 250, 500];

  const handleSelectPreset = (val: number) => {
    sound.click();
    setAmount(val);
    setCustomInput(val.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setCustomInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    }
  };

  const handleSendPayment = () => {
    if (amount <= 0 || isSending) return;
    setIsSending(true);
    sound.click();

    setTimeout(() => {
      sound.success();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF5722', '#10B981', '#38BDF8', '#F59E0B'],
      });

      onExecuteTransfer(selectedContact, amount);
      setIsSending(false);
    }, 500);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'favorites') return matchesSearch && c.isFavorite;
    if (filterType === 'businesses') return matchesSearch && c.type === 'Business';
    return matchesSearch;
  });

  const favorites = contacts.filter((c) => c.isFavorite);

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName) return;
    const initials = newContactName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const newC: Contact = {
      id: 'c_' + Date.now(),
      name: newContactName,
      handle: newContactHandle.startsWith('@') ? newContactHandle : `@${newContactHandle || newContactName.toLowerCase().replace(/\s+/g, '')}`,
      type: newContactType,
      bank: 'Sanchay Apex Direct',
      accountNumber: '•••• ' + Math.floor(1000 + Math.random() * 9000),
      currency: 'USD',
      initials: initials || 'CO',
      avatarColor: 'from-orange-500 to-amber-600',
      isFavorite: true,
      lastTransfer: 'Just now',
    };
    onAddContact(newC);
    setSelectedContact(newC);
    setShowAddModal(false);
    setNewContactName('');
    setNewContactHandle('');
    sound.success();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--text-main)' }}>
            Contacts
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            The people and businesses you pay the most, one tap away.
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
          <span>Add contact</span>
        </button>
      </div>

      {/* Top Quick Transfer Section */}
      <div className="s-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', alignItems: 'center' }}>
          {/* Quick Transfer Selector */}
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Quick transfer</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pick a favourite, choose an amount, done.
            </p>

            {/* Avatars Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
              {favorites.map((c) => {
                const isSelected = selectedContact.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      sound.click();
                      setSelectedContact(c);
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
                        background: c.id === 'c1' ? '#ff9800' : c.id === 'c2' ? '#3b82f6' : c.id === 'c3' ? '#a855f7' : '#10b981',
                        border: isSelected ? '3px solid var(--accent-orange)' : '3px solid transparent',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isSelected ? '0 4px 14px rgba(255,87,34,0.35)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {c.initials}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--accent-orange)' : 'var(--text-main)' }}>
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}

              {/* Add New Button */}
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
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px dashed var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Plus size={20} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>New</span>
              </button>
            </div>
          </div>

          {/* Transfer Execution Box */}
          <div style={{ padding: '20px', borderRadius: '24px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-orange)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                {selectedContact.initials}
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sending to</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{selectedContact.name}</div>
              </div>
            </div>

            {/* Amount input */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', marginTop: '14px' }}>
              <div className="font-mono-numbers" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)' }}>$</span>
                <input
                  type="text"
                  value={customInput}
                  onChange={handleAmountChange}
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    width: '120px',
                    outline: 'none',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>USD</span>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {presetAmounts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSelectPreset(p)}
                  className="font-mono-numbers"
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: amount === p ? '#111317' : 'var(--bg-card)',
                    color: amount === p ? '#ffffff' : 'var(--text-main)',
                    boxShadow: amount === p ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ${p}
                </button>
              ))}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendPayment}
              disabled={isSending || amount <= 0}
              className="btn-action-dark"
              style={{ width: '100%', marginTop: '16px', padding: '14px 0' }}
            >
              {isSending ? (
                <span>Processing Wire...</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send ${amount.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Directory Section */}
      <div className="s-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                sound.click();
                setFilterType('all');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: filterType === 'all' ? '#111317' : 'var(--bg-pill)',
                color: filterType === 'all' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              All {contacts.length}
            </button>
            <button
              onClick={() => {
                sound.click();
                setFilterType('favorites');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: filterType === 'favorites' ? '#111317' : 'var(--bg-pill)',
                color: filterType === 'favorites' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Favourites {favorites.length}
            </button>
            <button
              onClick={() => {
                sound.click();
                setFilterType('businesses');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: filterType === 'businesses' ? '#111317' : 'var(--bg-pill)',
                color: filterType === 'businesses' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Businesses {contacts.filter((c) => c.type === 'Business').length}
            </button>
          </div>

          {/* Search Contacts */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px 6px 28px',
                borderRadius: '9999px',
                fontSize: '11px',
                background: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                outline: 'none',
                width: '180px',
              }}
            />
          </div>
        </div>

        {/* Contacts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {filteredContacts.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                sound.click();
                setSelectedContact(c);
              }}
              style={{
                padding: '18px',
                borderRadius: '20px',
                background: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease',
              }}
            >
              {c.isFavorite && (
                <div style={{ position: 'absolute', top: '14px', right: '14px', color: '#f59e0b' }}>
                  <Star size={12} fill="currentColor" />
                </div>
              )}

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
                    background: c.id === 'c1' ? '#ff9800' : c.id === 'c2' ? '#3b82f6' : c.id === 'c3' ? '#a855f7' : c.id === 'c4' ? '#10b981' : '#f43f5e',
                    marginBottom: '12px',
                  }}
                >
                  {c.initials}
                </div>

                <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.handle}</div>

                <div style={{ marginTop: '8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                    {c.type === 'Business' ? <Building2 size={9} /> : <User size={9} />}
                    {c.type}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '10px', color: 'var(--text-muted)' }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.bank}</div>
                {c.lastTransfer && (
                  <div style={{ marginTop: '2px', opacity: 0.8 }}>{c.lastTransfer}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="s-card" style={{ maxWidth: '420px', width: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Add Business Contact
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Add a verified recipient to your Sanchay corporate routing book.
            </p>

            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe UK"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', outline: 'none', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Handle or Domain</label>
                <input
                  type="text"
                  placeholder="@handle or domain.com"
                  value={newContactHandle}
                  onChange={(e) => setNewContactHandle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', outline: 'none', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-action-light"
                  style={{ flex: 1, padding: '10px 0' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-action-dark" style={{ flex: 1, padding: '10px 0' }}>
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
