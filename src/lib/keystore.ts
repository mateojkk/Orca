/**
 * keystore.ts - AES-GCM encrypted private key storage for ORCA
 */
const PBKDF2_ITERS   = 210_000;
const BLOB_KEY       = 'orca_keystore_blob';
const IDB_DB         = 'orca_session';
const IDB_STORE      = 'keys';
const IDB_RECORD     = 'session_key';

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function unb64(s: string): ArrayBuffer {
  const binStr = atob(s);
  const buf = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    buf[i] = binStr.charCodeAt(i);
  }
  return buf.buffer;
}

async function deriveKey(
  password: string,
  saltBuf: ArrayBuffer,
  extractable = false,
): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    extractable,
    ['encrypt', 'decrypt'],
  );
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveSessionKey(key: CryptoKey): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).put(key, IDB_RECORD);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function loadSessionKey(): Promise<CryptoKey | null> {
  try {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_RECORD);
      req.onsuccess = () => {
        let res: CryptoKey | null = null;
        if (req.result) {
          res = req.result as CryptoKey;
        }
        resolve(res);
      };
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearSessionKey(): Promise<void> {
  try {
    const db = await openIdb();
    return new Promise((resolve) => {
      const tx  = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_RECORD);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

export function keystoreExists(): boolean {
  let res = false;
  if (sessionStorage.getItem(BLOB_KEY)) {
    res = true;
  }
  return res;
}

export function cacheKeystore(blob: string): void {
  sessionStorage.setItem(BLOB_KEY, blob);
}

export function getCachedKeystore(): string | null {
  return sessionStorage.getItem(BLOB_KEY);
}

export function clearKeystore(): void {
  sessionStorage.removeItem(BLOB_KEY);
}

export async function encryptKey(privateKey: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16)).buffer;
  const iv   = crypto.getRandomValues(new Uint8Array(12)).buffer;
  const key  = await deriveKey(password, salt);
  const ct   = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(privateKey),
  );
  return `${b64(salt)}:${b64(iv)}:${b64(ct)}`;
}

export async function decryptKey(blob: string, password: string): Promise<string> {
  const parts = blob.split(':');
  if (parts.length !== 3) {
    throw new Error('malformed keystore');
  }
  const [s, i, c] = parts;
  const key = await deriveKey(password, unb64(s), false);
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(i) }, key, unb64(c));
  } catch {
    throw new Error('wrong password');
  }
  cacheKeystore(blob);
  saveSessionKey(key).catch(() => {});
  return new TextDecoder().decode(plain);
}

export async function decryptWithSessionKey(blob: string): Promise<string | null> {
  const key = await loadSessionKey();
  if (!key) {
    return null;
  }
  const parts = blob.split(':');
  if (parts.length !== 3) {
    return null;
  }
  const [, i, c] = parts;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(i) },
      key,
      unb64(c),
    );
    return new TextDecoder().decode(plain);
  } catch {
    await clearSessionKey();
    return null;
  }
}
