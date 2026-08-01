/**
 * stepWalletFlows.ts - wallet creation, import, unlock, and disconnect step handlers
 */
import type { OutputLine } from '../../components/ChatOutput';
import type { OrcaWallet } from '../orcaWallet';
import { createWallet, importWallet, unlockWallet, destroyWallet } from '../orcaWallet';
import { clearHandleClient } from '../noxSdk';
import type { Step } from './types';
import { BOOT_LINES } from './constants';

export async function handleCreateWalletStep(
  val: string,
  step: NonNullable<Step> & { flow: 'create-wallet' },
  setStep: (s: Step) => void,
  setWallet: (w: OrcaWallet | null) => void,
  setBusy: (b: boolean) => void,
  push: (...lines: OutputLine[]) => void
): Promise<boolean> {
  if (step.step === 'password') {
    if (val.length < 6) {
      push({ kind: 'error', text: 'password too short (min 6 chars)' });
      return true;
    }
    setStep({ flow: 'create-wallet', step: 'confirm', password: val });
    push({ kind: 'info', text: 'confirm password:' });
    return true;
  }
  if (step.step === 'confirm') {
    if (val !== step.password) {
      push({ kind: 'error', text: 'passwords do not match - try again' });
      setStep({ flow: 'create-wallet', step: 'password' });
      push({ kind: 'info', text: 'choose a password:' });
      return true;
    }
    setStep(null);
    setBusy(true);
    push({ kind: 'info', text: 'generating wallet...' });
    try {
      const wallet = await createWallet(step.password);
      setWallet(wallet);
      push(
        { kind: 'success', text: '✓ wallet created' },
        { kind: 'output',  text: `  address: ${wallet.address}` },
        { kind: 'separator' },
        { kind: 'info',    text: '  fund this address with Sepolia USDC, then type `deposit <amount>`' },
        { kind: 'separator' },
      );
    } catch (e: any) {
      push({ kind: 'error', text: `failed: ${e.message}` });
    } finally {
      setBusy(false);
    }
    return true;
  }
  return false;
}

export async function handleImportWalletStep(
  val: string,
  step: NonNullable<Step> & { flow: 'import-wallet' },
  setStep: (s: Step) => void,
  setWallet: (w: OrcaWallet | null) => void,
  setBusy: (b: boolean) => void,
  push: (...lines: OutputLine[]) => void
): Promise<boolean> {
  if (step.step === 'key') {
    let pk = val;
    if (!val.startsWith('0x')) {
      pk = `0x${val}`;
    }
    if (pk.length !== 66) {
      push({ kind: 'error', text: 'invalid key - must be 0x + 64 hex chars' });
      return true;
    }
    setStep({ flow: 'import-wallet', step: 'password', privateKey: pk });
    push({ kind: 'info', text: 'choose a password to encrypt this key:' });
    return true;
  }
  if (step.step === 'password') {
    if (val.length < 6) {
      push({ kind: 'error', text: 'password too short (min 6 chars)' });
      return true;
    }
    setStep({ flow: 'import-wallet', step: 'confirm', privateKey: step.privateKey, password: val });
    push({ kind: 'info', text: 'confirm password:' });
    return true;
  }
  if (step.step === 'confirm') {
    if (val !== step.password) {
      push({ kind: 'error', text: 'passwords do not match - try again' });
      setStep({ flow: 'import-wallet', step: 'password', privateKey: step.privateKey });
      push({ kind: 'info', text: 'choose a password:' });
      return true;
    }
    setStep(null);
    setBusy(true);
    push({ kind: 'info', text: 'importing wallet...' });
    try {
      const wallet = await importWallet(step.privateKey, step.password);
      setWallet(wallet);
      push(
        { kind: 'success', text: '✓ wallet imported' },
        { kind: 'output',  text: `  address: ${wallet.address}` },
        { kind: 'separator' },
      );
    } catch (e: any) {
      push({ kind: 'error', text: `failed: ${e.message}` });
    } finally {
      setBusy(false);
    }
    return true;
  }
  return false;
}

export async function handleUnlockAndDisconnectSteps(
  val: string,
  step: NonNullable<Step>,
  setStep: (s: Step) => void,
  setWallet: (w: OrcaWallet | null) => void,
  setBusy: (b: boolean) => void,
  setLines: (lines: OutputLine[]) => void,
  push: (...lines: OutputLine[]) => void
): Promise<boolean> {
  if (step.flow === 'unlock-wallet' && step.step === 'password') {
    setStep(null);
    setBusy(true);
    try {
      const wallet = await unlockWallet(val);
      setWallet(wallet);
      push(
        { kind: 'success', text: `✓ unlocked - ${wallet.address}` },
        { kind: 'separator' },
      );
    } catch (e: any) {
      push({ kind: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
    return true;
  }

  if (step.flow === 'disconnect' && step.step === 'confirm') {
    setStep(null);
    if (val.toLowerCase() === 'yes') {
      destroyWallet();
      clearHandleClient();
      setWallet(null);
      setLines(BOOT_LINES);
      push({ kind: 'info', text: 'wallet locked - localStorage cleared' });
    } else {
      push({ kind: 'info', text: 'disconnect cancelled' });
    }
    return true;
  }

  return false;
}
