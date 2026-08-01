import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { Contact } from '../lib/contacts';
import layoutStyles from '../styles/layout.module.css';
import formStyles from '../styles/forms.module.css';
import surfaceStyles from '../styles/surface.module.css';
import contactsStyles from '../styles/contacts.module.css';

interface ContactsViewProps {
  contacts: Contact[];
  onAdd: (name: string, address: string) => Promise<void>;
  onRemove: (name: string) => Promise<void>;
}

export default function ContactsView({ contacts, onAdd, onRemove }: ContactsViewProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(address.trim())) {
      setError('Invalid Ethereum address');
      return;
    }
    setBusy(true);
    try {
      await onAdd(name.trim().toLowerCase(), address.trim());
      setName('');
      setAddress('');
      setAdding(false);
      toast.success(`${name} added`);
    } catch (e: any) {
      setError(e.message || 'Failed to add contact');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (contact: Contact) => {
    if (!confirm(`Remove ${contact.name}?`)) {
      return;
    }
    try {
      await onRemove(contact.name);
      toast.success(`${contact.name} removed`);
    } catch {
      toast.error('Failed to remove contact');
    }
  };

  const filteredContacts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return contacts;
    }
    return contacts.filter((contact) => (
      contact.name.toLowerCase().includes(value) ||
      contact.address.toLowerCase().includes(value)
    ));
  }, [contacts, query]);

  let addBtnText = '+ Add contact';
  if (adding) {
    addBtnText = 'Cancel';
  }

  return (
    <div>
      <div className={layoutStyles.fullpage} style={{ paddingBottom: 0 }}>
        <div className={contactsStyles['contacts-header']}>
          <div>
            <div className={layoutStyles['section-title']} style={{ margin: 0 }}>Contacts</div>
            <div className={contactsStyles['contacts-subtitle']}>
              Save recipient addresses for easy transfers.
            </div>
          </div>
          <button
            className={`${formStyles.btn} ${formStyles['btn-secondary']} ${formStyles['btn-sm']}`}
            onClick={() => {
              setAdding((a) => !a);
              setError('');
            }}
          >
            {addBtnText}
          </button>
        </div>
        <div className={contactsStyles['contacts-toolbar']}>
          <div className={contactsStyles['contacts-search']}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or address"
            />
          </div>
          <div className={contactsStyles['contacts-count']}>
            {filteredContacts.length} contacts
          </div>
        </div>
      </div>

      {adding && (
        <div style={{ padding: '12px 20px 0' }}>
          <div className={`${surfaceStyles.card} ${contactsStyles['add-card']}`}>
            <div className={contactsStyles['add-card-title']}>New contact</div>
            <form onSubmit={handleAdd}>
              <div className={`${formStyles.field} ${contactsStyles['add-field']}`}>
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alice"
                  autoFocus
                />
              </div>
              <div className={`${formStyles.field} ${contactsStyles['add-field']}`}>
                <label>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
              </div>
              {error && <div className={formStyles['auth-error']}>{error}</div>}
              <div className={contactsStyles['add-actions']}>
                <button
                  className={`${formStyles.btn} ${formStyles['btn-secondary']} ${formStyles['btn-sm']}`}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAdding(false);
                    setError('');
                    setName('');
                    setAddress('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`${formStyles.btn} ${formStyles['btn-primary']} ${formStyles['btn-sm']}`}
                  type="submit"
                  disabled={busy}
                >
                  {busy ? 'Saving…' : 'Save contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className={contactsStyles['empty-state']}>
          <p>No contacts yet. Add one to send ETH by name.</p>
        </div>
      ) : (
        <div className={contactsStyles['contact-list']}>
          {filteredContacts.map((c) => (
            <div key={c.id} className={contactsStyles['contact-item']}>
              <div className={contactsStyles['contact-avatar']}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className={contactsStyles['contact-info']}>
                <div className={contactsStyles['contact-name']}>{c.name}</div>
                <div className={contactsStyles['contact-addr']}>
                  {c.address.slice(0, 8)}…{c.address.slice(-6)}
                </div>
              </div>
              <div className={contactsStyles['contact-actions']}>
                <button
                  className={contactsStyles['contact-copy']}
                  onClick={() => {
                    navigator.clipboard.writeText(c.address);
                    toast.success(`${c.name} address copied`);
                  }}
                >
                  Copy
                </button>
                <button
                  className={contactsStyles['contact-delete']}
                  onClick={() => handleRemove(c)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
