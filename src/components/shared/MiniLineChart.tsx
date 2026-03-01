import styles from './MiniLineChart.module.css';

interface DataPoint {
  x: string;
  y: number;
}

interface MiniLineChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  color: string;
}

const MiniLineChart: React.FC<MiniLineChartProps> = ({ data, width, height, color }) => {
  if (data.length === 0) {
    return (
      <svg className={styles.chart} width={width} height={height}>
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-text-muted)"
          fontSize="12"
        >
          No data yet
        </text>
      </svg>
    );
  }

  const padding = { top: 8, right: 8, bottom: 8, left: 8 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const yValues = data.map((d) => d.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth),
    y: padding.top + plotHeight - ((d.y - minY) / yRange) * plotHeight,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`;

  return (
    <svg className={styles.chart} width={width} height={height}>
      <path d={areaD} fill={color} opacity={0.1} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
    </svg>
  );
};

export default MiniLineChart;
