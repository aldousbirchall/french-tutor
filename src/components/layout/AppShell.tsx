import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';

const AppShell: React.FC = () => {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
