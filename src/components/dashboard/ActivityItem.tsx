import { useNavigate } from 'react-router-dom';
import type { Activity } from '../../data/types';

interface ActivityItemProps {
  activity: Activity;
  index: number;
  day: number;
  completed: boolean;
  onMarkComplete: (day: number, index: number) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  index,
  day,
  completed,
  onMarkComplete,
}) => {
  const navigate = useNavigate();

  const modeRoutes: Record<string, string> = {
    vocabulary: '/vocabulary',
    conversation: '/conversation',
    exam: '/exam',
    dashboard: '/dashboard',
  };

  const handleClick = () => {
    const route = modeRoutes[activity.mode];
    if (route) navigate(route);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        background: completed ? 'var(--color-surface-hover)' : 'var(--color-surface)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--color-border)',
        opacity: completed ? 0.7 : 1,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => {
          e.stopPropagation();
          if (!completed) onMarkComplete(day, index);
        }}
        style={{ flexShrink: 0 }}
      />
      <div style={{ flex: 1 }} onClick={handleClick}>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
          {activity.task}
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {activity.mode} &middot; {activity.minutes} min
          {activity.new_words ? ` &middot; ${activity.new_words} new words` : ''}
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;
