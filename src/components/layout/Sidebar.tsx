import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/vocabulary', label: 'Vocabulary', icon: '📖' },
  { path: '/conversation', label: 'Conversation', icon: '💬' },
  { path: '/exam', label: 'Exam', icon: '📝' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span>French Tutor</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        className={styles.settingsBtn}
        onClick={() => navigate('/settings')}
      >
        <span className={styles.navIcon}>⚙</span>
        <span className={styles.navLabel}>Settings</span>
      </button>
    </aside>
  );
};

export default Sidebar;
