import React from 'react';

// Simple line + area chart, hand-rolled in SVG - one series, no need for a charting
// dependency at this size. data: [{ day: 'YYYY-MM-DD', revenue: number }]
export default function RevenueChart({ data, height = 220 }) {
  if (data.length === 0) {
    return <span className="body-s" style={{ color: 'var(--ash-grey)' }}>No revenue in this window yet.</span>;
  }

  const width = 800;
  const padding = 24;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const stepX = (width - padding * 2) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (d.revenue / max) * (height - padding * 2);
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1][0]},${height - padding} L${points[0][0]},${height - padding} Z`;

  // Show at most ~6 date labels so they don't crowd
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <path d={areaPath} fill="var(--cold-silver)" opacity="0.08" />
      <path d={linePath} fill="none" stroke="var(--cold-silver)" strokeWidth="2" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="var(--bone-white)" />
      ))}
      {data.map((d, i) =>
        i % labelEvery === 0 ? (
          <text
            key={d.day}
            x={padding + i * stepX}
            y={height - 4}
            fontSize="11"
            fill="var(--ash-grey)"
            textAnchor="middle"
            fontFamily="var(--font-body)"
          >
            {new Date(d.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </text>
        ) : null
      )}
    </svg>
  );
}
