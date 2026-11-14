import React, { useMemo, useState } from 'react';
import { Archive, Check, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import type { CategoryDefinition } from '../types/finance';
import { BUILT_IN_CATEGORIES, categoryOptions, saveCategory } from '../utils/categories';
import { sound } from '../utils/audio';

interface CategoriesModalProps {
  categories: CategoryDefinition[];
  onSave: (definition: CategoryDefinition) => { ok: boolean; error?: string };
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => { ok: boolean; error?: string };
  onClose: () => void;
}

interface Draft {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

const EMPTY_DRAFT: Draft = { name: '', type: 'expense', color: '#2563eb', icon: 'tag' };

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  categories,
  onSave,
  onArchive,
  onDelete,
  onClose,
}) => {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const titleId = 'categories-modal-title';
  const builtIns = useMemo(
    () => categoryOptions(categories, 'expense').concat(categoryOptions(categories, 'income')),
    [categories]
  );
  const custom = useMemo(
    () => categories.filter((definition) => !BUILT_IN_CATEGORIES.some((builtIn) => builtIn.id === definition.id)),
    [categories]
  );
  const archived = custom.filter((definition) => definition.archived);
  const active = custom.filter((definition) => !definition.archived);

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  };

  const beginEdit = (definition: CategoryDefinition) => {
    sound.click();
    setEditingId(definition.id);
    setDraft({
      name: definition.name,
      type: definition.type,
      color: definition.color,
      icon: definition.icon,
    });
    setMessage(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const generated = saveCategory(categories, {
      ...draft,
      ...(editingId ? { id: editingId } : {}),
    });
    if (!generated.ok) {
      setMessage({ tone: 'error', text: generated.error });
      return;
    }
    const result = onSave(generated.definition);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Could not save this category.' });
      return;
    }
    setMessage({
      tone: 'success',
      text: editingId ? `Updated ${generated.definition.name}.` : `Created ${generated.definition.name}.`,
    });
    resetDraft();
  };

  const requestDelete = (definition: CategoryDefinition) => {
    sound.click();
    const result = onDelete(definition.id);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Could not delete this category.' });
      return;
    }
    if (editingId === definition.id) resetDraft();
    setMessage({ tone: 'success', text: `Deleted ${definition.name}.` });
  };

  const renderActions = (definition: CategoryDefinition, isBuiltIn: boolean) => {
    if (isBuiltIn) {
      return (
        <button
          type="button"
          className="category-icon-button"
          aria-label={`Edit ${definition.name}`}
          onClick={() => beginEdit(definition)}
        >
          <Pencil size={14} />
        </button>
      );
    }
    return (
      <>
        <button
          type="button"
          className="category-icon-button"
          aria-label={`Edit ${definition.name}`}
          onClick={() => beginEdit(definition)}
        >
          <Pencil size={14} />
        </button>
        {definition.archived ? (
          <button
            type="button"
            className="category-icon-button"
            aria-label={`Restore ${definition.name}`}
            onClick={() => {
              sound.click();
              onArchive(definition.id, false);
            }}
          >
            <RotateCcw size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="category-icon-button"
            aria-label={`Archive ${definition.name}`}
            onClick={() => {
              sound.click();
              onArchive(definition.id, true);
            }}
          >
            <Archive size={14} />
          </button>
        )}
        <button
          type="button"
          className="category-icon-button category-icon-button-danger"
          aria-label={`Delete ${definition.name}`}
          onClick={() => requestDelete(definition)}
        >
          <Trash2 size={14} />
        </button>
      </>
    );
  };

  const renderRow = (definition: CategoryDefinition, isBuiltIn: boolean) => (
    <li key={definition.id} className="category-row">
      <span className="category-swatch" style={{ background: definition.color }} aria-hidden="true" />
      <span className="category-row-copy">
        <span className="category-row-name">{definition.name}</span>
        <span className="category-row-meta">
          {isBuiltIn ? 'Built-in' : definition.type === 'income' ? 'Income' : 'Expense'}
          {definition.archived ? ' · Archived' : ''}
        </span>
      </span>
      <span className="category-row-actions">{renderActions(definition, isBuiltIn)}</span>
    </li>
  );

  return (
    <div
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
      onClick={onClose}
    >
      <div
        className="s-card categories-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h3 id={titleId} style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
              Categories
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Rename, recolor or archive categories. Historical entries keep their stable ID.
            </p>
          </div>
          <button
            type="button"
            className="category-icon-button"
            aria-label="Close categories"
            onClick={() => {
              sound.click();
              onClose();
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="category-form" style={{ marginTop: '20px' }}>
          <div className="category-form-grid">
            <div>
              <label htmlFor="category-name">Category name</label>
              <input
                id="category-name"
                value={draft.name}
                maxLength={60}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="e.g. Pet care"
              />
            </div>
            <div>
              <label htmlFor="category-type">Category type</label>
              <select
                id="category-type"
                value={draft.type}
                onChange={(event) => setDraft({ ...draft, type: event.target.value as Draft['type'] })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label htmlFor="category-color">Category color</label>
              <input
                id="category-color"
                type="color"
                value={draft.color}
                onChange={(event) => setDraft({ ...draft, color: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="category-icon">Category icon</label>
              <input
                id="category-icon"
                value={draft.icon}
                maxLength={40}
                onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
                placeholder="tag"
              />
            </div>
          </div>
          {message && (
            <p
              role={message.tone === 'error' ? 'alert' : 'status'}
              className={`category-message category-message-${message.tone}`}
            >
              {message.text}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn-action-dark" style={{ padding: '9px 14px', fontSize: '12px' }}>
              {editingId ? <Check size={14} /> : <Plus size={14} />}
              {editingId ? 'Save changes' : 'Create category'}
            </button>
            {editingId && (
              <button type="button" className="btn-action-light" onClick={resetDraft} style={{ padding: '9px 14px', fontSize: '12px' }}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className="category-section" style={{ marginTop: '24px' }}>
          <h4>Built-in categories</h4>
          <ul className="category-list">
            {builtIns.map((definition) => renderRow(definition, true))}
          </ul>
        </div>

        <div className="category-section" style={{ marginTop: '20px' }}>
          <h4>Your categories</h4>
          {active.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No custom categories yet. Create one above to group spending your way.
            </p>
          ) : (
            <ul className="category-list">{active.map((definition) => renderRow(definition, false))}</ul>
          )}
        </div>

        {archived.length > 0 && (
          <div className="category-section" style={{ marginTop: '20px' }}>
            <h4>Archived</h4>
            <ul className="category-list">{archived.map((definition) => renderRow(definition, false))}</ul>
          </div>
        )}
      </div>
    </div>
  );
};
