import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
  return (
    <div className={`${styles.bubble} ${role === 'user' ? styles.user : styles.assistant}`}>
      {content}
    </div>
  );
};

export default MessageBubble;
