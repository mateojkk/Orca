/**
 * orcaWallet.ts - Local and Privy wallet lifecycle for ORCA
 */
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import type { Account, Address } from 'viem';
import { sepolia } from './sepoliaChain';
import { baseApi, setAuthToken } from '../api';

const STORAGE_KEY = 'orca_keystore';
const RPC = import.meta.env.VITE_SEPOLIA_RPC || 'https://rpc.sepolia.org';
export interface OrcaWallet {
  readonly address: `0x${string}`;
  readonly account: Account;
  readonly walletClient: any;
  readonly publicClient: any;
  username: string;
  readonly authProvider?: 'password' | 'privy';
  readonly pfp?: string;
}

export function buildClients(
  privateKey: `0x${string}`,
  username: string,
  pfp?: string
): OrcaWallet {
  const account = privateKeyToAccount(privateKey);
  const transport = http(RPC);
  return {
    address: account.address,
    account,
    username,
    pfp,
    walletClient: createWalletClient({ account, chain: sepolia, transport }),
    publicClient: createPublicClient({ chain: sepolia, transport }),
  };
}

export async function createFromPrivyWallet(
  address: Address,
  account: Account,
  provider: unknown,
  accessToken: string,
  email?: string,
  requestedUsername?: string,
  inviteCode?: string
): Promise<OrcaWallet> {
  try {
    const resp = await baseApi.post(
      '/auth/privy',
      {
        email: email || '',
        username: requestedUsername || '',
        walletAddress: address,
        inviteCode: inviteCode || '',
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const token = resp.data?.token;
    if (token) {
      setAuthToken(token);
    }
  } catch {
    /* fallback when relayer auth endpoint is not configured */
  }

  let username = address.slice(0, 8);
  if (requestedUsername) {
    username = requestedUsername;
  } else if (email) {
    username = email.split('@')[0];
  }

  return {
    address,
    account,
    username: localStorage.getItem(`orca_user_${address}`) || username,
    authProvider: 'privy',
    walletClient: createWalletClient({ account, chain: sepolia, transport: custom(provider as any) }),
    publicClient: createPublicClient({ chain: sepolia, transport: http(RPC) }),
  };
}

export function buildPrivyAgentWallet(
  address: Address,
  account: any,
  provider: unknown,
  username: string,
  pfp?: string
): OrcaWallet {
  return {
    address,
    account,
    username: localStorage.getItem(`orca_user_${address}`) || username,
    pfp,
    authProvider: 'privy',
    walletClient: createWalletClient({ account, chain: sepolia, transport: custom(provider as any) }),
    publicClient: createPublicClient({ chain: sepolia, transport: http(RPC) }),
  };
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 200_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptKey(pk: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const data = new TextEncoder().encode(pk);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  const blob = {
    s: btoa(String.fromCharCode(...salt)),
    i: btoa(String.fromCharCode(...iv)),
    c: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
  return JSON.stringify(blob);
}

async function decryptKey(blob: string, password: string): Promise<string> {
  const { s, i, c } = JSON.parse(blob);
  const salt = Uint8Array.from(atob(s), (x) => x.charCodeAt(0));
  const iv   = Uint8Array.from(atob(i), (x) => x.charCodeAt(0));
  const ct   = Uint8Array.from(atob(c), (x) => x.charCodeAt(0));
  const key  = await deriveKey(password, salt);
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('wrong password');
  }
}

export async function createWallet(password: string, username = 'user'): Promise<OrcaWallet> {
  const pk   = generatePrivateKey();
  const blob = await encryptKey(pk, password);
  localStorage.setItem(STORAGE_KEY, blob);
  return buildClients(pk, username);
}

export async function importWallet(rawPk: string, password: string, username = 'user'): Promise<OrcaWallet> {
  let pk = rawPk;
  if (!rawPk.startsWith('0x')) {
    pk = `0x${rawPk}`;
  }
  if (pk.length !== 66) {
    throw new Error('invalid private key - must be 0x + 64 hex chars');
  }
  const blob = await encryptKey(pk, password);
  localStorage.setItem(STORAGE_KEY, blob);
  return buildClients(pk as `0x${string}`, username);
}

export async function unlockWallet(password: string): Promise<OrcaWallet> {
  const blob = localStorage.getItem(STORAGE_KEY);
  if (!blob) {
    throw new Error('no wallet found');
  }
  const pk = await decryptKey(blob, password);
  return buildClients(pk as `0x${string}`, 'user');
}

export function walletExists(): boolean {
  let res = false;
  if (localStorage.getItem(STORAGE_KEY)) {
    res = true;
  }
  return res;
}

export function destroyWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
}
