const links = [
  {
    title: 'Fide Official Website',
    url: 'https://www.fide-info.ch',
    description: 'Official Swiss language integration exam portal',
  },
  {
    title: 'Fide Test Preparation',
    url: 'https://www.fide-info.ch/en/fide-test',
    description: 'Exam format, sample tests, and preparation materials',
  },
  {
    title: 'CEFR Self-Assessment Grid',
    url: 'https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale',
    description: 'Council of Europe reference levels for language proficiency',
  },
  {
    title: 'Swiss Integration Resources',
    url: 'https://www.sem.admin.ch/sem/en/home/integration-einbuergerung.html',
    description: 'Federal Secretariat for Migration: integration and naturalisation',
  },
  {
    title: 'RTS Easy French News',
    url: 'https://www.rts.ch/info/',
    description: 'Swiss French-language news for reading practice',
  },
  {
    title: 'TV5Monde: Apprendre le francais',
    url: 'https://apprendre.tv5monde.com',
    description: 'Free French learning resources with video exercises (A1-B2)',
  },
];

const UsefulLinks: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            padding: 'var(--space-3) var(--space-4)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius)',
            textDecoration: 'none',
            color: 'var(--color-text)',
            transition: 'background var(--transition-fast)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.background = '')}
        >
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-primary)' }}>
            {link.title}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {link.description}
          </div>
        </a>
      ))}
    </div>
  );
};

export default UsefulLinks;
