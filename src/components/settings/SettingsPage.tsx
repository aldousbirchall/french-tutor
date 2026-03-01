import { Link } from 'react-router-dom';
import ApiKeyForm from './ApiKeyForm';
import ModeIntro from '../shared/ModeIntro';
import styles from './SettingsPage.module.css';

const SettingsPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <ModeIntro title="Getting Started" storageKey="settings">
        <p>
          Enter your Claude API key below to enable conversation practice and
          exam simulations. Once saved, head to the{' '}
          <Link to="/dashboard">Dashboard</Link> to begin your study plan.
        </p>
      </ModeIntro>
      <h1 className={styles.heading}>Settings</h1>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>API Configuration</h2>
        <ApiKeyForm />
      </section>
    </div>
  );
};

export default SettingsPage;
