import styles from './Tooltip.module.css';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom';
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, position = 'top', children }) => {
  return (
    <span className={styles.wrapper}>
      {children}
      <span className={`${styles.tip} ${styles[position]}`}>{text}</span>
    </span>
  );
};

export default Tooltip;
