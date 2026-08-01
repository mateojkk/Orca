import { ArrowUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import styles from '../../styles/chatInput.module.css';

type OrcaChatInputProps = {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  isPassword?: boolean;
  history: string[];
  quickActions: string[];
  submitLabel?: string;
};

const COMMANDS = [
  'help', 'create', 'import', 'unlock', 'disconnect',
  'send', 'cheque', 'claim', 'whoami', 'history', 'clear',
];

export default function OrcaChatInput({
  onSubmit, disabled, isPassword, history, quickActions, submitLabel = 'Send',
}: OrcaChatInputProps) {
  const [value, setValue]   = useState('');
  const [histIdx, setHistIdx] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    if (isPassword || !textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [value, isPassword]);

  const normalizedValue = value.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (isPassword || !normalizedValue) return [];
    return [...COMMANDS, ...history]
      .filter((e, idx, arr) => arr.indexOf(e) === idx)
      .filter((e) => e.toLowerCase().startsWith(normalizedValue) && e.toLowerCase() !== normalizedValue)
      .slice(0, 4);
  }, [history, isPassword, normalizedValue]);

  const submitCommand = () => {
    const trimmed = isPassword ? value : value.trim();
    if (!trimmed && !isPassword) return;
    onSubmit(trimmed);
    setValue('');
    setHistIdx(-1);
    if (!isPassword && textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleHistoryNav = (dir: 'up' | 'down') => {
    if (isPassword) return;
    const next = dir === 'up'
      ? Math.min(histIdx + 1, history.length - 1)
      : Math.max(histIdx - 1, -1);
    setHistIdx(next);
    setValue(next === -1 ? '' : history[next] ?? '');
  };

  const handleTextKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCommand(); return; }
    if (e.key === 'ArrowUp' && !value.trim()) { e.preventDefault(); handleHistoryNav('up'); return; }
    if (e.key === 'ArrowDown' && histIdx !== -1) { e.preventDefault(); handleHistoryNav('down'); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const match = COMMANDS.find((c) => c.startsWith(value.toLowerCase()));
      if (match) setValue(`${match} `);
    }
    if (e.key === 'Escape') { setValue(''); setHistIdx(-1); }
  };

  const handlePasswordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submitCommand(); }
  };

  return (
    <div className={styles.root}>
      {quickActions.length > 0 && !value.trim() && !isPassword && (
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <button key={action} type="button" className={styles.quickAction}
              onClick={() => onSubmit(action)} disabled={disabled}>
              <span>{action}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.composer}>
        <div className={styles.inputWrap}>
          {isPassword ? (
            <input
              ref={passwordRef}
              className={styles.passwordInput}
              data-command-input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              disabled={disabled}
              autoComplete="off"
              placeholder=""
            />
          ) : (
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              data-command-input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleTextKeyDown}
              disabled={disabled}
              placeholder="type a command..."
              rows={1}
            />
          )}
        </div>
        <button
          type="button"
          className={styles.sendButton}
          onClick={submitCommand}
          disabled={disabled || (!isPassword && !value.trim())}
          aria-label={submitLabel}
        >
          <ArrowUp size={16} />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((s) => (
            <button key={s} type="button" className={styles.suggestion}
              onClick={() => { setValue(s.includes(' ') ? s : `${s} `); textareaRef.current?.focus(); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
