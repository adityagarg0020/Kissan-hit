import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wheat, Calendar, Wallet } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useTranslation } from '../i18n';
import CropSelector from '../components/common/CropSelector';
import StateSelector from '../components/common/StateSelector';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export default function SellDecisionPage() {
  const { t, formatNumber } = useTranslation();
  const { filters, updateFilters, commodities, states } = useMarket();

  const [selectedState, setSelectedState] = useState(filters.state || 'Uttar Pradesh');
  const [currentPriceData, setCurrentPriceData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch current price, historical pattern, and forecast concurrently
  useEffect(() => {
    if (!filters.commodity) return;
    setLoading(true);

    const priceParams = new URLSearchParams({
      commodity: filters.commodity,
      state: selectedState || ''
    });

    const histParams = new URLSearchParams({
      commodity: filters.commodity,
      state: selectedState || 'All India'
    });

    Promise.all([
      fetch(`/api/market/current-price?${priceParams.toString()}`).then(r => r.json()),
      fetch(`/api/market/historical-analysis?${histParams.toString()}`).then(r => r.json()),
      fetch(`/api/market/forecast?commodity=${encodeURIComponent(filters.commodity)}&state=${encodeURIComponent(selectedState || 'Uttar Pradesh')}`).then(r => r.json()),
      fetch(`/api/expenses/summary?crop=${encodeURIComponent(filters.commodity)}`).then(r => r.json()).catch(() => ({ has_records: false }))
    ])
      .then(([pRes, hRes, fRes, eRes]) => {
        if (pRes.success && pRes.data) setCurrentPriceData(pRes.data);
        else setCurrentPriceData(null);

        if (hRes.success) setHistoricalData(hRes);
        else setHistoricalData(null);

        if (fRes.success) setForecastData(fRes);
        else setForecastData(null);

        if (eRes && eRes.success && eRes.has_records) setExpenseSummary(eRes);
        else setExpenseSummary(null);

        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading sell decision data:', err);
        setLoading(false);
      });
  }, [filters.commodity, selectedState]);

  // Determine synthesis recommendation from verified backend data
  const currentModal = currentPriceData?.modal_price || null;
  const histAvg = historicalData?.trend?.summary?.average_price || null;
  const forecastTrend = forecastData?.trend || 'Stable';
  const volatilityCat = historicalData?.volatility?.category || 'Moderate';
  const bestMonthName = historicalData?.best_month?.best_month?.month_name || null;

  // Recommendation logic synchronized with backend ML decision support
  let recommendationType = 'stable';
  let recommendationTitle = t('sellDecision.recTitles.stable');
  let rationaleExplanation = '';
  let favorableWindow = t('sellDecision.windows.stable');

  const priceDiffPct = (currentModal && histAvg && histAvg > 0)
    ? Math.round(((currentModal - histAvg) / histAvg) * 100)
    : null;

  if (!currentPriceData && !historicalData && !forecastData) {
    recommendationType = 'insufficient';
    recommendationTitle = t('sellDecision.recTitles.insufficient');
    rationaleExplanation = t('sellDecision.rationales.insufficient');
    favorableWindow = t('sellDecision.windows.insufficient');
  } else if (forecastData?.decision_support) {
    // Ground directly in backend ML decision support
    const backendRec = forecastData.decision_support.recommendation;
    if (backendRec.toLowerCase().includes('wait')) {
      recommendationType = 'wait';
      recommendationTitle = t('sellDecision.recTitles.wait');
      favorableWindow = t('sellDecision.windows.wait');
    } else if (backendRec.toLowerCase().includes('sell')) {
      recommendationType = 'sell';
      recommendationTitle = t('sellDecision.recTitles.sell');
      favorableWindow = t('sellDecision.windows.sell');
    } else {
      recommendationType = 'stable';
      recommendationTitle = t('sellDecision.recTitles.stable');
      favorableWindow = t('sellDecision.windows.stable');
    }
    rationaleExplanation = forecastData.decision_support.rationale;
  } else if (priceDiffPct !== null && priceDiffPct > 15) {
    recommendationType = 'sell';
    recommendationTitle = t('sellDecision.recTitles.sell');
    rationaleExplanation = t('sellDecision.rationales.sellHigh', {
      current: formatNumber(currentModal),
      diff: priceDiffPct,
      avg: formatNumber(histAvg)
    });
    favorableWindow = t('sellDecision.windows.immediate');
  } else {
    recommendationType = 'stable';
    recommendationTitle = t('sellDecision.recTitles.stable');
    rationaleExplanation = t('sellDecision.rationales.stable');
    favorableWindow = t('sellDecision.windows.flexible');
  }

  return (
    <div className="sell-decision-page">
      {/* Page Header */}
      <div className="page-header-box">
        <h1 className="page-title">
          {t('sellDecision.pageTitle')}
        </h1>
        <p className="page-subtitle">
          {t('sellDecision.pageSubtitle')}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Wheat size={18} color="var(--primary)" /> {t('sellDecision.cropAndLocation')}
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
        <LoadingState message={t('sellDecision.loadingMatrix', { crop: filters.commodity })} />
      )}

      {!loading && (
        <>
          {/* Primary Recommendation Banner */}
          <div className={`decision-box ${recommendationType}`} style={{ marginBottom: '1.5rem' }}>
            <div className="decision-tag" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {recommendationTitle}
            </div>

            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              {t('sellDecision.whyGenerated')}
            </div>
            <p className="decision-rationale" style={{ fontSize: '1rem', marginTop: '0.35rem', lineHeight: '1.6' }}>
              {rationaleExplanation}
            </p>

            <div className="favorable-window-badge" style={{ marginTop: '1rem' }}>
              <Calendar size={16} color="var(--primary)" />
              <span>{t('sellDecision.recommendedWindow')} <strong>{favorableWindow}</strong></span>
            </div>
          </div>

          {/* Farm Expense Break-Even Baseline Integration */}
          {expenseSummary && expenseSummary.has_records && (
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #1c7ed6', backgroundColor: '#f0f9ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#0369a1', fontSize: '0.95rem' }}>
                    <Wallet size={18} /> {t('sellDecision.breakEven.title', { crop: expenseSummary.crop })}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.35rem', lineHeight: '1.5' }}>
                    {currentModal ? (
                      currentModal >= expenseSummary.break_even_price
                        ? t('sellDecision.breakEven.above', {
                            price: formatNumber(expenseSummary.break_even_price),
                            cost: formatNumber(expenseSummary.total_cost),
                            current: formatNumber(currentModal),
                            diff: formatNumber(currentModal - expenseSummary.break_even_price)
                          })
                        : t('sellDecision.breakEven.below', {
                            price: formatNumber(expenseSummary.break_even_price),
                            cost: formatNumber(expenseSummary.total_cost),
                            current: formatNumber(currentModal),
                            diff: formatNumber(expenseSummary.break_even_price - currentModal)
                          })
                    ) : (
                      t('sellDecision.breakEven.base', {
                        price: formatNumber(expenseSummary.break_even_price),
                        cost: formatNumber(expenseSummary.total_cost)
                      })
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    {t('sellDecision.breakEven.operationalNote')}
                  </div>
                </div>
                <Link to="/expenses" className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', backgroundColor: '#ffffff' }}>
                  {t('sellDecision.breakEven.viewDetails')}
                </Link>
              </div>
            </div>
          )}

          {/* 4 Pillars of Decision Support */}
          <div className="section-block">
            <h2 className="section-title">
              {t('sellDecision.synthesis.title')}
            </h2>
            <p className="section-subtitle">
              {t('sellDecision.synthesis.subtitle')}
            </p>

            <div className="dashboard-stats-strip" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {/* 1. Current Price */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('sellDecision.synthesis.metric1')}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '0.2rem' }}>
                  {currentModal ? `₹${formatNumber(Number(currentModal))}` : t('sellDecision.synthesis.dataPending')}<span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{currentModal ? t('prediction.perQ') : ''}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: priceDiffPct !== null ? (priceDiffPct >= 0 ? '#2b8a3e' : '#c92a2a') : 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>
                  {priceDiffPct !== null ? (priceDiffPct >= 0 ? `+${priceDiffPct}% ${t('sellDecision.synthesis.vsHistAvg')}` : `${priceDiffPct}% ${t('sellDecision.synthesis.vsHistAvg')}`) : t('sellDecision.synthesis.benchmarkPending')}
                </div>
              </div>

              {/* 2. 10-Year Historical Benchmark */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('sellDecision.synthesis.metric2')}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {histAvg ? `₹${formatNumber(Number(histAvg))}` : t('sellDecision.synthesis.dataPending')}<span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{histAvg ? t('prediction.perQ') : ''}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {t('sellDecision.synthesis.peakSeason')} <strong>{bestMonthName || t('sellDecision.synthesis.seasonalHolding')}</strong>
                </div>
              </div>

              {/* 3. AI 7-Day Trajectory */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('sellDecision.synthesis.metric3')}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: forecastTrend === 'Increasing' ? '#2b8a3e' : forecastTrend === 'Decreasing' ? '#c92a2a' : 'var(--primary-dark)', marginTop: '0.2rem' }}>
                  {forecastTrend === 'Increasing' ? t('prediction.kpis.increasing') : forecastTrend === 'Decreasing' ? t('prediction.kpis.decreasing') : t('prediction.kpis.stable')}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {t('sellDecision.synthesis.shift')} <strong>{forecastData?.predicted_change_pct > 0 ? `+${forecastData?.predicted_change_pct}%` : `${forecastData?.predicted_change_pct || 0}%`}</strong>
                </div>
              </div>

              {/* 4. Volatility & Anomaly */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {t('sellDecision.synthesis.metric4')}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: volatilityCat === 'High' ? 'var(--accent-red)' : 'var(--primary-dark)', marginTop: '0.2rem' }}>
                  {volatilityCat}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {t('sellDecision.synthesis.cv')} <strong>{historicalData?.volatility?.cv_percentage || 14}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Practical Farmer Considerations Card */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">
                {t('sellDecision.considerations.title')}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <strong>{t('sellDecision.considerations.storageTitle')}</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {t('sellDecision.considerations.storageDesc')}
                </p>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <strong>{t('sellDecision.considerations.transportTitle')}</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {t('sellDecision.considerations.transportDesc')}
                </p>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <strong>{t('sellDecision.considerations.liquidityTitle')}</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {t('sellDecision.considerations.liquidityDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Decision Support Non-Guarantee Notice */}
          <div className="disclaimer-box" style={{ marginTop: '1.5rem' }}>
            <div className="disclaimer-title">{t('sellDecision.disclaimerTitle')}</div>
            {t('sellDecision.disclaimer')}
          </div>
        </>
      )}
    </div>
  );
}
