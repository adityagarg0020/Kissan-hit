import React, { useState } from 'react';

export default function HistoricalChart({ series = [], height = 220 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!series || series.length <= 1) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Not enough historical series points available to render chart.
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };

  const prices = series.map(s => s.price);
  const minP = Math.min(...prices) * 0.9;
  const maxP = Math.max(...prices) * 1.08;
  const pRange = maxP - minP || 1;

  const getX = (idx) => padding.left + (idx / (series.length - 1)) * (svgWidth - padding.left - padding.right);
  const getY = (price) => svgHeight - padding.bottom - ((price - minP) / pRange) * (svgHeight - padding.top - padding.bottom);

  let pathD = `M ${getX(0)} ${getY(series[0].price)}`;
  for (let i = 1; i < series.length; i++) {
    pathD += ` L ${getX(i)} ${getY(series[i].price)}`;
  }

  const areaD = `${pathD} L ${getX(series.length - 1)} ${svgHeight - padding.bottom} L ${getX(0)} ${svgHeight - padding.bottom} Z`;

  const yearTicks = [];
  let lastYear = null;
  series.forEach((s, idx) => {
    if (s.year !== lastYear) {
      lastYear = s.year;
      yearTicks.push({ year: s.year, x: getX(idx) });
    }
  });

  return (
    <div>
      <div className="chart-container" style={{ height: 'auto' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="histAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d6a4f" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#2d6a4f" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const yVal = minP + ratio * pRange;
            const yPos = getY(yVal);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={svgWidth - padding.right}
                  y2={yPos}
                  stroke="#e8e2d5"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#707e73"
                  fontFamily="var(--font-body)"
                >
                  ₹{Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#histAreaGradient)" />

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Year labels on x-axis */}
          {yearTicks.map((t, i) => (
            <text
              key={`ytick-${i}`}
              x={t.x}
              y={svgHeight - 12}
              textAnchor="middle"
              fontSize="10"
              fill="#707e73"
              fontWeight="600"
            >
              {t.year}
            </text>
          ))}

          {/* Interactive hover points */}
          {series.map((s, idx) => {
            if (idx % 8 === 0 || (hoveredPoint && hoveredPoint.idx === idx)) {
              const cx = getX(idx);
              const cy = getY(s.price);
              const isHovered = hoveredPoint && hoveredPoint.idx === idx;
              return (
                <circle
                  key={`point-${idx}`}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 3}
                  fill={isHovered ? '#1b4332' : 'var(--primary)'}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                  onMouseEnter={() => setHoveredPoint({ ...s, idx, cx, cy })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            }
            return null;
          })}
        </svg>
      </div>

      {hoveredPoint && (
        <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-deep)', marginTop: '0.35rem' }}>
          📅 {hoveredPoint.month_name} {hoveredPoint.year}: <strong>₹{hoveredPoint.price.toLocaleString('en-IN')}/quintal</strong>
        </div>
      )}
    </div>
  );
}
