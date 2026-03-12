import type { DialogueTurn } from '../../data/types';
import styles from './DialogueBubble.module.css';

interface DialogueBubbleProps {
  turn: DialogueTurn;
  showEnglish: boolean;
  highlighted?: boolean;
}

const DialogueBubble: React.FC<DialogueBubbleProps> = ({ turn, showEnglish, highlighted }) => {
  const bubbleClass = [
    styles.bubble,
    turn.speaker === 'examiner' ? styles.examiner : styles.candidate,
    highlighted ? styles.highlighted : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={bubbleClass}>
      <div className={styles.speaker}>
        {turn.speaker === 'examiner' ? 'Examiner' : 'Candidate'}
      </div>
      <div className={styles.french}>{turn.french}</div>
      {showEnglish && <div className={styles.english}>{turn.english}</div>}
    </div>
  );
};

export default DialogueBubble;
