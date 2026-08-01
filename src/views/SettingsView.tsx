import { useState } from 'react';
import toast from 'react-hot-toast';
import type { OrcaWallet } from '../lib/orcaWallet';
import { EXPLORER_ADDR } from '../lib/sepoliaChain';
import settingsStyles from '../styles/settings.module.css';
import layoutStyles from '../styles/layout.module.css';

interface SettingsViewProps {
  wallet: OrcaWallet;
  onLock: () => void;
  onWalletChange: (wallet: OrcaWallet | null) => void;
}

export default function SettingsView({ wallet, onLock, onWalletChange }: SettingsViewProps) {
  const shortAddr = `${wallet.address.slice(0, 10)}…${wallet.address.slice(-8)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast.success('Address copied');
  };

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsernameVal, setEditUsernameVal] = useState(wallet.username);

  const startEditUsername = () => {
    setEditUsernameVal(wallet.username);
    setIsEditingUsername(true);
  };

  const saveUsername = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editUsernameVal && editUsernameVal.trim()) {
      const trimmed = editUsernameVal.trim();
      localStorage.setItem(`orca_user_${wallet.address}`, trimmed);
      wallet.username = trimmed;
      onWalletChange({ ...wallet });
      toast.success('Username updated');
    }
    setIsEditingUsername(false);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingUsername(false);
  };

  return (
    <div>
      {/* Wallet info */}
      <div className={settingsStyles['settings-group']}>
        <div className={layoutStyles['section-title']} style={{ padding: '0 0 4px' }}>Wallet</div>

        <div className={settingsStyles['settings-item']} onClick={copyAddress}>
          <div className={settingsStyles['settings-item-label']}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Address
          </div>
          <span className={settingsStyles['settings-item-value']}>{shortAddr}</span>
        </div>

        <div className={settingsStyles['settings-item']} onClick={!isEditingUsername ? startEditUsername : undefined} style={{ cursor: isEditingUsername ? 'default' : 'pointer' }}>
          <div className={settingsStyles['settings-item-label']}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
            Username
          </div>
          {isEditingUsername ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: 'var(--fg-muted)' }}>@</span>
              <input
                type="text"
                value={editUsernameVal}
                onChange={(e) => setEditUsernameVal(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  width: '120px',
                  outline: 'none'
                }}
                autoFocus
              />
              <button onClick={saveUsername} style={{ background: '#00ff66', color: 'black', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Save</button>
              <button onClick={cancelEdit} style={{ background: 'transparent', color: 'var(--fg-muted)', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
            </div>
          ) : (
            <span className={settingsStyles['settings-item-value']}>@{wallet.username}</span>
          )}
        </div>

        <a
          className={settingsStyles['settings-item']}
          href={EXPLORER_ADDR(wallet.address)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <div className={settingsStyles['settings-item-label']}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View on Sepolia Explorer
          </div>
        </a>
      </div>

      {/* Session */}
      <div className={settingsStyles['settings-group']}>
        <div className={layoutStyles['section-title']} style={{ padding: '0 0 4px' }}>Session</div>
        <div className={settingsStyles['settings-item']} onClick={onLock}>
          <div className={settingsStyles['settings-item-label']}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </div>
        </div>
      </div>
    </div>
  );
}
