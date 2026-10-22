import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, ShieldCheck, AlertCircle, Calendar, LineChart, CheckCircle2 } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useTranslation } from '../i18n';
import CropSelector from '../components/common/CropSelector';
import StateSelector from '../components/common/StateSelector';
import LoadingState from '../components/common/LoadingState';
import AutoTrainStatusCard from '../components/common/AutoTrainStatusCard';

export default function PredictionPage() {
  const { t, formatNumber } = useTranslation();
  const { filters, updateFilters, commodities, states } = useMarket();

  const [selectedState, setSelectedState] = useState(filters.state || 'Uttar Pradesh');
  const [forecastData, setForecastData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [horizon, setHorizon] = useState(7);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Fetch current baseline price first
  useEffect(() => {
    if (!filters.commodity) return;

    const params = new URLSearchParams({
      commodity: filters.commodity,
      state: selectedState || ''
    });

    fetch(`/api/market/current-price?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCurrentPrice(data.data.modal_price);
        } else {
          setCurrentPrice(null);
        }
      })
      .catch(() => setCurrentPrice(null));
  }, [filters.commodity, selectedState]);

  // Fetch AI Prediction with dynamic horizon
  useEffect(() => {
    if (!filters.commodity) return;
    setLoading(true);
    setErrorMsg(null);

    const params = new URLSearchParams({
      commodity: filters.commodity,
      state: selectedState || 'Uttar Pradesh',
      horizon_days: horizon.toString()
    });

    if (currentPrice) {
      params.append('current_price', currentPrice.toString());
    }

    fetch(`/api/market/forecast?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && (data.daily_forecast?.length > 0 || data.monthly_forecast?.length > 0)) {
          setForecastData(data);
        } else if (data.status === 'failed' || data.error) {
          setForecastData(null);
          setErrorMsg(data.error || 'Unable to generate prediction.');
        } else {
          setForecastData(null);
          setErrorMsg('Not enough historical data to generate a reliable forecast.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Forecast error:', err);
        setForecastData(null);
        setErrorMsg('Not enough historical data to generate a reliable forecast.');
        setLoading(false);
      });
  }, [filters.commodity, selectedState, currentPrice, horizon]);

  const trend = forecastData?.trend || 'Stable';
  const dailyList = forecastData?.daily_forecast || [];
  const monthlyList = forecastData?.monthly_forecast || [];
  const modelInfo = forecastData?.model_info;
  const nextMonth = forecastData?.next_month_projection;

  // Render SVG 7-10 Day Trajectory Chart
  const renderTrajectoryChart = () => {
    if (!dailyList || dailyList.length === 0) return null;

    const baseP = Number(forecastData?.current_price) || dailyList[0].predicted_modal_price;
    const chartPoints = [
      {
        day: 0,
        label: 'Today',
        dateStr: 'Baseline',
        price: baseP,
        low: baseP,
        high: baseP,
        isBase: true
      },
      ...dailyList.map(d => ({
        day: d.day,
        label: d.formatted_date,
        dateStr: `${d.day_name}, ${d.formatted_date}`,
        price: d.predicted_modal_price,
        low: d.range_low,
        high: d.range_high,
        change: d.projected_change,
        changePct: d.projected_change_pct,
        confidence: d.confidence,
        isBase: false
      }))
    ];

    const svgWidth = 840;
    const svgHeight = 280;
    const padLeft = 65;
    const padRight = 35;
    const padTop = 30;
    const padBottom = 45;
    const plotW = svgWidth - padLeft - padRight;
    const plotH = svgHeight - padTop - padBottom;

    const allValues = [
      ...chartPoints.map(p => p.low),
      ...chartPoints.map(p => p.high),
      ...chartPoints.map(p => p.price)
    ];
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const yBuffer = Math.max(30, (rawMax - rawMin) * 0.15);
    const minY = Math.floor((rawMin - yBuffer) / 20) * 20;
    const maxY = Math.ceil((rawMax + yBuffer) / 20) * 20;
    const yRange = maxY - minY || 1;

    const getX = (idx) => padLeft + (idx / (chartPoints.length - 1)) * plotW;
    const getY = (val) => padTop + plotH - ((val - minY) / yRange) * plotH;

    // Build SVG polygon coordinates for confidence ribbon
    const upperCoords = chartPoints.map((p, idx) => `${getX(idx).toFixed(1)},${getY(p.high).toFixed(1)}`);
    const lowerCoords = [...chartPoints].reverse().map((p, revIdx) => {
      const idx = chartPoints.length - 1 - revIdx;
      return `${getX(idx).toFixed(1)},${getY(p.low).toFixed(1)}`;
    });
    const ribbonPolygon = `${upperCoords.join(' ')} ${lowerCoords.join(' ')}`;

    // Build polyline points for projected modal trajectory
    const linePoints = chartPoints.map((p, idx) => `${getX(idx).toFixed(1)},${getY(p.price).toFixed(1)}`).join(' ');

    // Horizontal Y-gridlines (4 steps)
    const ySteps = 4;
    const gridLines = [];
    for (let i = 0; i <= ySteps; i++) {
      const val = minY + (i / ySteps) * yRange;
      const yPos = getY(val);
      gridLines.push({ val: Math.round(val), yPos });
    }

    return (
      <div className="trajectory-chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LineChart size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-dark)' }}>
              {t('prediction.dailyTrajectoryTitle', '📈 7–10 Day Daily Price Trajectory')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Horizon Toggle */}
            <div className="horizon-toggle-group">
              <button
                type="button"
                className={`horizon-toggle-btn ${horizon === 7 ? 'active' : ''}`}
                onClick={() => setHorizon(7)}
              >
                {t('prediction.horizon.days7', '7 Days')}
              </button>
              <button
                type="button"
                className={`horizon-toggle-btn ${horizon === 10 ? 'active' : ''}`}
                onClick={() => setHorizon(10)}
              >
                {t('prediction.horizon.days10', '10 Days')}
              </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
                <span>{t('prediction.projectedRateLabel', 'Projected Modal Price')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '8px', backgroundColor: 'rgba(82, 183, 136, 0.35)', border: '1px solid #52b788', borderRadius: '2px' }} />
                <span>{t('prediction.confidenceRibbon', '95% Confidence Band')}</span>
              </div>
            </div>
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="trajectory-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="confidenceRibbonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52b788" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2d6a4f" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1b4332" />
              <stop offset="100%" stopColor="#2d6a4f" />
            </linearGradient>
          </defs>

          {/* Gridlines and Y-axis Labels */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={gl.yPos}
                x2={svgWidth - padRight}
                y2={gl.yPos}
                stroke="var(--border-light)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={gl.yPos + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--text-muted)"
                fontWeight="500"
              >
                ₹{formatNumber(gl.val)}
              </text>
            </g>
          ))}

          {/* 95% Confidence Band Ribbon Polygon */}
          <polygon
            points={ribbonPolygon}
            fill="url(#confidenceRibbonGrad)"
            stroke="#52b788"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.85"
          />

          {/* Trajectory Polyline */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points and Interactivity */}
          {chartPoints.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.price);
            const isHovered = hoveredPoint === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + plotH}
                    stroke="var(--primary)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : (pt.isBase ? 5.5 : 4.5)}
                  fill={pt.isBase ? '#c8963e' : '#ffffff'}
                  stroke={pt.isBase ? '#c8963e' : 'var(--primary)'}
                  strokeWidth={isHovered ? 3 : 2.5}
                />

                {/* X-axis tick label */}
                <text
                  x={cx}
                  y={padTop + plotH + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={pt.isBase ? '700' : '600'}
                  fill={pt.isBase ? '#c8963e' : 'var(--text-secondary)'}
                >
                  {pt.label}
                </text>

                {/* Hover Tooltip Card */}
                {isHovered && (
                  <g className="trajectory-tooltip" transform={`translate(${Math.min(cx - 65, svgWidth - 145)}, ${Math.max(10, cy - 65)})`}>
                    <rect
                      width="135"
                      height="54"
                      rx="6"
                      fill="#1b4332"
                      opacity="0.95"
                      filter="drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                    />
                    <text x="10" y="17" fill="#ffffff" fontSize="10.5" fontWeight="700">
                      {pt.dateStr}
                    </text>
                    <text x="10" y="33" fill="#52b788" fontSize="13" fontWeight="800">
                      ₹{formatNumber(Math.round(pt.price))} /q
                    </text>
                    {!pt.isBase && (
                      <text x="10" y="47" fill="#d8f3dc" fontSize="9.5">
                        Band: ₹{formatNumber(Math.round(pt.low))} – ₹{formatNumber(Math.round(pt.high))}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Day-by-Day Forecast Cards Grid */}
        <div className="daily-forecast-grid">
          {dailyList.map((d) => {
            const isUp = d.direction === 'Increasing';
            const isDown = d.direction === 'Decreasing';

            return (
              <div className="daily-day-card" key={d.day}>
                <div>
                  <div className="daily-day-header">
                    Day {d.day} &bull; {d.day_name}
                  </div>
                  <div className="daily-day-date">
                    {d.formatted_date}
                  </div>
                  <div className="daily-day-price">
                    ₹{formatNumber(Math.round(d.predicted_modal_price))}
                  </div>
                </div>

                <div>
                  <div className={`daily-day-change ${isUp ? 'up' : isDown ? 'down' : 'stable'}`}>
                    {isUp && <TrendingUp size={12} />}
                    {isDown && <TrendingDown size={12} />}
                    {!isUp && !isDown && <Minus size={12} />}
                    <span>{d.projected_change > 0 ? `+₹${d.projected_change}` : `₹${d.projected_change}`} ({d.projected_change_pct > 0 ? `+${d.projected_change_pct}%` : `${d.projected_change_pct}%`})</span>
                  </div>

                  <div className="daily-day-band">
                    ₹{formatNumber(Math.round(d.range_low))} – ₹{formatNumber(Math.round(d.range_high))}
                  </div>

                  <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                    {d.confidence} Conf.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="prediction-page">
      {/* Page Header */}
      <div className="page-header-box">
        <h1 className="page-title">
          🤖 {t('prediction.pageTitle')}
        </h1>
        <p className="page-subtitle">
          {t('prediction.pageSubtitle')}
        </p>
      </div>

      {/* Autonomous AI Learning & Self-Training Pipeline */}
      <AutoTrainStatusCard />

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Sparkles size={18} color="var(--primary)" /> {t('prediction.forecastSettings')}
          </div>
        </div>

        <div className="filter-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <CropSelector
            value={filters.commodity}
            onChange={(val) => updateFilters({ commodity: val })}
            commodities={commodities}
            showAllOption={false}
          />

          <StateSelector
            value={selectedState}
            onChange={(val) => setSelectedState(val)}
            states={states}
            showAllOption={false}
          />
        </div>
      </div>

      {loading && (
        <LoadingState message={t('prediction.loadingModel', { crop: filters.commodity })} />
      )}

      {!loading && errorMsg && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderColor: '#ffa8a8' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--red-wash)', color: 'var(--accent-red)', marginBottom: '0.75rem' }}>
            <AlertCircle size={28} />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-red)' }}>
            {errorMsg}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0.5rem auto' }}>
            {t('prediction.errorValidationDesc')}
          </p>
        </div>
      )}

      {!loading && !errorMsg && forecastData && (
        <>
          {/* Key Forecast Summary Banner */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('prediction.activeForecastFor')}
                </span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '0.1rem' }}>
                  🌾 {forecastData.commodity} &bull; {forecastData.matched_state}
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {t('prediction.currentBaseline')} <strong>₹{formatNumber(Number(forecastData.current_price))}{t('prediction.perQ')}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={`ticker-badge ${trend.toLowerCase()}`} style={{ fontSize: '0.92rem', padding: '0.4rem 0.85rem' }}>
                  {trend === 'Increasing' && <TrendingUp size={16} />}
                  {trend === 'Decreasing' && <TrendingDown size={16} />}
                  {trend === 'Stable' && <Minus size={16} />}
                  {t('prediction.nextMonthTrend')} {trend === 'Increasing' ? t('prediction.kpis.increasing') : trend === 'Decreasing' ? t('prediction.kpis.decreasing') : t('prediction.kpis.stable')} ({forecastData.predicted_change_pct > 0 ? `+${forecastData.predicted_change_pct}%` : `${forecastData.predicted_change_pct}%`})
                </span>

                {nextMonth && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {nextMonth.period} {t('prediction.projectedRate')} <strong>₹{formatNumber(nextMonth.predicted_price)}</strong> {t('prediction.perQuintal')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active 7-10 Day Daily Trajectory Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            {renderTrajectoryChart()}
          </div>

          {/* Decision Support Card */}
          {forecastData.decision_support && (
            <div className={`decision-box ${trend === 'Increasing' ? 'wait' : trend === 'Decreasing' ? 'sell' : 'stable'}`} style={{ marginBottom: '1.5rem' }}>
              <div className="decision-tag" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                {forecastData.decision_support.recommendation === 'Potentially favorable to wait' && t('prediction.recWait')}
                {forecastData.decision_support.recommendation === 'Potentially favorable to sell now' && t('prediction.recSell')}
                {forecastData.decision_support.recommendation !== 'Potentially favorable to wait' && forecastData.decision_support.recommendation !== 'Potentially favorable to sell now' && t('prediction.recStable')}
              </div>

              <p className="decision-rationale" style={{ fontSize: '0.95rem', marginTop: '0.35rem', lineHeight: '1.6' }}>
                {forecastData.decision_support.rationale}
              </p>

              {forecastData.decision_support.market_context && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {t('prediction.historicalContext')} {forecastData.decision_support.market_context}
                </div>
              )}
            </div>
          )}

          {/* Month-by-Month Projected Rates */}
          {monthlyList && monthlyList.length > 0 && (
            <div className="section-block">
              <h2 className="section-title">
                {t('prediction.multiMonthProjections')}
              </h2>
              <p className="section-subtitle">
                {t('prediction.multiMonthSubtitle', { rmse: modelInfo?.test_rmse || 735 })}
              </p>

              <div className="forecast-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {monthlyList.map((m) => (
                  <div className="forecast-day-card" key={m.period} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.88rem' }}>
                      <Calendar size={16} />
                      <span>{m.period}</span>
                    </div>
                    <div className="forecast-price" style={{ fontSize: '1.75rem', margin: '0.6rem 0 0.3rem' }}>
                      ₹{formatNumber(Math.round(m.predicted_modal_price))}
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('prediction.perQ')}</span>
                    </div>
                    <div className="forecast-range" style={{ fontSize: '0.82rem' }}>
                      {t('prediction.uncertaintyBand')} ₹{formatNumber(Math.round(m.range_low))} – ₹{formatNumber(Math.round(m.range_high))}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      {t('prediction.stepProjection', { step: m.step })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Evaluation & Architecture Card */}
          {modelInfo && (
            <div className="card" style={{ marginTop: '1.5rem', backgroundColor: 'var(--bg-subtle)' }}>
              <div className="card-header">
                <div className="card-title" style={{ fontSize: '0.95rem' }}>
                  <ShieldCheck size={18} color="var(--primary)" /> {t('prediction.modelTransparencyTitle')}
                </div>
                <span className="card-badge" style={{ backgroundColor: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={13} color="var(--primary)" /> {t('prediction.zeroLeakage')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{t('prediction.algorithm')}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.1rem' }}>{modelInfo.algorithm}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{t('prediction.holdoutR2')}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.1rem' }}>{modelInfo.test_r2} {t('prediction.unseenData')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{t('prediction.holdoutRmse')}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>₹{formatNumber(modelInfo.test_rmse)} {t('prediction.perQuintal')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{t('prediction.holdoutMae')}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>₹{formatNumber(modelInfo.test_mae)} {t('prediction.perQuintal')}</div>
                </div>
              </div>

              <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '0.65rem' }}>
                {t('prediction.methodology')}
              </div>
            </div>
          )}

          {/* Mandatory AI Disclaimer */}
          <div className="disclaimer-box" style={{ marginTop: '1.25rem' }}>
            <div className="disclaimer-title">{t('prediction.mandatoryDisclaimerTitle')}</div>
            {forecastData.disclaimer || t('prediction.disclaimer')}
          </div>
        </>
      )}
    </div>
  );
}
