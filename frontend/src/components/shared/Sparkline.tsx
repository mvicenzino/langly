interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 80, height = 24, color }: Props) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = color || (isPositive ? '#34d399' : '#f87171');
  const glowColor = isPositive ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)';

  const firstY = height - ((data[0] - min) / range) * height;
  const lastY = height - ((data[data.length - 1] - min) / range) * height;
  const fillPoints = `0,${firstY} ${points} ${width},${lastY} ${width},${height} 0,${height}`;

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`spark-grad-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#spark-grad-${isPositive ? 'up' : 'down'})`}
        points={fillPoints}
      />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        points={points}
        style={{ filter: `drop-shadow(0 0 3px ${glowColor})` }}
      />
    </svg>
  );
}
