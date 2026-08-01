/**
 * useAppState - unified wallet, contact, and balance state for ORCA UI
 */
import { useState, useEffect, useCallback } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { getContacts, addContact, removeContact } from '../lib/contacts';
import type { Contact } from '../lib/contacts';
import type { OrcaWallet } from '../lib/orcaWallet';
import { getUsdcBalance, getBalanceHandle, getUsdcAllowance, approveUSDC, deposit, waitForTx } from '../lib/orcaContract';
import { baseApi } from '../api';
import { decryptBalance } from '../lib/noxSdk';

export interface AssetBalance {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  balance: string;
  rawBalance: bigint;
}

export function useAppState() {
  const [wallet, setWallet] = useState<OrcaWallet | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [balance, setBalance] = useState<string | null>('0.00');
  const [confidentialBalance, setConfidentialBalance] = useState<string | null>('0.00');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [assets, setAssets] = useState<AssetBalance[]>([]);
  const [restoring] = useState(false);
  
  // Any public USDC sent to an ORCA address is automatically wrapped into cUSDC.
  const [isSweeping, setIsSweeping] = useState(false);

  useEffect(() => {
    if (!wallet) {
      setContacts([]);
      return;
    }
    getContacts(wallet.address).then(setContacts).catch(() => setContacts([]));
  }, [wallet, wallet?.address]);

  const refreshBalance = useCallback(async () => {
    if (!wallet) {
      return;
    }
    setBalanceLoading(true);
    try {
      const usdcBalStr = await getUsdcBalance(wallet.address);
      const parsedUsdc = parseFloat(usdcBalStr).toFixed(2);
      setBalance(parsedUsdc);

      let confidentialStr = '0.00';
      try {
        const handle = await getBalanceHandle(wallet.address);
        const decrypted = await decryptBalance(handle, wallet.walletClient);
        if (decrypted !== null) {
          confidentialStr = parseFloat(formatUnits(decrypted, 6)).toFixed(2);
        }
      } catch {
        /* decryption pending */
      }
      setConfidentialBalance(confidentialStr);

      setAssets([
        {
          symbol: 'cUSDC',
          name: 'Confidential USDC',
          address: '0x0000000000000000000000000000000000000000',
          decimals: 6,
          balance: confidentialStr,
          rawBalance: parseUnits(confidentialStr, 6),
        },
      ]);
    } catch {
      setBalance('0.00');
    } finally {
      setBalanceLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const sweepUSDC = useCallback(async () => {
    if (!wallet || !balance || isSweeping) return;

    const rawBalance = parseUnits(balance, 6);
    if (rawBalance > 0n) {
      setIsSweeping(true);
      try {
        const allowance = await getUsdcAllowance(wallet.address);
        if (allowance < rawBalance) {
          console.log("Checking gas funds...");
          try {
            await baseApi.post('/api/relay/fund', { address: wallet.address });
          } catch (fundErr) {
            console.error("Failed to fund wallet, proceeding anyway...", fundErr);
          }
          
          console.log("Approving USDC for cUSDC conversion...");
          const approveHash = await approveUSDC(wallet.walletClient, rawBalance);
          await waitForTx(approveHash);
        }
        console.log("Converting USDC to cUSDC...");
        const depositHash = await deposit(wallet.walletClient, rawBalance);
        await waitForTx(depositHash);
        await refreshBalance();
      } catch (e) {
        console.error("USDC to cUSDC conversion failed:", e);
      } finally {
        setIsSweeping(false);
      }
    }
  }, [wallet, balance, isSweeping, refreshBalance]);

  const refreshContacts = useCallback(async () => {
    const c = await getContacts(wallet?.address);
    setContacts(c);
    return c;
  }, [wallet?.address]);

  const addContactFn = useCallback(async (name: string, address: string) => {
    await addContact(name, address, wallet?.address);
    await refreshContacts();
  }, [refreshContacts, wallet?.address]);

  const removeContactFn = useCallback(async (name: string) => {
    await removeContact(name, wallet?.address);
    await refreshContacts();
  }, [refreshContacts, wallet?.address]);

  return {
    wallet,
    setWallet,
    restoring,
    contacts,
    balance,
    confidentialBalance,
    balanceLoading,
    assets,
    refreshBalance,
    refreshContacts,
    addContact: addContactFn,
    removeContact: removeContactFn,
    sweepUSDC,
    isSweeping,
  };
}
