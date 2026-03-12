import { NavLink, useNavigate } from 'react-router-dom';
import { useClaudeAvailability } from '../../contexts/ClaudeContext';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiresClaude?: boolean;
}

const navItems: NavItem[] = [
  { path: '/vocabulary', label: 'Vocabulary', icon: '\u{1F4D6}' },
  { path: '/conversation', label: 'Conversation', icon: '\u{1F4AC}', requiresClaude: true },
  { path: '/exam', label: 'Exam', icon: '\u{1F4DD}', requiresClaude: true },
  { path: '/dashboard', label: 'Dashboard', icon: '\u{1F4CA}' },
  { path: '/reference', label: 'Reference', icon: '\u{1F4DA}' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { available } = useClaudeAvailability();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span>French Tutor</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const disabled = item.requiresClaude && !available;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>
                {item.label}
                {disabled && <span className={styles.offlineTag}> (offline)</span>}
              </span>
            </NavLink>
          );
        })}
      </nav>
      <button
        className={styles.settingsBtn}
        onClick={() => navigate('/settings')}
      >
        <span className={styles.navIcon}>{'\u2699'}</span>
        <span className={styles.navLabel}>Settings</span>
      </button>
    </aside>
  );
};

export default Sidebar;
