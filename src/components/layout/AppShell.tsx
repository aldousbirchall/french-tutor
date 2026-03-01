import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';

function isCompatibleBrowser(): boolean {
  const ua = navigator.userAgent;
  return /Chrome|Edg/i.test(ua) && !/OPR/i.test(ua);
}

const AppShell: React.FC = () => {
  const compatible = isCompatibleBrowser();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        {!compatible && (
          <div className={styles.compatWarning}>
            For the best experience with voice features, use Chrome or Edge.
          </div>
        )}
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
