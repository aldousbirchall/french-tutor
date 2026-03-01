import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';

function isCompatibleBrowser(): boolean {
  const ua = navigator.userAgent;
  return /Chrome|Edg/i.test(ua) && !/OPR/i.test(ua);
}

function isSpeechRecognitionSupported(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

const AppShell: React.FC = () => {
  const compatible = isCompatibleBrowser();
  const speechSupported = isSpeechRecognitionSupported();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        {!compatible && (
          <div className={styles.compatWarning}>
            For the best experience with voice features, use Chrome or Edge.
          </div>
        )}
        {!speechSupported && (
          <div className={styles.speechWarning} role="alert">
            Speech recognition is not supported in this browser. Voice features will be unavailable.
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
