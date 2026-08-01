import { useEffect, useRef } from 'react';
import ChatBody from './ChatBody';
import ChatFooter from './ChatFooter';
import { useChatController } from '../lib/chat/useChatController';
import { stepMasksInput } from '../lib/chat/stepFlow';
import type { Step } from '../lib/chat/types';
import type { OrcaWallet } from '../lib/orcaWallet';
import type { Contact } from '../lib/contacts';
import styles from '../styles/chatShell.module.css';

interface ChatProps {
  wallet?: OrcaWallet | null;
  onWalletChange?: (wallet: OrcaWallet | null) => void;
  contacts?: Contact[];
}

export default function Chat({ wallet: initialWallet, contacts = [] }: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { lines, cmdHistory, busy, step, handleSubmit } = useChatController(initialWallet, contacts);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  let helperText = '';
  if (step) {
    helperText = getStepHelper(step);
  }

  let submitLabel = 'Send';
  if (step) {
    submitLabel = 'Next';
  }

  const quickActions: string[] = [];

  return (
    <div className={styles['chat-root']}>
      <ChatBody lines={lines} busy={busy} bottomRef={bottomRef} />
      <ChatFooter
        onSubmit={handleSubmit}
        disabled={busy}
        history={cmdHistory}
        isPassword={stepMasksInput(step)}
        helperText={helperText}
        quickActions={quickActions}
        submitLabel={submitLabel}
      />
    </div>
  );
}

function getStepHelper(step: NonNullable<Step>): string {
  switch (step.flow) {
    case 'create-wallet':
      if (step.step === 'password') {
        return 'Choose a strong password - it encrypts your key locally.';
      }
      return 'Re-enter the same password to confirm.';
    case 'import-wallet':
      if (step.step === 'key') {
        return 'Paste your 0x-prefixed private key.';
      }
      if (step.step === 'password') {
        return 'Choose a password to encrypt this key in your browser.';
      }
      return 'Confirm the password.';
    case 'unlock-wallet':
      return 'Enter your wallet password.';
    case 'disconnect':
      return 'Type `yes` to confirm. This clears your wallet from this device.';
    case 'deposit':
      return 'Enter the USDC amount to convert into private cUSDC.';
    case 'withdraw':
      return 'Enter the cUSDC amount to unwrap back to public USDC.';
    case 'send':
      if (step.step === 'amount') {
        return 'Enter the cUSDC amount to send confidentially.';
      }
      return `Sending ${(step as any).amount} cUSDC - enter recipient address.`;
    default:
      return '';
  }
}
