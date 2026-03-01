import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ExamTimer.module.css';

interface ExamTimerProps {
  durationMinutes: number;
  onExpired: () => void;
  active: boolean;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ durationMinutes, onExpired, active }) => {
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const intervalRef = useRef<number | null>(null);
  const expiredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    setRemaining(durationMinutes * 60);
    expiredRef.current = false;
  }, [durationMinutes]);

  useEffect(() => {
    if (active && remaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            if (!expiredRef.current) {
              expiredRef.current = true;
              setTimeout(onExpired, 0);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [active, remaining, onExpired, clearTimer]);

  const isWarning = remaining <= 300 && remaining > 0; // 5 minutes

  return (
    <div className={`${styles.timer} ${isWarning ? styles.warning : ''}`}>
      {formatTime(remaining)}
    </div>
  );
};

export default ExamTimer;
