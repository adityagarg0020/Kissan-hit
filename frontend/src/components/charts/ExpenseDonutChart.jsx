import React, { useState } from 'react';
import { useTranslation } from '../../i18n';

const CATEGORY_COLORS = {
  'Seeds': '#2b8a3e',
  'Fertilizer': '#1c7ed6',
  'Pesticides': '#e64980',
  'Labour': '#d9480f',
  'Machinery': '#f59f00',
  'Irrigation': '#1098ad',
  'Fuel': '#7048e8',
  'Transportation': '#862e9c',
  'Storage': '#495057',
  'Packaging': '#5c7cfa',
  'Other': '#868e96'
};

export default function ExpenseDonutChart({ data = [], totalCost = 0, height = 240 }) {
  const { t, formatNumber } = useTranslation();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0 || totalCost <= 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
        {t('expenses.chart.noEntries')}
      </div>
    );
  }

  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      {/* Donut SVG */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#f1f3f5"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercent / 100) * circumference);
            cumulativePercent += item.percentage;
            const color = CATEGORY_COLORS[item.category] || '#868e96';
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={item.category}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                  opacity: hoveredIdx !== null && !isHovered ? 0.6 : 1,
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          textAlign: 'center',
          padding: '0.5rem'
        }}>
          {hoveredIdx !== null && data[hoveredIdx] ? (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t(`expenses.categories.${data[hoveredIdx].category.toLowerCase()}`, {}, data[hoveredIdx].category)}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {data[hoveredIdx].percentage}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#2b8a3e', fontWeight: 600 }}>
                ₹{formatNumber(data[hoveredIdx].cost)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('expenses.chart.totalCost')}
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ₹{formatNumber(totalCost)}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {data.length} {t('expenses.chart.categoriesCount')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.5rem 0.8rem',
        width: '100%',
        maxWidth: '480px'
      }}>
        {data.map((item, idx) => {
          const color = CATEGORY_COLORS[item.category] || '#868e96';
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={item.category}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: isHovered ? '#f8f9fa' : 'transparent',
                border: isHovered ? '1px solid #dee2e6' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: isHovered ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t(`expenses.categories.${item.category.toLowerCase()}`, {}, item.category)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0, marginLeft: '0.4rem' }}>
                {item.percentage}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
