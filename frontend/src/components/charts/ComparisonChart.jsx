import React from 'react';
import { useTranslation } from '../../i18n';

export default function ComparisonChart({ mandis = [] }) {
  const { t } = useTranslation();

  if (!mandis || mandis.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('comparison.emptyDesc', 'Select mandis above to compare prices.')}
      </div>
    );
  }

  const svgWidth = 700;
  const barHeight = 42;
  const gap = 16;
  const padding = { top: 15, right: 90, bottom: 25, left: 160 };
  const svgHeight = padding.top + padding.bottom + mandis.length * (barHeight + gap);

  const prices = mandis.map(m => Number(m.modal_price) || 0);
  const maxPrice = Math.max(...prices, 1000) * 1.15;
  const highestVal = Math.max(...prices);
  const lowestVal = Math.min(...prices);

  const chartWidth = svgWidth - padding.left - padding.right;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', minWidth: '500px', height: 'auto', display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const xPos = padding.left + ratio * chartWidth;
          const val = Math.round(ratio * maxPrice);
          return (
            <g key={`grid-x-${i}`}>
              <line
                x1={xPos}
                y1={padding.top}
                x2={xPos}
                y2={svgHeight - padding.bottom}
                stroke="#e8e2d5"
                strokeDasharray="3 3"
              />
              <text
                x={xPos}
                y={svgHeight - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#707e73"
                fontFamily="var(--font-body)"
              >
                ₹{val}
              </text>
            </g>
          );
        })}

        {/* Mandi Bars */}
        {mandis.map((m, idx) => {
          const yPos = padding.top + idx * (barHeight + gap);
          const p = Number(m.modal_price) || 0;
          const barW = Math.max(12, (p / maxPrice) * chartWidth);
          const isHighest = p === highestVal && mandis.length > 1;
          const isLowest = p === lowestVal && mandis.length > 1;

          const barColor = isHighest ? '#2d6a4f' : isLowest ? '#c92a2a' : '#52b788';

          return (
            <g key={`${m.market}-${idx}`}>
              {/* Mandi Name label */}
              <text
                x={padding.left - 12}
                y={yPos + 18}
                textAnchor="end"
                fontSize="12"
                fontWeight="700"
                fill="var(--text-main)"
                fontFamily="var(--font-display)"
              >
                {m.market.length > 18 ? `${m.market.slice(0, 16)}...` : m.market}
              </text>
              <text
                x={padding.left - 12}
                y={yPos + 32}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {m.district || ''}
              </text>

              {/* Background Bar */}
              <rect
                x={padding.left}
                y={yPos + 6}
                width={chartWidth}
                height={barHeight - 12}
                rx="4"
                fill="#f5f2eb"
              />

              {/* Price Bar */}
              <rect
                x={padding.left}
                y={yPos + 6}
                width={barW}
                height={barHeight - 12}
                rx="4"
                fill={barColor}
              />

              {/* Value Label */}
              <text
                x={padding.left + barW + 8}
                y={yPos + 22}
                fontSize="12"
                fontWeight="800"
                fill={barColor}
                fontFamily="var(--font-display)"
              >
                ₹{p.toLocaleString('en-IN')}/q
              </text>

              {/* High/Low Tag */}
              {isHighest && (
                <text
                  x={padding.left + barW + 8}
                  y={yPos + 34}
                  fontSize="9"
                  fontWeight="700"
                  fill="#2d6a4f"
                >
                  {t('comparison.highest', 'HIGHEST')}
                </text>
              )}
              {isLowest && (
                <text
                  x={padding.left + barW + 8}
                  y={yPos + 34}
                  fontSize="9"
                  fontWeight="700"
                  fill="#c92a2a"
                >
                  {t('comparison.lowest', 'LOWEST')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
