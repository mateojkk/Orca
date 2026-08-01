/**
 * txTransfers.ts - Confidential transfer and cheque handlers for ORCA chat
 */
import { parseUnits, isAddress } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { OutputLine } from '../../components/ChatOutput';
import type { OrcaWallet } from '../orcaWallet';
import { encryptAmount } from '../noxSdk';
import { CONFIDENTIAL_TOKEN_ADDRESS, isUserInitialized } from '../orcaContract';
import { EXPLORER_TX } from '../sepoliaChain';
import { RelayResponseSchema } from '../schemas';

const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || 'http://localhost:8080';

export async function executeSendHandler(
  wallet: OrcaWallet | null,
  amountUSDC: string,
  to: string,
  push: (...lines: OutputLine[]) => void,
  setBusy: (busy: boolean) => void
): Promise<boolean> {
  if (!wallet) {
    push({ kind: 'error', text: 'no wallet' });
    return false;
  }
  if (!isAddress(to)) {
    push({ kind: 'error', text: `invalid address: ${to}` });
    return false;
  }
  const parsed = parseFloat(amountUSDC);
  if (isNaN(parsed) || parsed <= 0) {
    push({ kind: 'error', text: 'invalid amount' });
    return false;
  }
  setBusy(true);
  push({ kind: 'info', text: `encrypting ${amountUSDC} USDC for confidential send...` });
  try {
    const amountWei = parseUnits(amountUSDC, 6);
    const { handle, proof } = await encryptAmount(amountWei, wallet.walletClient, CONFIDENTIAL_TOKEN_ADDRESS);
    push({ kind: 'info', text: `submitting gasless transfer → ${to.slice(0, 8)}...${to.slice(-6)}` });

    const isOrcaUser = await isUserInitialized(to as `0x${string}`);
    const endpoint = isOrcaUser ? '/api/relay/submit' : '/api/relay/withdraw';
    
    if (!isOrcaUser) {
      push({ kind: 'info', text: `recipient is not an ORCA user, withdrawing directly to their wallet...` });
    }

    const resp = await fetch(`${RELAYER_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: wallet.address,
        to,
        handle,
        proof,
        plaintextAmount: amountWei.toString() // Needed for withdraw
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      let detailMsg = `relayer error (${resp.status})`;
      if (err.detail) {
        detailMsg = err.detail;
      }
      throw new Error(detailMsg);
    }

    const rawJson = await resp.json();
    const { txHash } = RelayResponseSchema.parse(rawJson);

    push(
      { kind: 'success', text: `✓ confidential transfer submitted` },
      { kind: 'link',    text: `  tx: ${txHash.slice(0, 12)}...${txHash.slice(-6)} ↗`, href: EXPLORER_TX(txHash) },
      { kind: 'separator' },
    );
    return true;
  } catch (e: any) {
    push({ kind: 'error', text: `send failed: ${e.message}` });
    return false;
  } finally {
    setBusy(false);
  }
}

export async function executeWriteChequeHandler(
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
  push({ kind: 'info', text: `encrypting ${amountUSDC} USDC for cheque...` });
  try {
    const amountWei = parseUnits(amountUSDC, 6);
    const { handle, proof } = await encryptAmount(amountWei, wallet.walletClient, CONFIDENTIAL_TOKEN_ADDRESS);
    
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const chequeId = account.address;

    push({ kind: 'info', text: `submitting cheque generation...` });

    const resp = await fetch(`${RELAYER_URL}/api/relay/cheque/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: wallet.address,
        chequeId,
        handle,
        proof,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      let detailMsg = `relayer error (${resp.status})`;
      if (err.detail) {
        detailMsg = err.detail;
      }
      throw new Error(detailMsg);
    }

    const rawJson = await resp.json();
    const { txHash } = RelayResponseSchema.parse(rawJson);

    push(
      { kind: 'success', text: `✓ confidential cheque created` },
      { kind: 'link',    text: `  tx: ${txHash.slice(0, 12)}...${txHash.slice(-6)} ↗`, href: EXPLORER_TX(txHash) },
      { kind: 'separator' },
      { kind: 'output',  text: `  Share this secret to claim: ${privateKey}` },
      { kind: 'separator' },
    );
    return true;
  } catch (e: any) {
    push({ kind: 'error', text: `cheque generation failed: ${e.message}` });
    return false;
  } finally {
    setBusy(false);
  }
}

export async function executeClaimChequeHandler(
  wallet: OrcaWallet | null,
  secret: string,
  push: (...lines: OutputLine[]) => void,
  setBusy: (busy: boolean) => void
): Promise<boolean> {
  if (!wallet) {
    push({ kind: 'error', text: 'no wallet' });
    return false;
  }
  if (!secret.startsWith('0x') || secret.length !== 66) {
    push({ kind: 'error', text: 'invalid secret format (must be 0x + 64 hex chars)' });
    return false;
  }
  setBusy(true);
  push({ kind: 'info', text: `signing claim and submitting...` });
  try {
    const privateKey = secret as `0x${string}`;
    const account = privateKeyToAccount(privateKey);
    
    const signature = await account.signMessage({
      message: { raw: wallet.address }
    });

    const resp = await fetch(`${RELAYER_URL}/api/relay/cheque/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: wallet.address,
        signature,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      let detailMsg = `relayer error (${resp.status})`;
      if (err.detail) {
        detailMsg = err.detail;
      }
      throw new Error(detailMsg);
    }

    const rawJson = await resp.json();
    const { txHash } = RelayResponseSchema.parse(rawJson);

    push(
      { kind: 'success', text: `✓ cheque claimed into your confidential balance` },
      { kind: 'link',    text: `  tx: ${txHash.slice(0, 12)}...${txHash.slice(-6)} ↗`, href: EXPLORER_TX(txHash) },
      { kind: 'separator' },
    );
    return true;
  } catch (e: any) {
    push({ kind: 'error', text: `claim failed: ${e.message}` });
    return false;
  } finally {
    setBusy(false);
  }
}
