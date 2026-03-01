import styles from './ReferenceMode.module.css';

const ExamOverview: React.FC = () => {
  return (
    <div>
      <h2 className={styles.heading} style={{ fontSize: 'var(--font-size-xl)' }}>
        Fide Exam Structure
      </h2>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-2)' }}>Oral Exam (40 minutes)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
          <thead>
            <tr>
              <th style={thStyle}>Section</th>
              <th style={thStyle}>Task</th>
              <th style={thStyle}>Duration</th>
              <th style={thStyle}>Level</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>1a</td>
              <td style={tdStyle}>Self-introduction</td>
              <td style={tdStyle}>3 min</td>
              <td style={tdStyle}>A2</td>
            </tr>
            <tr>
              <td style={tdStyle}>1b</td>
              <td style={tdStyle}>Image description</td>
              <td style={tdStyle}>3 min</td>
              <td style={tdStyle}>A2</td>
            </tr>
            <tr>
              <td style={tdStyle}>1c</td>
              <td style={tdStyle}>Open discussion</td>
              <td style={tdStyle}>4 min</td>
              <td style={tdStyle}>A2</td>
            </tr>
            <tr>
              <td style={tdStyle}>2a</td>
              <td style={tdStyle}>Dialogue role-play</td>
              <td style={tdStyle}>4 min</td>
              <td style={tdStyle}>A2</td>
            </tr>
            <tr>
              <td style={tdStyle}>2b</td>
              <td style={tdStyle}>Sequential image narration</td>
              <td style={tdStyle}>3 min</td>
              <td style={tdStyle}>A1-A2</td>
            </tr>
            <tr>
              <td style={tdStyle}>3</td>
              <td style={tdStyle}>Listening comprehension</td>
              <td style={tdStyle}>15 min</td>
              <td style={tdStyle}>A1-A2</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-2)' }}>Written Exam (60 minutes)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
          <thead>
            <tr>
              <th style={thStyle}>Task</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Duration</th>
              <th style={thStyle}>Level</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Form filling</td>
              <td style={tdStyle}>Complete forms from given information</td>
              <td style={tdStyle}>10 min</td>
              <td style={tdStyle}>A1</td>
            </tr>
            <tr>
              <td style={tdStyle}>Letter/email writing</td>
              <td style={tdStyle}>Write short messages (30-80 words)</td>
              <td style={tdStyle}>15 min</td>
              <td style={tdStyle}>A1-A2</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-2)' }}>CEFR Level Targets</h3>
        <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          <p><strong>A1 (written):</strong> Can fill in forms with personal details. Can write short, simple messages.</p>
          <p><strong>A2 (oral):</strong> Can communicate in routine tasks. Can describe aspects of background, immediate environment, and matters of need.</p>
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: 'var(--space-2)' }}>Key Topics</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {[
            'Personal information', 'Family', 'Housing', 'Daily routine',
            'Work & education', 'Shopping & food', 'Health', 'Transport',
            'Weather', 'Leisure', 'Administration',
          ].map((topic) => (
            <span key={topic} style={tagStyle}>{topic}</span>
          ))}
        </div>
      </section>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 'var(--space-2) var(--space-3)',
  borderBottom: '2px solid var(--color-border)',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  borderBottom: '1px solid var(--color-border)',
};

const tagStyle: React.CSSProperties = {
  padding: '2px 10px',
  background: 'var(--color-surface-hover)',
  borderRadius: 'var(--border-radius)',
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-text-secondary)',
};

export default ExamOverview;
