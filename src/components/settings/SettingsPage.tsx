import { useClaudeAvailability } from '../../contexts/ClaudeContext';
import ApiKeyForm from './ApiKeyForm';
import ModeIntro from '../shared/ModeIntro';
import styles from './SettingsPage.module.css';

const SettingsPage: React.FC = () => {
  const { available, checked } = useClaudeAvailability();

  return (
    <div className={styles.page}>
      <ModeIntro title="Getting Started" storageKey="settings">
        <p>
          Conversation practice and exam simulations are powered by Claude AI.
          If Claude Code is running with a Max subscription, the app connects
          automatically. Otherwise, add an API key below as a fallback.
        </p>
      </ModeIntro>
      <h1 className={styles.heading}>Settings</h1>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Claude AI Connection</h2>
        {checked && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            background: available
              ? 'var(--color-success-bg, #d4edda)'
              : 'var(--color-warning-bg, #fff3cd)',
            border: `1px solid ${available
              ? 'var(--color-success-border, #28a745)'
              : 'var(--color-warning-border, #ffc107)'}`,
          }}>
            {available
              ? 'Connected via Claude Code Max subscription.'
              : 'Not connected. Start Claude Code or add an API key below.'}
          </div>
        )}
        <ApiKeyForm />
      </section>
    </div>
  );
};

export default SettingsPage;
