import React from 'react';

export default function PriceChart({ forecast = [], currentPrice = null, height = 240 }) {
  if (!forecast || forecast.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No forecast data points available.
      </div>
    );
  }

  const svgWidth = 700;
  const svgHeight = height;
  const padding = { top: 30, right: 40, bottom: 40, left: 60 };

  const allLow = forecast.map(d => d.range_low);
  const allHigh = forecast.map(d => d.range_high);
  const allPred = forecast.map(d => d.predicted_price);
  if (currentPrice) allPred.push(currentPrice);

  const minVal = Math.min(...allLow, ...allPred) * 0.95;
  const maxVal = Math.max(...allHigh, ...allPred) * 1.05;
  const valRange = maxVal - minVal || 1;

  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const getX = (idx) => padding.left + (idx / (forecast.length - 1)) * chartW;
  const getY = (val) => svgHeight - padding.bottom - ((val - minVal) / valRange) * chartH;

  // Upper and lower boundary paths for confidence ribbon
  let upperD = `M ${getX(0)} ${getY(forecast[0].range_high)}`;
  let lowerD = `L ${getX(forecast.length - 1)} ${getY(forecast[forecast.length - 1].range_low)}`;
  let predD = `M ${getX(0)} ${getY(forecast[0].predicted_price)}`;

  for (let i = 1; i < forecast.length; i++) {
    upperD += ` L ${getX(i)} ${getY(forecast[i].range_high)}`;
    predD += ` L ${getX(i)} ${getY(forecast[i].predicted_price)}`;
  }

  for (let i = forecast.length - 2; i >= 0; i--) {
    lowerD += ` L ${getX(i)} ${getY(forecast[i].range_low)}`;
  }

  const ribbonD = `${upperD} ${lowerD} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', minWidth: '450px', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="forecastRibbonGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#52b788" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#52b788" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const yVal = minVal + ratio * valRange;
          const yPos = getY(yVal);
          return (
            <g key={`f-grid-${i}`}>
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

        {/* Confidence Range Ribbon */}
        <path d={ribbonD} fill="url(#forecastRibbonGrad)" />

        {/* Predicted Line */}
        <path
          d={predD}
          fill="none"
          stroke="#2d6a4f"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Forecast Points & Labels */}
        {forecast.map((day, idx) => {
          const cx = getX(idx);
          const cy = getY(day.predicted_price);
          return (
            <g key={`f-pt-${idx}`}>
              {/* Day label on X axis */}
              <text
                x={cx}
                y={svgHeight - 14}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="var(--text-secondary)"
              >
                {day.display_date || `Day ${day.day}`}
              </text>

              {/* Point Circle */}
              <circle
                cx={cx}
                cy={cy}
                r="5"
                fill="#1b4332"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Price Label above point */}
              <text
                x={cx}
                y={cy - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill="#1b4332"
                fontFamily="var(--font-display)"
              >
                ₹{Math.round(day.predicted_price)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
