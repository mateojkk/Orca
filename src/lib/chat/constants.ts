import type { OutputLine } from '../../components/ChatOutput';

export const BOOT_LINES: OutputLine[] = [
  { kind: 'separator' },
  { kind: 'info',    text: '  type `help` for available commands' },
  { kind: 'separator' },
];
