import { useState, useCallback } from 'react';
import styles from './ModeIntro.module.css';

interface ModeIntroProps {
  title: string;
  storageKey: string;
  children: React.ReactNode;
}

const ModeIntro: React.FC<ModeIntroProps> = ({ title, storageKey, children }) => {
  const key = `mode-intro-collapsed-${storageKey}`;
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(key) === 'true';
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(key, String(next));
      return next;
    });
  }, [key]);

  if (collapsed) {
    return (
      <button className={styles.toggleBtn} onClick={toggle} title={title}>
        ?
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button className={styles.collapseBtn} onClick={toggle} title="Collapse">
          &times;
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default ModeIntro;
