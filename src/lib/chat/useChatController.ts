/**
 * useChatController.ts - ORCA chat state machine
 */
import { useCallback, useEffect, useState } from 'react';
import { BOOT_LINES } from './constants';
import type { OutputLine } from '../../components/ChatOutput';
import { parseCommand } from './commandParser';
import { handleCommand } from './commandFlow';
import { handleStepInput, stepMasksInput } from './stepFlow';
import type { Step } from './types';
import type { OrcaWallet } from '../orcaWallet';
import { walletExists } from '../orcaWallet';
import {
  executeDepositHandler,
  executeWithdrawHandler,
} from './txDepositWithdraw';
import {
  executeSendHandler,
  executeWriteChequeHandler,
  executeClaimChequeHandler,
} from './txTransfers';

const SESSION_KEY = 'orca_lines';

export function useChatController(initialWallet?: OrcaWallet | null) {
  const [lines, setLines]           = useState<OutputLine[]>(BOOT_LINES);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [busy, setBusy]             = useState(false);
  const [wallet, setWallet]         = useState<OrcaWallet | null>(initialWallet || null);
  const [step, setStep]             = useState<Step>(null);

  useEffect(() => {
    if (initialWallet) {
      setWallet(initialWallet);
    }
  }, [initialWallet]);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        setLines(JSON.parse(saved));
      } catch {
        /* ignore invalid session cache */
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(lines.slice(-120)));
  }, [lines]);

  useEffect(() => {
    if (!wallet && walletExists()) {
      setLines((prev) => [
        ...prev,
        { kind: 'separator' },
        { kind: 'info', text: '  stored wallet found - type `unlock` to connect' },
        { kind: 'separator' },
      ]);
    }
  }, [wallet]);

  const push = useCallback((...newLines: OutputLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const executeDeposit = useCallback(async (amountUSDC: string): Promise<boolean> => {
    return executeDepositHandler(wallet, amountUSDC, push, setBusy);
  }, [wallet, push]);

  const executeWithdraw = useCallback(async (amountUSDC: string): Promise<boolean> => {
    return executeWithdrawHandler(wallet, amountUSDC, push, setBusy);
  }, [wallet, push]);

  const executeSend = useCallback(async (amountUSDC: string, to: string): Promise<boolean> => {
    return executeSendHandler(wallet, amountUSDC, to, push, setBusy);
  }, [wallet, push]);

  const executeWriteCheque = useCallback(async (amountUSDC: string): Promise<boolean> => {
    return executeWriteChequeHandler(wallet, amountUSDC, push, setBusy);
  }, [wallet, push]);

  const executeClaimCheque = useCallback(async (secret: string): Promise<boolean> => {
    return executeClaimChequeHandler(wallet, secret, push, setBusy);
  }, [wallet, push]);

  const handleSubmit = useCallback(async (raw: string) => {
    if (!raw.trim()) {
      return;
    }

    if (step) {
      await handleStepInput({
        raw, step, setStep, setWallet, setBusy, setLines, push,
        executeDeposit, executeWithdraw, executeSend, executeWriteCheque, executeClaimCheque
      });
      return;
    }

    const masked = stepMasksInput(step);
    let inputText = raw;
    if (masked) {
      inputText = '••••••';
    }
    push({ kind: 'input', text: inputText });
    setCmdHistory((h) => [raw, ...h].slice(0, 50));

    const cmd = parseCommand(raw);
    await handleCommand({
      cmd, wallet, setStep, setLines,
      bootLines: BOOT_LINES, push,
      executeSend, executeWriteCheque, executeClaimCheque
    });
  }, [wallet, step, push, executeDeposit, executeWithdraw, executeSend, executeWriteCheque, executeClaimCheque]);

  return {
    lines,
    cmdHistory,
    busy,
    wallet,
    step,
    handleSubmit,
    setWallet,
  };
}
