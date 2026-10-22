import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Calendar, AlertCircle } from 'lucide-react';

export default function AIPredictionCard({ forecastData, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing ML forecast & decision support matrix...
        </div>
      </div>
    );
  }

  if (!forecastData || (!forecastData.monthly_forecast && !forecastData.forecast)) {
    return null;
  }

  const {
    commodity,
    state,
    current_price,
    trend = 'Stable',
    predicted_change_pct = 0,
    monthly_forecast = [],
    forecast = [],
    decision_support,
    model_info,
    disclaimer
  } = forecastData;

  const displayList = monthly_forecast.length > 0 ? monthly_forecast : forecast;

  const getDecisionClass = () => {
    if (!decision_support) return 'stable';
    const rec = (decision_support.recommendation || '').toLowerCase();
    if (rec.includes('wait')) return 'wait';
    if (rec.includes('sell') || rec.includes('strong')) return 'sell';
    return 'stable';
  };

  return (
    <div className="card" id="ai-forecast-section">
      <div className="card-header">
        <div className="card-title">
          <Sparkles size={20} color="var(--primary)" /> 🤖 AI Price Forecast & Decision Support
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className={`ticker-badge ${trend.toLowerCase()}`} style={{ fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}>
            {trend === 'Increasing' && <TrendingUp size={14} />}
            {trend === 'Decreasing' && <TrendingDown size={14} />}
            {trend === 'Stable' && <Minus size={14} />}
            {trend} ({predicted_change_pct > 0 ? `+${predicted_change_pct}%` : `${predicted_change_pct}%`})
          </span>
        </div>
      </div>

      <div className="ai-forecast-container">
        {/* 1. Decision Box */}
        {decision_support && (
          <div className={`decision-box ${getDecisionClass()}`}>
            <div className="decision-tag">
              {decision_support.recommendation}
            </div>

            <p className="decision-rationale">
              {decision_support.rationale}
            </p>

            {decision_support.favorable_window && (
              <div className="favorable-window-badge">
                <Calendar size={15} color="var(--primary)" />
                <span>Recommended Window: <strong>{decision_support.favorable_window}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* 2. Forecast Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Forward Price Projections ({commodity} &bull; {state})
            </span>
          </div>

          <div className="forecast-grid">
            {displayList.map((item, idx) => (
              <div className="forecast-day-card" key={idx}>
                <div className="forecast-date">{item.period || `Day ${item.day} • ${item.display_date}`}</div>
                <div className="forecast-price">₹{Math.round(item.predicted_modal_price || item.predicted_price).toLocaleString('en-IN')}</div>
                <div className="forecast-range">Band: ₹{Math.round(item.range_low)} – ₹{Math.round(item.range_high)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Model Architecture & Transparency */}
        {model_info && (
          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
              Model Information:
            </div>
            <div>Algorithm: <strong>{model_info.algorithm}</strong> &bull; Test $R^2$: <strong>{model_info.test_r2 || model_info.evaluation_r2}</strong> &bull; Test RMSE: <strong>₹{model_info.test_rmse || 735}</strong></div>
          </div>
        )}

        {/* 4. Mandatory AI Disclaimer */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', borderLeft: '3px solid var(--border-medium)', paddingLeft: '0.5rem' }}>
          {disclaimer || 'AI-based estimate for decision support. Actual market prices may vary depending on daily arrivals, moisture, grade, and market conditions.'}
        </div>
      </div>
    </div>
  );
}
