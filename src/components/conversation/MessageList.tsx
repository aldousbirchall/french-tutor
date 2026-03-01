import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from '../shared/ThinkingIndicator';
import ConversationEmptyState from './ConversationEmptyState';
import styles from './MessageList.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  streamingText: string;
  streaming?: boolean;
  topic?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingText,
  streaming = false,
  topic = '',
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const showThinking = streaming && !streamingText && messages.length > 0;

  if (messages.length === 0 && !streamingText) {
    return (
      <div className={styles.list}>
        <ConversationEmptyState topic={topic} />
      </div>
    );
  }

  return (
    <div className={styles.list} ref={listRef}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} role={msg.role} content={msg.content} />
      ))}
      {showThinking && <ThinkingIndicator />}
      {streamingText && (
        <div className={styles.streamingBubble}>{streamingText}</div>
      )}
    </div>
  );
};

export default MessageList;
