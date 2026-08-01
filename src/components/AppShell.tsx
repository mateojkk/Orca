import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import type { OrcaWallet } from '../lib/orcaWallet';
import type { Contact } from '../lib/contacts';
import type { AssetBalance } from '../hooks/useAppState';
import HomeView from '../views/HomeView';
import ContactsView from '../views/ContactsView';
import SettingsView from '../views/SettingsView';

import Chat from './Chat';
import styles from '../styles/appShell.module.css';

interface AppShellProps {
  wallet: OrcaWallet;
  contacts: Contact[];
  balance: string | null;
  confidentialBalance?: string | null;
  balanceLoading: boolean;
  assets: AssetBalance[];
  onRefreshBalance: () => void;
  onAddContact: (name: string, address: string) => Promise<void>;
  onRemoveContact: (name: string) => Promise<void>;
  onLock: () => void;
  onWalletChange: (wallet: OrcaWallet | null) => void;
  sweepUSDC: () => Promise<void>;
  isSweeping: boolean;
}

export default function AppShell({
  wallet,
  contacts,
  balance,
  confidentialBalance,
  balanceLoading,
  assets,
  onRefreshBalance,
  onAddContact,
  onRemoveContact,
  onLock,
  onWalletChange,
  sweepUSDC,
  isSweeping,
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const shortAddr = `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`;

  return (
    <div className={styles['app-shell']}>
      {/* Header */}
      <header className={styles['app-header']}>
        <div className={styles['app-logo']}>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>◈ <span style={{ color: 'white' }}>ORCA</span></span>
        </div>
        <div
          className={styles['app-user-badge']}
          onClick={() => navigate('/settings')}
        >
          <span className={styles['user-dot']} />
          @{wallet.username} · {shortAddr}
        </div>
      </header>

      {/* Content */}
      <main className={styles['app-content']}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={
            <HomeView
              wallet={wallet}
              balance={balance}
              confidentialBalance={confidentialBalance}
              balanceLoading={balanceLoading}
              assets={assets}
              onRefresh={onRefreshBalance}
              onSweep={sweepUSDC}
              isSweeping={isSweeping}
            />
          } />
          <Route path="/contacts" element={
            <ContactsView
              contacts={contacts}
              onAdd={onAddContact}
              onRemove={onRemoveContact}
            />
          } />
          <Route path="/chat" element={
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Chat wallet={wallet} onWalletChange={onWalletChange} />
            </div>
          } />
          <Route path="/settings" element={
            <SettingsView wallet={wallet} onLock={onLock} onWalletChange={onWalletChange} />
          } />
        </Routes>
      </main>

      {/* Tab bar */}
      <nav className={styles['tab-bar']}>
        <TabItem
          id="home"
          label="Home"
          active={location.pathname === '/home'}
          onClick={() => navigate('/home')}
          icon={
            <svg className={styles['tab-icon']} viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        />
        <TabItem
          id="chat"
          label="Chat"
          active={location.pathname === '/chat'}
          onClick={() => navigate('/chat')}
          icon={
            <svg className={styles['tab-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          }
        />
        <TabItem
          id="contacts"
          label="Contacts"
          active={location.pathname === '/contacts'}
          onClick={() => navigate('/contacts')}
          icon={
            <svg className={styles['tab-icon']} viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
        <TabItem
          id="faucet"
          label="Faucet"
          active={false}
          onClick={() => window.open('https://faucet.circle.com/', '_blank')}
          icon={
            <svg className={styles['tab-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </nav>
    </div>
  );
}

function TabItem({
  id,
  label,
  icon,
  active,
  onClick,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  let itemClass = styles['tab-item'];
  if (active) {
    itemClass = `${styles['tab-item']} ${styles.active}`;
  }

  return (
    <button
      id={`tab-${id}`}
      className={itemClass}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
      <span className={styles['tab-label']}>{label}</span>
    </button>
  );
}
