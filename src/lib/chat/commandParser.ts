// commandParser.ts - parses raw chat input into typed ORCA commands

export type Command =
  | { type: 'help' }
  | { type: 'clear' }
  | { type: 'whoami' }
  | { type: 'create' }
  | { type: 'import'; privateKey?: string }
  | { type: 'unlock' }
  | { type: 'disconnect' }
  | { type: 'balance' }
  | { type: 'deposit'; amount?: string }
  | { type: 'withdraw'; amount?: string }
  | { type: 'send'; amount?: string; to?: string }
  | { type: 'history' }
  | { type: 'cheque'; amount?: string }
  | { type: 'claim'; secret?: string }
  | { type: 'unknown'; raw: string };

export function parseCommand(input: string): Command {
  const trimmed = input.trim();
  const lower   = trimmed.toLowerCase();
  const parts   = trimmed.split(/\s+/);

  if (lower === 'help' || lower === '?') return { type: 'help' };
  if (lower === 'clear' || lower === 'cls') return { type: 'clear' };
  if (lower === 'whoami' || lower === 'me') return { type: 'whoami' };
  if (lower === 'create') return { type: 'create' };
  if (lower === 'unlock' || lower === 'login') return { type: 'unlock' };
  if (lower === 'disconnect' || lower === 'lock' || lower === 'logout') return { type: 'disconnect' };
  if (lower === 'balance' || lower === 'bal') return { type: 'balance' };
  if (lower === 'history' || lower === 'hist' || lower === 'txs') return { type: 'history' };

  // import [privateKey]
  if (lower.startsWith('import')) {
    const pk = parts[1] || undefined;
    return { type: 'import', privateKey: pk };
  }

  // deposit [amount]
  if (lower.startsWith('deposit') || lower.startsWith('dep')) {
    const amount = parts[1] || undefined;
    return { type: 'deposit', amount };
  }

  // withdraw [amount]
  if (lower.startsWith('withdraw') || lower.startsWith('w')) {
    const amount = parts[1] || undefined;
    // avoid matching 'whoami'
    if (lower.startsWith('withdraw') || lower === 'w') {
      return { type: 'withdraw', amount };
    }
  }

  // send [amount] [to <address>]  OR  send <amount> to <address>
  if (lower.startsWith('send')) {
    // send <amount> to <address>
    const matchFull = lower.match(/^send\s+([\d.]+)\s+to\s+(.+)$/);
    if (matchFull) {
      return { type: 'send', amount: matchFull[1], to: parts.slice(3).join(' ').trim() };
    }
    const amount = parts[1] || undefined;
    const to     = parts[2] || undefined;
    return { type: 'send', amount, to };
  }

  // cheque [amount]
  if (lower.startsWith('cheque')) {
    const amount = parts[1] || undefined;
    return { type: 'cheque', amount };
  }

  // claim [secret]
  if (lower.startsWith('claim')) {
    const secret = parts[1] || undefined;
    return { type: 'claim', secret };
  }

  return { type: 'unknown', raw: trimmed };
}
