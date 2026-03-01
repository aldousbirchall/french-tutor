interface ConversationControlsProps {
  onEnd: () => void;
  onNewTopic: () => void;
  disabled: boolean;
}

const ConversationControls: React.FC<ConversationControlsProps> = ({
  onEnd,
  onNewTopic,
  disabled,
}) => {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
      <button
        onClick={onEnd}
        disabled={disabled}
        style={{
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--color-error)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--border-radius)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          fontSize: 'var(--font-size-sm)',
        }}
      >
        End Conversation
      </button>
      <button
        onClick={onNewTopic}
        disabled={disabled}
        style={{
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          fontSize: 'var(--font-size-sm)',
        }}
      >
        New Topic
      </button>
    </div>
  );
};

export default ConversationControls;
