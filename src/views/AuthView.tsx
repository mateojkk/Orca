import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCreateWallet, useLoginWithEmail, usePrivy, useWallets } from '@privy-io/react-auth';
import type { Address } from 'viem';
import type { OrcaWallet } from '../lib/orcaWallet';
import { buildPrivyAgentWallet } from '../lib/orcaWallet';
import { sepolia } from '../lib/sepoliaChain';
import authStyles from '../styles/auth.module.css';
import formStyles from '../styles/forms.module.css';
import { EmailForm, CodeForm, UsernameForm } from './AuthForms';
import {
  EMPTY_PENDING_SIGNUP,
  getPostLoginStep,
  normalizeUsername,
  type AuthStep,
} from './authFlow';

interface AuthViewProps {
  onWallet: (w: OrcaWallet) => void;
  onLogout: () => Promise<void> | void;
  onClose?: () => void;
}

export default function AuthView({ onWallet, onClose }: AuthViewProps) {
  const { ready, authenticated, user } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const [step, setStep] = useState<AuthStep>('email');
  const [emailInput, setEmailInput] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [pendingSignup, setPendingSignup] = useState(EMPTY_PENDING_SIGNUP);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: ({ isNewUser }: { isNewUser: boolean }) => {
      setPendingSignup((current) => ({
        ...current,
        email: current.email || emailInput.trim().toLowerCase(),
      }));
      setStep(getPostLoginStep(isNewUser));
    },
    onError: () => setError('Could not verify that code. Please try again.'),
  });

  const connectingRef = useRef(false);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const getConnectionErrorMessage = (e: unknown): string => {
    if (e instanceof Error && e.message) {
      return e.message;
    }
    if (typeof e === 'object' && e && 'message' in e) {
      return String((e as { message?: unknown }).message || 'Wallet connection failed');
    }
    return 'Wallet connection failed';
  };

  const email = useMemo(() => {
    let res = user?.email?.address || '';
    if (!res && user?.linkedAccounts) {
      const linked = user.linkedAccounts.find((a: any) => a.type === 'email');
      if (linked && (linked as any).address) {
        res = (linked as any).address;
      }
    }
    return res;
  }, [user]);

  useEffect(() => {
    if (authenticated && step === 'email') {
      setStep('connecting');
    }
  }, [authenticated, step]);

  useEffect(() => {
    if (!ready || !walletsReady || !authenticated || step !== 'connecting' || connectingRef.current) {
      return;
    }

    const connectPrivyWallet = async () => {
      connectingRef.current = true;
      setBusy(true);
      setError('');

      const maxAttempts = 3;
      let lastError: unknown;

      try {
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            let wallet: any = wallets.find((w: any) => w.walletClientType === 'privy') || wallets[0];
            if (!wallet) {
              const hasEmbedded = user?.linkedAccounts?.some((acc: any) => acc.type === 'wallet' && (acc.walletClientType === 'privy' || acc.connectorType === 'embedded'));
              if (hasEmbedded) {
                // If they have one but it's not in the wallets array yet, just throw so we retry or wait for re-render
                throw new Error('Syncing wallet... Please wait.');
              }
              wallet = await createWallet();
            }

            if (!wallet?.getEthereumProvider) {
              throw new Error('Privy wallet is still initializing');
            }

            if (wallet?.switchChain) {
              await wallet.switchChain(sepolia.id).catch(() => {});
            }
            const provider = await wallet.getEthereumProvider();

            if (pendingSignup.requestedUsername) {
              localStorage.setItem(`orca_user_${wallet.address}`, pendingSignup.requestedUsername);
            }

            const restored = buildPrivyAgentWallet(
              wallet.address as Address,
              wallet.address as Address,
              provider,
              pendingSignup.requestedUsername || (email ? email.split('@')[0] : wallet.address.slice(0, 8))
            );
            onWallet(restored);
            return;
          } catch (e: unknown) {
            lastError = e;
            if (attempt < maxAttempts) {
              setError(`Connection failed. Retrying (${attempt}/${maxAttempts})...`);
              await wait(750 * attempt);
            }
          }
        }

        if (lastError) {
          setError(getConnectionErrorMessage(lastError));
          setStep('error');
        }
      } finally {
        connectingRef.current = false;
        setBusy(false);
      }
    };

    connectPrivyWallet();
  }, [ready, walletsReady, authenticated, step, wallets, email, onWallet, createWallet]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Enter a valid email address');
      return;
    }
    setBusy(true);
    try {
      await sendCode({ email: cleanEmail });
      setEmailInput(cleanEmail);
      setPendingSignup({ ...EMPTY_PENDING_SIGNUP, email: cleanEmail });
      setStep('code');
    } catch (e: any) {
      setError(e.message || 'Could not send code');
    } finally {
      setBusy(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Enter the code');
      return;
    }
    setBusy(true);
    try {
      await loginWithCode({ code: code.trim() });
    } catch (e: any) {
      setError(e.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = normalizeUsername(username);
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    setPendingSignup((current) => ({ ...current, requestedUsername: cleanUsername }));
    setStep('connecting');
  };

  return (
    <div className={authStyles['auth-view']}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
      <div className={authStyles['auth-right']}>
        <div className={authStyles['auth-panel']}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>◈</div>
          <h2 style={{ fontSize: '20px', fontWeight: 400, marginBottom: '4px', color: 'white' }}>ORCA</h2>
          <p className={authStyles['auth-tagline']}>Confidential Chat Wallet Powered By Nox.</p>
          <div className={authStyles['auth-card']}>
            {!ready ? (
              <div className={authStyles['auth-status']}>
                <span>Loading sign in...</span>
              </div>
            ) : step === 'email' && !authenticated ? (
              <EmailForm
                emailInput={emailInput}
                setEmailInput={setEmailInput}
                onSubmit={handleEmailSubmit}
                busy={busy}
                sendingCode={state.status === 'sending-code'}
              />
            ) : step === 'code' && !authenticated ? (
              <CodeForm
                code={code}
                setCode={setCode}
                onSubmit={handleCodeSubmit}
                onBack={() => setStep('email')}
                emailInput={emailInput}
                busy={busy}
                submittingCode={state.status === 'submitting-code'}
              />
            ) : step === 'username' ? (
              <UsernameForm
                username={username}
                setUsername={setUsername}
                onSubmit={handleUsernameSubmit}
                busy={busy}
              />
            ) : (
              <div className={authStyles['auth-status']}>
                <span>{busy ? 'Connecting wallet...' : 'Opening account...'}</span>
              </div>
            )}
          </div>
          {error && (
            <div className={`${formStyles['auth-error']} ${authStyles['auth-error-banner']}`}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
