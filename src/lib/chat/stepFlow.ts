/**
 * stepFlow.ts - multi-step chat flow dispatcher for ORCA
 */
import type { OutputLine } from '../../components/ChatOutput';
import type { OrcaWallet } from '../orcaWallet';
import type { Step } from './types';
import {
  handleCreateWalletStep,
  handleImportWalletStep,
  handleUnlockAndDisconnectSteps,
} from './stepWalletFlows';
import { handleTxSteps } from './stepTxFlows';

type StepContext = {
  raw: string;
  step: NonNullable<Step>;
  setStep: (s: Step) => void;
  setWallet: (w: OrcaWallet | null) => void;
  setBusy: (b: boolean) => void;
  setLines: (lines: OutputLine[]) => void;
  push: (...lines: OutputLine[]) => void;
  executeDeposit: (amountUSDC: string) => Promise<boolean>;
  executeWithdraw: (amountUSDC: string) => Promise<boolean>;
  executeSend: (amountUSDC: string, to: string) => Promise<boolean>;
  executeWriteCheque: (amountUSDC: string) => Promise<boolean>;
  executeClaimCheque: (secret: string) => Promise<boolean>;
};

export function stepMasksInput(step: Step): boolean {
  if (!step) {
    return false;
  }
  if (step.step === 'password' || step.step === 'confirm') {
    return true;
  }
  return false;
}

export async function handleStepInput({
  raw, step, setStep, setWallet, setBusy, setLines, push,
  executeDeposit, executeWithdraw, executeSend, executeWriteCheque, executeClaimCheque
}: StepContext): Promise<boolean> {
  const val = raw.trim();
  const masked = stepMasksInput(step);
  
  let inputText = val;
  if (masked) {
    inputText = '••••••';
  }
  push({ kind: 'input', text: inputText });

  if (step.flow === 'create-wallet') {
    return handleCreateWalletStep(val, step, setStep, setWallet, setBusy, push);
  }

  if (step.flow === 'import-wallet') {
    return handleImportWalletStep(val, step, setStep, setWallet, setBusy, push);
  }

  if (step.flow === 'unlock-wallet' || step.flow === 'disconnect') {
    return handleUnlockAndDisconnectSteps(val, step, setStep, setWallet, setBusy, setLines, push);
  }

  return handleTxSteps({
    val, step, setStep, push,
    executeDeposit, executeWithdraw, executeSend, executeWriteCheque, executeClaimCheque
  });
}
