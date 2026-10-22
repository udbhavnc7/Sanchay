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
    }, 600);
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
      bank: 'Sanchay Apex Direct •• ' + Math.floor(1000 + Math.random() * 9000),
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Contacts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            The people and businesses you pay the most, one tap away.
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
          <span>Add contact</span>
        </button>
      </div>

      {/* Top Quick Transfer Section */}
      <div className="glass-panel p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Quick Transfer Selector (7 cols) */}
          <div className="lg:col-span-7">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Quick transfer</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pick a favourite, choose an amount, done.
            </p>

            {/* Avatars Row */}
            <div className="mt-6 flex items-center gap-4 flex-wrap">
              {favorites.map((c) => {
                const isSelected = selectedContact.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      sound.click();
                      setSelectedContact(c);
                    }}
                    className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm text-white transition-all duration-200 shadow-md ${
                        isSelected
                          ? 'ring-4 ring-orange-500 ring-offset-2 ring-offset-slate-900 scale-110 shadow-orange-500/30'
                          : 'opacity-85 hover:opacity-100 hover:scale-105'
                      } bg-gradient-to-tr ${c.avatarColor}`}
                    >
                      {c.initials}
                    </div>
                    <span
                      className={`text-xs font-semibold truncate max-w-[70px] ${
                        isSelected
                          ? 'text-orange-500 dark:text-orange-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}

              {/* Add New Quick Contact Button */}
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
          </div>

          {/* Transfer Execution Box (5 cols) */}
          <div className="lg:col-span-5">
            <div className="p-5 rounded-3xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 shadow-inner">
              {/* Sending to contact banner */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr ${selectedContact.avatarColor}`}
                >
                  {selectedContact.initials}
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Sending to</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedContact.name}
                  </div>
                </div>
              </div>

              {/* Amount Display */}
              <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-1 font-mono-numbers">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">$</span>
                  <input
                    type="text"
                    value={customInput}
                    onChange={handleAmountChange}
                    className="text-2xl font-black text-slate-900 dark:text-white bg-transparent w-36 focus:outline-none"
                  />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase">USD</span>
              </div>

              {/* Quick Amount Pills */}
              <div className="mt-3 flex items-center gap-2">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSelectPreset(p)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold font-mono-numbers transition-all ${
                      amount === p
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    ${p}
                  </button>
                ))}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendPayment}
                disabled={isSending || amount <= 0}
                className="mt-4 w-full py-3.5 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Wire...</span>
                  </div>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Send ${amount.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Directory Section */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.click();
                setFilterType('all');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All {contacts.length}
            </button>
            <button
              onClick={() => {
                sound.click();
                setFilterType('favorites');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === 'favorites'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Favourites {favorites.length}
            </button>
            <button
              onClick={() => {
                sound.click();
                setFilterType('businesses');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === 'businesses'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Businesses {contacts.filter((c) => c.type === 'Business').length}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 w-48 sm:w-60"
            />
          </div>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {filteredContacts.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                sound.click();
                setSelectedContact(c);
              }}
              className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 hover:border-orange-500/40 transition-all flex flex-col justify-between group cursor-pointer relative"
            >
              {/* Star favorite indicator */}
              {c.isFavorite && (
                <div className="absolute top-4 right-4 text-amber-400">
                  <Star size={13} fill="currentColor" />
                </div>
              )}

              <div>
                {/* Big Avatar */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-sm mb-3 bg-gradient-to-tr ${c.avatarColor}`}
                >
                  {c.initials}
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {c.name}
                </h3>
                <div className="text-xs text-slate-400 truncate">{c.handle}</div>

                {/* Person / Business Tag */}
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                    {c.type === 'Business' ? <Building2 size={10} /> : <User size={10} />}
                    {c.type}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200/50 dark:border-white/5 text-[11px] text-slate-400">
                <div className="truncate">{c.bank}</div>
                {c.lastTransfer && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {c.lastTransfer}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Add New Business Contact
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter details for one-click treasury settlements.
            </p>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Contact / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI Corporate"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Handle / Domain</label>
                <input
                  type="text"
                  placeholder="@handle or domain.com"
                  value={newContactHandle}
                  onChange={(e) => setNewContactHandle(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Contact Type</label>
                <div className="flex gap-2 mt-1">
                  {(['Person', 'Business'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        sound.click();
                        setNewContactType(t);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        newContactType === t
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-2 text-xs">
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
