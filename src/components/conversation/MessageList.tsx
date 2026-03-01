import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import styles from './MessageList.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  streamingText: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, streamingText }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  if (messages.length === 0 && !streamingText) {
    return (
      <div className={styles.list}>
        <div className={styles.empty}>
          Start speaking to begin the conversation.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.list} ref={listRef}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} role={msg.role} content={msg.content} />
      ))}
      {streamingText && (
        <div className={styles.streamingBubble}>{streamingText}</div>
      )}
    </div>
  );
};

export default MessageList;
