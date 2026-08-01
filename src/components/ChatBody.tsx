import type { RefObject } from 'react';
import ChatOutput, { type OutputLine } from './ChatOutput';
import bodyStyles from '../styles/chatBody.module.css';
import outputStyles from '../styles/chatOutput.module.css';

type ChatBodyProps = {
  lines: OutputLine[];
  busy: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
};

export default function ChatBody({ lines, busy, bottomRef }: ChatBodyProps) {
  return (
    <div className={bodyStyles['chat-body']}>
      <ChatOutput lines={lines} />
      {busy && (
        <div className={`${outputStyles['term-row']} ${outputStyles['row-assistant']}`}>
          <div className={`${outputStyles['term-bubble']} ${outputStyles['bubble-info']} ${outputStyles['term-spin']}`}>
            ⠋ processing...
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
