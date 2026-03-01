import schedule from '../../data/schedule';
import { getCurrentStudyDay } from '../../utils/dateUtils';

const StudyScheduleOverview: React.FC = () => {
  const currentDayNum = getCurrentStudyDay(schedule.start_date, new Date(), schedule.total_days);

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        {schedule.total_days}-day plan | {schedule.start_date} to {schedule.exam_date} | Weekdays only
      </div>

      {schedule.phases.map((phase) => {
        const phaseDays = schedule.days.filter((d) => d.phase === phase.name);
        return (
          <section key={phase.name} style={{ marginBottom: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-lg)' }}>
              {phase.name} (Days {phase.days[0]}-{phase.days[1]})
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              {phase.focus} | {phase.daily_time_minutes} min/day
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Day</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Activities</th>
                  <th style={thStyle}>Topics</th>
                </tr>
              </thead>
              <tbody>
                {phaseDays.map((day) => {
                  const isCurrent = currentDayNum === day.day;
                  const rowStyle: React.CSSProperties = isCurrent
                    ? { background: 'rgba(37, 99, 235, 0.08)' }
                    : {};
                  return (
                    <tr key={day.day} style={rowStyle}>
                      <td style={tdStyle}>
                        {day.day}
                        {isCurrent && (
                          <span style={{ marginLeft: 4, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                            (today)
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>{day.weekday} {day.date}</td>
                      <td style={tdStyle}><strong>{day.title}</strong></td>
                      <td style={tdStyle}>
                        {day.activities.map((a, i) => (
                          <div key={i} style={{ lineHeight: 1.4 }}>
                            {a.mode} ({a.minutes} min)
                          </div>
                        ))}
                      </td>
                      <td style={tdStyle}>{day.topics.join(', ').replace(/_/g, ' ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 'var(--space-2) var(--space-3)',
  borderBottom: '2px solid var(--color-border)',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'top',
};

export default StudyScheduleOverview;
