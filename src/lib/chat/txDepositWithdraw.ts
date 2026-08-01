/**
 * txDepositWithdraw.ts - Deposit and withdraw handlers for ORCA chat
 */
import { parseUnits } from 'viem';
import type { OutputLine } from '../../components/ChatOutput';
import type { OrcaWallet } from '../orcaWallet';
import { encryptAmount } from '../noxSdk';
import {
  CONFIDENTIAL_TOKEN_ADDRESS,
  deposit,
  withdraw,
  waitForTx,
  approveUSDC,
  getUsdcAllowance,
} from '../orcaContract';
import { EXPLORER_TX } from '../sepoliaChain';

export async function executeDepositHandler(
  wallet: OrcaWallet | null,
  amountUSDC: string,
  push: (...lines: OutputLine[]) => void,
  setBusy: (busy: boolean) => void
): Promise<boolean> {
  if (!wallet) {
    push({ kind: 'error', text: 'no wallet' });
    return false;
  }
  const parsed = parseFloat(amountUSDC);
  if (isNaN(parsed) || parsed <= 0) {
    push({ kind: 'error', text: 'invalid amount' });
    return false;
  }
  setBusy(true);
  push({ kind: 'info', text: `checking USDC allowance...` });
  try {
    const amountWei = parseUnits(amountUSDC, 6);
    const allowance = await getUsdcAllowance(wallet.address);
    if (allowance < amountWei) {
      push({ kind: 'info', text: `approving ${amountUSDC} USDC for deposit...` });
      const approveHash = await approveUSDC(wallet.walletClient, amountWei);
      push({ kind: 'info', text: 'waiting for approval confirmation...' });
      await waitForTx(approveHash);
      push({ kind: 'success', text: `✓ approval confirmed` });
    }
    
    push({ kind: 'info', text: `converting ${amountUSDC} USDC to cUSDC...` });
    const hash = await deposit(wallet.walletClient, amountWei);
    push({ kind: 'info', text: 'waiting for confirmation...' });
    await waitForTx(hash);
    push(
      { kind: 'success', text: `✓ minted ${amountUSDC} cUSDC` },
      { kind: 'link',    text: `  tx: ${hash.slice(0, 12)}...${hash.slice(-6)} ↗`, href: EXPLORER_TX(hash) },
      { kind: 'separator' },
    );
    return true;
  } catch (e: any) {
    let errMessage = e.message;
    if (e.shortMessage) {
      errMessage = e.shortMessage;
    }
    push({ kind: 'error', text: `deposit failed: ${errMessage}` });
    return false;
  } finally {
    setBusy(false);
  }
}

export async function executeWithdrawHandler(
  wallet: OrcaWallet | null,
  amountUSDC: string,
  push: (...lines: OutputLine[]) => void,
  setBusy: (busy: boolean) => void
): Promise<boolean> {
  if (!wallet) {
    push({ kind: 'error', text: 'no wallet' });
    return false;
  }
  const parsed = parseFloat(amountUSDC);
  if (isNaN(parsed) || parsed <= 0) {
    push({ kind: 'error', text: 'invalid amount' });
    return false;
  }
  setBusy(true);
  push({ kind: 'info', text: `encrypting ${amountUSDC} cUSDC for withdrawal...` });
  try {
    const amountWei = parseUnits(amountUSDC, 6);
    const { handle, proof } = await encryptAmount(amountWei, wallet.walletClient, CONFIDENTIAL_TOKEN_ADDRESS);
    push({ kind: 'info', text: 'submitting withdrawal...' });
    const hash = await withdraw(wallet.walletClient, handle, proof, amountWei);
    push({ kind: 'info', text: 'waiting for confirmation...' });
    await waitForTx(hash);
    push(
      { kind: 'success', text: `✓ unwrapped ${amountUSDC} cUSDC to public USDC` },
      { kind: 'link',    text: `  tx: ${hash.slice(0, 12)}...${hash.slice(-6)} ↗`, href: EXPLORER_TX(hash) },
      { kind: 'separator' },
    );
    return true;
  } catch (e: any) {
    let errMessage = e.message;
    if (e.shortMessage) {
      errMessage = e.shortMessage;
    }
    push({ kind: 'error', text: `withdraw failed: ${errMessage}` });
    return false;
  } finally {
    setBusy(false);
  }
}
