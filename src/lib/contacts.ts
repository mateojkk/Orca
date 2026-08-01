// contacts.ts - address book stored locally / backend
import { authAxios } from '../api';

export interface Contact {
  id: string;
  name: string;
  address: string;
}

const LOCAL_CONTACTS_KEY = 'orca_contacts';
const SYNC_CONTACTS = import.meta.env.VITE_SYNC_CONTACTS === 'true';

function getLocalContacts(): Contact[] {
  try {
    const saved = localStorage.getItem(LOCAL_CONTACTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveLocalContacts(contacts: Contact[]): void {
  localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(contacts));
}

export async function getContacts(ownerAddress?: string): Promise<Contact[]> {
  if (!SYNC_CONTACTS || !ownerAddress) {
    return getLocalContacts();
  }

  try {
    const resp = await authAxios(ownerAddress).get('/api/contacts');
    if (Array.isArray(resp.data)) {
      return resp.data.map((c: any) => ({
        id: c.id,
        name: String(c.name).toLowerCase(),
        address: c.walletAddress || c.address,
      }));
    }
  } catch {
    /* fallback to local storage */
  }
  return getLocalContacts();
}

export async function addContact(
  name: string,
  address: string,
  ownerAddress?: string
): Promise<Contact> {
  const contact: Contact = {
    id: crypto.randomUUID(),
    name: name.toLowerCase(),
    address,
  };

  if (SYNC_CONTACTS && ownerAddress) {
    try {
      const resp = await authAxios(ownerAddress).post('/api/contacts', {
        name: contact.name,
        walletAddress: address,
      });
      if (resp.data?.id) {
        contact.id = String(resp.data.id);
      }
    } catch {
      /* ignore API error */
    }
  }

  const existing = getLocalContacts();
  const updated = [...existing.filter((c) => c.name !== contact.name), contact];
  saveLocalContacts(updated);
  return contact;
}

export async function removeContact(name: string, ownerAddress?: string): Promise<boolean> {
  const existing = getLocalContacts();
  const removed = existing.find((c) => c.name === name.toLowerCase());
  const filtered = existing.filter((c) => c.name !== name.toLowerCase());
  saveLocalContacts(filtered);

  if (SYNC_CONTACTS && ownerAddress && removed?.id) {
    try {
      await authAxios(ownerAddress).delete(`/api/contacts/${removed.id}`);
    } catch {
      /* ignore API error */
    }
  }
  return true;
}

export function findContact(
  nameOrAddress: string,
  contacts: Contact[]
): Contact | undefined {
  const trimmed = nameOrAddress.trim();
  let cleaned = trimmed;
  if (trimmed.startsWith('@')) {
    cleaned = trimmed.slice(1);
  }
  const q = cleaned.toLowerCase();
  
  let found = contacts.find((c) => c.name === q);
  if (!found) {
    found = contacts.find((c) => c.address.toLowerCase() === q);
  }
  return found;
}
