import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { usePrivy } from '@privy-io/react-auth';
import { useAppState } from './hooks/useAppState';
import AuthView from './views/AuthView';
import LandingPage from './components/LandingPage';
import AppShell from './components/AppShell';
import type { OrcaWallet } from './lib/orcaWallet';
import { destroyWallet } from './lib/orcaWallet';

export default function App() {
  const { authenticated, logout, ready } = usePrivy();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    wallet,
    setWallet,
    restoring,
    contacts,
    balance,
    confidentialBalance,
    balanceLoading,
    assets,
    refreshBalance,
    addContact,
    removeContact,
  } = useAppState();

  const handleWallet = (w: OrcaWallet) => {
    setShowAuthModal(false);
    setWallet(w);
  };

  const handleLogout = async () => {
    setWallet(null);
    setShowAuthModal(false);
    if (authenticated) {
      await logout().catch(() => {});
    }
    destroyWallet();
    sessionStorage.removeItem('orca_lines');
  };

  useEffect(() => {
    if (ready && authenticated && !wallet) {
      setShowAuthModal(true);
    }
  }, [ready, authenticated, wallet]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--fg)',
            border: '1px solid var(--border-hl)',
            fontSize: '13px',
            fontFamily: 'var(--font-ui)',
          },
          success: { iconTheme: { primary: 'var(--accent)', secondary: '#000' } },
          error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
        }}
      />

      {(!ready || restoring) ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          background: 'var(--bg)',
          color: 'var(--fg-muted)',
          fontSize: '13px',
          fontFamily: 'var(--font-ui)',
          gap: '10px',
        }}>
          ◈ ORCA
        </div>
      ) : wallet ? (
        <AppShell
          wallet={wallet}
          contacts={contacts}
          balance={balance}
          confidentialBalance={confidentialBalance}
          balanceLoading={balanceLoading}
          assets={assets}
          onRefreshBalance={refreshBalance}
          onAddContact={addContact}
          onRemoveContact={removeContact}
          onLock={handleLogout}
          onWalletChange={setWallet}
        />
      ) : showAuthModal ? (
        <AuthView
          onWallet={handleWallet}
          onLogout={handleLogout}
          onClose={() => setShowAuthModal(false)}
        />
      ) : (
        <LandingPage onOpenAuth={() => setShowAuthModal(true)} />
      )}
    </>
  );
}
