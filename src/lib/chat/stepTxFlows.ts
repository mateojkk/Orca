/**
 * stepTxFlows.ts - deposit, withdraw, send, cheque, and claim multi-step handlers
 */
import { isAddress } from 'viem';
import type { OutputLine } from '../../components/ChatOutput';
import type { Step } from './types';

type TxStepContext = {
  val: string;
  step: NonNullable<Step>;
  setStep: (s: Step) => void;
  push: (...lines: OutputLine[]) => void;
  executeDeposit: (amountUSDC: string) => Promise<boolean>;
  executeWithdraw: (amountUSDC: string) => Promise<boolean>;
  executeSend: (amountUSDC: string, to: string) => Promise<boolean>;
  executeWriteCheque: (amountUSDC: string) => Promise<boolean>;
  executeClaimCheque: (secret: string) => Promise<boolean>;
};

export async function handleTxSteps({
  val, step, setStep, push,
  executeDeposit, executeWithdraw, executeSend, executeWriteCheque, executeClaimCheque
}: TxStepContext): Promise<boolean> {

  if (step.flow === 'deposit' && step.step === 'amount') {
    setStep(null);
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) {
      push({ kind: 'error', text: 'invalid amount' });
      return true;
    }
    await executeDeposit(val);
    return true;
  }

  if (step.flow === 'withdraw' && step.step === 'amount') {
    setStep(null);
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) {
      push({ kind: 'error', text: 'invalid amount' });
      return true;
    }
    await executeWithdraw(val);
    return true;
  }

  if (step.flow === 'send') {
    if (step.step === 'amount') {
      const amount = parseFloat(val);
      if (isNaN(amount) || amount <= 0) {
        push({ kind: 'error', text: 'invalid amount' });
        return true;
      }
      setStep({ flow: 'send', step: 'to', amount: val });
      push({ kind: 'info', text: 'recipient address (0x...):' });
      return true;
    }
    if (step.step === 'to') {
      setStep(null);
      if (!isAddress(val)) {
        push({ kind: 'error', text: `invalid address: ${val}` });
        return true;
      }
      await executeSend(step.amount, val);
      return true;
    }
  }

  if (step.flow === 'cheque' && step.step === 'amount') {
    setStep(null);
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) {
      push({ kind: 'error', text: 'invalid amount' });
      return true;
    }
    await executeWriteCheque(val);
    return true;
  }

  if (step.flow === 'claim' && step.step === 'secret') {
    setStep(null);
    if (!val.startsWith('0x') || val.length !== 66) {
      push({ kind: 'error', text: 'invalid secret format (must be 0x + 64 hex chars)' });
      return true;
    }
    await executeClaimCheque(val);
    return true;
  }

  return false;
}
