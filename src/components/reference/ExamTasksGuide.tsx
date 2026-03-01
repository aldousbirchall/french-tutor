import { useState } from 'react';
import scenarios from '../../data/scenarios';

const ExamTasksGuide: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {Object.values(scenarios).map((scenario) => {
        const isOpen = expanded === scenario.id;
        const scoring = scenario.scoring_criteria as Record<string, string> | undefined;
        const vocabTopics = scenario.target_vocabulary as string[] | undefined;
        return (
          <div
            key={scenario.id}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => toggle(scenario.id)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3) var(--space-4)',
                background: isOpen ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              <span>{scenario.title}</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                {scenario.exam_section.replace(/_/g, ' ')} | {scenario.level} | {scenario.duration_minutes} min
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: 'var(--space-2)' }}>{scenario.description}</p>
                {scoring && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <strong>Scoring criteria:</strong>
                    <ul style={{ marginTop: 'var(--space-1)', paddingLeft: 'var(--space-4)' }}>
                      {Object.entries(scoring).map(([key, val]) => (
                        <li key={key}><strong>{key}:</strong> {val}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {vocabTopics && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <strong>Key vocabulary topics:</strong>{' '}
                    {vocabTopics.join(', ').replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExamTasksGuide;
