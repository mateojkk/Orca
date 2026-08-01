import OrcaChatInput from './ui/OrcaChatInput';
import styles from '../styles/chatFooter.module.css';

type ChatFooterProps = {
  onSubmit: (input: string) => void;
  disabled: boolean;
  history: string[];
  isPassword: boolean;
  helperText: string;
  quickActions: string[];
  submitLabel: string;
};

export default function ChatFooter({
  onSubmit, disabled, history, isPassword, helperText, quickActions, submitLabel,
}: ChatFooterProps) {
  const showHelper = helperText.trim().length > 0;
  return (
    <div className={styles['chat-footer']}>
      {showHelper && (
        <div className={styles['chat-helper-bar']}>
          <div className={styles['chat-helper-text']}>{helperText}</div>
        </div>
      )}
      <OrcaChatInput
        onSubmit={onSubmit}
        disabled={disabled}
        history={history}
        isPassword={isPassword}
        quickActions={quickActions}
        submitLabel={submitLabel}
      />
    </div>
  );
}
