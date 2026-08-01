import styles from '../styles/chatOutput.module.css';

export type OutputLine =
  | { kind: 'input'; text: string }
  | { kind: 'output'; text: string }
  | { kind: 'error'; text: string }
  | { kind: 'success'; text: string }
  | { kind: 'info'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'separator' };

interface ChatOutputProps {
  lines: OutputLine[];
}

export default function ChatOutput({ lines }: ChatOutputProps) {
  const kindClassMap: Record<OutputLine['kind'], string> = {
    input:     styles['bubble-user'],
    output:    styles['bubble-assistant'],
    error:     styles['bubble-error'],
    success:   styles['bubble-success'],
    info:      styles['bubble-info'],
    link:      styles['bubble-link'],
    separator: styles['term-separator'],
  };

  return (
    <div className={styles['chat-output']}>
      {lines.map((line, i) => {
        if (line.kind === 'separator') {
          return <div key={i} className={styles['term-separator']} />;
        }
        if (line.kind === 'link') {
          return (
            <div key={i} className={`${styles['term-row']} ${styles['row-assistant']}`}>
              <div className={`${styles['term-bubble']} ${kindClassMap.link}`}>
                <a href={line.href} target="_blank" rel="noopener noreferrer" className={styles['term-link']}>
                  {line.text}
                </a>
              </div>
            </div>
          );
        }

        let rowClass = styles['row-assistant'];
        if (line.kind === 'input') {
          rowClass = styles['row-user'];
        }

        return (
          <div
            key={i}
            className={`${styles['term-row']} ${rowClass}`}
          >
            <div className={`${styles['term-bubble']} ${kindClassMap[line.kind]}`}>
              {line.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
