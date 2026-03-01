import schedule from '../../data/schedule';

interface GrammarEntry {
  phase: string;
  day: number;
  title: string;
  grammar: string;
}

const GrammarGuide: React.FC = () => {
  const entries: GrammarEntry[] = schedule.days.map((d) => ({
    phase: d.phase,
    day: d.day,
    title: d.title,
    grammar: d.grammar_focus,
  }));

  const phases = schedule.phases.map((p) => p.name);

  return (
    <div>
      {phases.map((phase) => {
        const phaseEntries = entries.filter((e) => e.phase === phase);
        return (
          <section key={phase} style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-lg)' }}>
              {phase}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Day</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Grammar Focus</th>
                </tr>
              </thead>
              <tbody>
                {phaseEntries.map((e) => (
                  <tr key={e.day}>
                    <td style={tdStyle}>{e.day}</td>
                    <td style={tdStyle}>{e.title}</td>
                    <td style={tdStyle}>{e.grammar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
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

export default GrammarGuide;
