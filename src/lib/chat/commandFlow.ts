/**
 * commandFlow.ts - handles parsed ORCA commands
 */
import type { OutputLine } from '../../components/ChatOutput';
import type { OrcaWallet } from '../orcaWallet';
import { walletExists } from '../orcaWallet';
import { EXPLORER_ADDR } from '../sepoliaChain';
import type { Command } from './commandParser';
import type { Step } from './types';

type CommandContext = {
  cmd: Command;
  wallet: OrcaWallet | null;
  setStep: (s: Step) => void;
  setLines: (lines: OutputLine[]) => void;
  bootLines: OutputLine[];

  push: (...lines: OutputLine[]) => void;
  executeSend: (amountUSDC: string, to: string) => Promise<boolean>;
  executeWriteCheque: (amountUSDC: string) => Promise<boolean>;
  executeClaimCheque: (secret: string) => Promise<boolean>;
};

export async function handleCommand({
  cmd, wallet, setStep, setLines, bootLines, push,
  executeSend, executeWriteCheque, executeClaimCheque
}: CommandContext): Promise<boolean> {

  if (cmd.type === 'clear') {
    setLines(bootLines);
    return true;
  }

  if (cmd.type === 'help') {
    push(
      { kind: 'separator' },
      { kind: 'output', text: '  send <amount> to <address>  - send private cUSDC' },
      { kind: 'output', text: '  cheque <amount>             - create an encrypted payment link' },
      { kind: 'output', text: '  claim <secret>              - claim a cheque using its secret' },
      { kind: 'output', text: '  clear                       - clear chat output' },
      { kind: 'separator' },
    );
    return true;
  }

  if (cmd.type === 'whoami') {
    if (!wallet) {
      push({ kind: 'error', text: 'no wallet - type `create` or `import <pk>`' });
    } else {
      push(
        { kind: 'success', text: `  address: ${wallet.address}` },
        { kind: 'link',    text: '  view on Sepolia explorer ↗', href: EXPLORER_ADDR(wallet.address) },
      );
    }
    return true;
  }

  if (cmd.type === 'create') {
    if (wallet) {
      push({ kind: 'info', text: `already connected: ${wallet.address}` });
      return true;
    }
    push({ kind: 'info', text: 'choose a password to encrypt your wallet:' });
    setStep({ flow: 'create-wallet', step: 'password' });
    return true;
  }

  if (cmd.type === 'import') {
    if (wallet) {
      push({ kind: 'info', text: `already connected: ${wallet.address}` });
      return true;
    }
    if (cmd.privateKey) {
      push({ kind: 'info', text: 'choose a password to encrypt this key:' });
      setStep({ flow: 'import-wallet', step: 'password', privateKey: cmd.privateKey });
    } else {
      push({ kind: 'info', text: 'paste your private key (0x...)' });
      setStep({ flow: 'import-wallet', step: 'key' });
    }
    return true;
  }

  if (cmd.type === 'unlock') {
    if (wallet) {
      push({ kind: 'info', text: `already connected: ${wallet.address}` });
      return true;
    }
    if (!walletExists()) {
      push({ kind: 'error', text: 'no stored wallet - type `create` or `import <pk>`' });
      return true;
    }
    push({ kind: 'info', text: 'enter password:' });
    setStep({ flow: 'unlock-wallet', step: 'password' });
    return true;
  }

  if (cmd.type === 'disconnect') {
    push({ kind: 'info', text: 'type `yes` to confirm disconnect:' });
    setStep({ flow: 'disconnect', step: 'confirm' });
    return true;
  }

  if (cmd.type === 'history') {
    if (!wallet) {
      push({ kind: 'error', text: 'no wallet - type `create` or `unlock`' });
      return true;
    }
    push({
      kind: 'link',
      text: `  ${wallet.address} on Sepolia Etherscan ↗`,
      href: EXPLORER_ADDR(wallet.address),
    });
    return true;
  }



  if (cmd.type === 'send') {
    if (!wallet) {
      push({ kind: 'error', text: 'no wallet - type `create` or `unlock`' });
      return true;
    }
    if (cmd.amount && cmd.to) {
      await executeSend(cmd.amount, cmd.to);
    } else if (cmd.amount) {
      push({ kind: 'info', text: 'recipient address:' });
      setStep({ flow: 'send', step: 'to', amount: cmd.amount });
    } else {
      push({ kind: 'info', text: 'cUSDC amount to send? (e.g. 0.005)' });
      setStep({ flow: 'send', step: 'amount' });
    }
    return true;
  }

  if (cmd.type === 'cheque') {
    if (!wallet) {
      push({ kind: 'error', text: 'no wallet - type `create` or `unlock`' });
      return true;
    }
    if (cmd.amount) {
      await executeWriteCheque(cmd.amount);
    } else {
      push({ kind: 'info', text: 'how much cUSDC to write the cheque for? (e.g. 0.05)' });
      setStep({ flow: 'cheque', step: 'amount' });
    }
    return true;
  }

  if (cmd.type === 'claim') {
    if (!wallet) {
      push({ kind: 'error', text: 'no wallet - type `create` or `unlock`' });
      return true;
    }
    if (cmd.secret) {
      await executeClaimCheque(cmd.secret);
    } else {
      push({ kind: 'info', text: 'enter the cheque secret to claim:' });
      setStep({ flow: 'claim', step: 'secret' });
    }
    return true;
  }

  if (cmd.type === 'unknown') {
    push({ kind: 'error', text: `command not found: "${cmd.raw}" - type \`help\`` });
    return true;
  }

  return false;
}
