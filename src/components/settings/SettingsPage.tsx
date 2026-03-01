import ApiKeyForm from './ApiKeyForm';
import styles from './SettingsPage.module.css';

const SettingsPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Settings</h1>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>API Configuration</h2>
        <ApiKeyForm />
      </section>
    </div>
  );
};

export default SettingsPage;
