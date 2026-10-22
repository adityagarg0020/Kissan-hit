import React, { useState } from 'react';
import { Calendar, Award, TrendingUp, AlertCircle, BarChart2, Activity } from 'lucide-react';

export default function HistoricalIntelligence({ historicalData, loading }) {
  const [activeSort, setActiveSort] = useState('highest_average');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (loading) {
    return (
      <div className="card">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing 10-year historical analytics & patterns...
        </div>
      </div>
    );
  }

  if (!historicalData || !historicalData.trend) {
    return null;
  }

  const {
    commodity,
    state,
    trend,
    best_month,
    state_ranking,
    seasonal,
    volatility,
    anomaly,
    disclaimers
  } = historicalData;

  const series = trend.series || [];

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };

  let chartContent = null;
  if (series.length > 1) {
    const prices = series.map(s => s.price);
    const minP = Math.min(...prices) * 0.9;
    const maxP = Math.max(...prices) * 1.08;
    const pRange = maxP - minP || 1;

    const getX = (idx) => padding.left + (idx / (series.length - 1)) * (svgWidth - padding.left - padding.right);
    const getY = (price) => svgHeight - padding.bottom - ((price - minP) / pRange) * (svgHeight - padding.top - padding.bottom);

    // Build SVG path
    let pathD = `M ${getX(0)} ${getY(series[0].price)}`;
    for (let i = 1; i < series.length; i++) {
      pathD += ` L ${getX(i)} ${getY(series[i].price)}`;
    }

    // Build area fill path
    const areaD = `${pathD} L ${getX(series.length - 1)} ${svgHeight - padding.bottom} L ${getX(0)} ${svgHeight - padding.bottom} Z`;

    // Year tick marks
    const yearTicks = [];
    let lastYear = null;
    series.forEach((s, idx) => {
      if (s.year !== lastYear) {
        lastYear = s.year;
        yearTicks.push({ year: s.year, x: getX(idx) });
      }
    });

    chartContent = (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2d6a4f" stopOpacity="0.3" />
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
        <path d={areaD} fill="url(#areaGradient)" />

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
          // sample every 6th point or hovered
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
    );
  }

  return (
    <div className="card" id="historical-intelligence-section">
      <div className="card-header">
        <div className="card-title">
          <BarChart2 size={20} color="var(--primary)" /> 10-Year Historical Intelligence ({trend.period})
        </div>
        <span className="card-badge">{trend.historical_crop} &bull; {trend.state}</span>
      </div>

      {/* 10-Year Line Chart */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Monthly Modal Price Trend (2016–2026)</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({series.length} monthly sessions)</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            10-Yr Avg: <strong>₹{trend.summary.average_price}</strong> | Range: <strong>₹{trend.summary.min_recorded_price} – ₹{trend.summary.max_recorded_price}</strong>
          </div>
        </div>

        <div className="chart-container" style={{ height: 'auto' }}>
          {chartContent}
        </div>

        {hoveredPoint && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-deep)', marginTop: '0.25rem' }}>
            📅 {hoveredPoint.month_name} {hoveredPoint.year}: <strong>₹{hoveredPoint.price.toLocaleString('en-IN')}/quintal</strong>
          </div>
        )}
      </div>

      {/* Best Month & Historical Insight Cards */}
      <div className="historical-grid">
        {/* Best Month Card */}
        {best_month && best_month.best_month && (
          <div className="stat-callout" style={{ borderLeftColor: 'var(--primary-mint)' }}>
            <div className="stat-callout-title">🗓️ Historically Best Month</div>
            <div className="stat-callout-val" style={{ color: 'var(--primary-dark)' }}>
              {best_month.best_month.month_name}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
              ₹{best_month.best_month.average_price.toLocaleString('en-IN')} / quintal
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Highest average recorded price across 10 years of September harvest and market data.
            </div>
            {best_month.highest_peak_month && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '0.3rem' }}>
                Peak Spike: <strong>₹{best_month.highest_peak_month.max_recorded_price.toLocaleString('en-IN')}</strong> in {best_month.highest_peak_month.month_name}
              </div>
            )}
          </div>
        )}

        {/* Best Historical State Card */}
        {state_ranking && state_ranking.historical_best_insight && (
          <div className="stat-callout" style={{ borderLeftColor: 'var(--accent-gold)' }}>
            <div className="stat-callout-title">🏆 Best Historical State</div>
            <div className="stat-callout-val" style={{ color: '#92580c' }}>
              {state_ranking.historical_best_insight.state}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              10-Yr Avg: ₹{state_ranking.historical_best_insight.average_price.toLocaleString('en-IN')} / q
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {state_ranking.historical_best_insight.insight_statement}
            </div>
          </div>
        )}
      </div>

      {/* 12-Month Heatmap Grid */}
      {best_month && best_month.monthly_breakdown && (
        <div style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            📅 12-Month Historical Price Heatmap ({commodity} in {state})
          </div>
          <div className="heatmap-grid">
            {best_month.monthly_breakdown.map((m) => {
              const isBest = best_month.best_month && m.month_name === best_month.best_month.month_name;
              return (
                <div className={`heatmap-cell ${isBest ? 'best' : ''}`} key={m.month_name}>
                  <div className="heatmap-cell-month">{m.month_name.slice(0, 3)}</div>
                  <div className="heatmap-cell-price">
                    {m.average_price > 0 ? `₹${m.average_price.toLocaleString('en-IN')}` : 'N/A'}
                  </div>
                  {isBest && <span style={{ fontSize: '0.65rem', color: '#2b8a3e', fontWeight: 700 }}>★ BEST</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Seasonal & Volatility Stats */}
      <div className="historical-grid" style={{ marginTop: '0.5rem' }}>
        {/* Seasonal Analysis */}
        {seasonal && seasonal.seasons && (
          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              🌾 Seasonal Price Analysis
            </div>
            {seasonal.seasons.map((s) => (
              <div key={s.season} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.86rem' }}>
                <span style={{ fontWeight: 600 }}>{s.season}:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                  ₹{s.average_price.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>({s.observations} obs)</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Volatility & Anomaly */}
        <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              📊 Price Volatility & Consistency
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: volatility.category === 'High' ? 'var(--accent-red)' : 'var(--primary-dark)' }}>
                {volatility.category} Volatility
              </span>
              <span className="card-badge" style={{ backgroundColor: '#fff', fontSize: '0.75rem' }}>
                CV: {volatility.cv_percentage}%
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {volatility.description}
            </p>
          </div>

          {/* Anomaly Callout if applicable */}
          {anomaly && anomaly.is_anomaly && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem', backgroundColor: 'var(--red-wash)', borderRadius: 'var(--radius-sm)', border: '1px solid #ffa8a8', fontSize: '0.8rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} />
              <span>{anomaly.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimers */}
      <div className="disclaimer-box">
        <div className="disclaimer-title">Government Data Source & Transparency</div>
        Historical analysis is computed over 10 consecutive years of official state-level monthly Agmarknet data (October 2016 – September 2026). <em>{disclaimers.historical}</em>
      </div>
    </div>
  );
}
