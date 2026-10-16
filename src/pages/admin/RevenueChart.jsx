import React from 'react';

const compact = (v) => (v >= 1000 ? `₹${+(v / 1000).toFixed(1)}k` : `₹${v}`);

// Round up to 1–10 × a power of ten so the axis reads ₹40k rather than ₹37.2k
const niceMax = (v) => {
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
};

// Simple line chart, hand-rolled in SVG - one series, no need for a charting
// dependency at this size. data: [{ label: string, revenue: number }]
export default function RevenueChart({ data, height = 240 }) {
  if (data.length === 0) {
    return <span className="body-s" style={{ color: 'var(--ash-grey)' }}>No revenue in this window yet.</span>;
  }

  const width = 900;
  const left = 64;
  const right = 24;
  const top = 12;
  const bottom = 36;
  const max = niceMax(Math.max(...data.map((d) => d.revenue), 1));
  const stepX = (width - left - right) / Math.max(1, data.length - 1);
  const yOf = (v) => height - bottom - (v / max) * (height - top - bottom);

  const points = data.map((d, i) => [left + i * stepX, yOf(d.revenue)]);
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

  // Show at most ~6 labels so they don't crowd
  const labelEvery = Math.ceil(data.length / 6);
  const grid = 'rgba(244, 241, 234, 0.08)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Revenue over time">
      {[0, max / 2, max].map((v) => (
        <g key={v}>
          <line x1={left} x2={width - right} y1={yOf(v)} y2={yOf(v)} stroke={grid} />
          <text x={left - 14} y={yOf(v) + 5} fontSize="15" fill="var(--ash-grey)" textAnchor="end" fontFamily="var(--font-body)">{compact(v)}</text>
        </g>
      ))}
      {points.map(([x], i) => <line key={i} x1={x} x2={x} y1={top} y2={height - bottom} stroke={grid} />)}
      <path d={linePath} fill="none" stroke="var(--bone-white)" strokeWidth="1.5" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill="var(--bone-white)" />
      ))}
      {data.map((d, i) =>
        i % labelEvery === 0 ? (
          <text key={i} x={points[i][0]} y={height - 8} fontSize="15" fill="var(--bone-white)" textAnchor="middle" fontFamily="var(--font-body)">
            {d.label}
          </text>
        ) : null
      )}
    </svg>
  );
}
