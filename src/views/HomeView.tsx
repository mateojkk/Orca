import { useEffect, useState } from 'react';
import type { OrcaWallet } from '../lib/orcaWallet';
import type { AssetBalance } from '../hooks/useAppState';
import homeStyles from '../styles/home.module.css';
import TransactionsView from './TransactionsView';
import { getUserPreferences, updateUserPreferences } from '../api/preferences';

interface HomeViewProps {
  wallet: OrcaWallet;
  balance: string | null;
  confidentialBalance?: string | null;
  balanceLoading: boolean;
  assets?: AssetBalance[]; // Kept for backwards compatibility just in case but optional
  onRefresh: () => void;
}

export default function HomeView({
  wallet,
  balance,
  confidentialBalance,
  balanceLoading,
  assets: _assets,
  onRefresh,
}: HomeViewProps) {
  const [balanceVisible, setBalanceVisible] = useState<boolean>(true);

  useEffect(() => {
    getUserPreferences(wallet.address)
      .then(prefs => {
        setBalanceVisible(prefs.balance_visible);
      })
      .catch(() => {});
  }, [wallet.address]);

  const toggleBalance = async () => {
    const newVal = !balanceVisible;
    setBalanceVisible(newVal);
    try {
      await updateUserPreferences(wallet.address, newVal);
    } catch {
      // Revert if API fails
      setBalanceVisible(!newVal);
    }
  };

  const handleRefresh = () => {
    onRefresh();
  };

  let totalBalDisplay = '-';
  if (balanceVisible) {
    if (confidentialBalance) {
      totalBalDisplay = `${confidentialBalance} cUSDC`;
    }
  } else {
    totalBalDisplay = '******';
  }

  return (
    <div className={homeStyles['home-container']}>
      {/* Balance card */}
      <div className={homeStyles['balance-card']}>
        <div className={homeStyles['balance-label']}>Private cUSDC Balance</div>
        <div className={homeStyles['balance-amount']}>
          {balanceLoading ? (
            <span style={{ color: 'var(--fg-muted)', fontSize: 24 }}>Loading…</span>
          ) : (
            <span>{totalBalDisplay}</span>
          )}
        </div>

        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--fg-muted)' }}>
          Pending public USDC conversion: {balanceVisible ? `${balance || '0.00'} USDC` : '******'}
        </div>

        <div className={homeStyles['balance-actions']}>
          <button
            className={homeStyles['balance-refresh']}
            onClick={toggleBalance}
            title={balanceVisible ? 'Hide balance' : 'Show balance'}
          >
            {balanceVisible ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.86 21.86 0 0 1 5.06-6.94" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
          <button
            className={homeStyles['balance-refresh']}
            onClick={handleRefresh}
            title="Refresh balance"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={balanceLoading ? homeStyles.spinning : ''}
            >
              <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        </div>
      </div>



      <TransactionsView wallet={wallet} />
    </div>
  );
}
