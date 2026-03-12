import styles from './QuizCard.module.css';

interface QuizSummaryProps {
  correct: number;
  total: number;
  wrongAnswers?: { french: string; english: string }[];
  onContinue: () => void;
  onRestart: () => void;
  onRetryWrong?: () => void;
}

const QuizSummary: React.FC<QuizSummaryProps> = ({ correct, total, wrongAnswers = [], onContinue, onRestart, onRetryWrong }) => {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className={styles.card}>
      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
        {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}
      </div>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
        Batch Complete
      </h2>
      <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>
        {correct} / {total}
      </div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        {pct}% correct
      </div>
      {wrongAnswers.length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)', textAlign: 'left', width: '100%', maxWidth: '320px', margin: '0 auto var(--space-4)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
            Review these:
          </div>
          {wrongAnswers.map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0', fontSize: 'var(--font-size-sm)', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: 500 }}>{w.french}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{w.english}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
        {onRetryWrong && wrongAnswers.length > 0 && (
          <button
            onClick={onRetryWrong}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry Wrong ({wrongAnswers.length})
          </button>
        )}
        <button
          onClick={onContinue}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            border: `1px solid ${onRetryWrong && wrongAnswers.length > 0 ? 'var(--color-border)' : 'var(--color-primary)'}`,
            borderRadius: 'var(--border-radius)',
            background: onRetryWrong && wrongAnswers.length > 0 ? 'var(--color-surface)' : 'var(--color-primary)',
            color: onRetryWrong && wrongAnswers.length > 0 ? 'var(--color-text-secondary)' : '#fff',
            fontWeight: onRetryWrong && wrongAnswers.length > 0 ? 400 : 600,
            cursor: 'pointer',
          }}
        >
          {onRetryWrong && wrongAnswers.length > 0 ? 'Skip' : 'Continue'}
        </button>
        <button
          onClick={onRestart}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
};

export default QuizSummary;
