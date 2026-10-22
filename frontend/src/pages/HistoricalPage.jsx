import React, { useState, useEffect } from 'react';
import { AlertCircle, Filter, ShieldCheck } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useTranslation } from '../i18n';
import CropSelector from '../components/common/CropSelector';
import HistoricalChart from '../components/charts/HistoricalChart';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export default function HistoricalPage() {
  const { filters, updateFilters, commodities, states } = useMarket();
  const { t, formatNumber } = useTranslation();

  const [selectedState, setSelectedState] = useState(filters.state || 'All India');
  const [activeSort, setActiveSort] = useState('highest_average');
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filters.commodity) return;
    setLoading(true);

    const params = new URLSearchParams({
      commodity: filters.commodity,
      state: selectedState || 'All India',
      sort_by: activeSort
    });

    fetch(`/api/market/historical-analysis?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistoricalData(data);
        } else {
          setHistoricalData(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading historical analysis:', err);
        setLoading(false);
      });
  }, [filters.commodity, selectedState, activeSort]);

  const trend = historicalData?.trend;
  const bestMonth = historicalData?.best_month;
  const stateRanking = historicalData?.state_ranking;
  const seasonal = historicalData?.seasonal;
  const volatility = historicalData?.volatility;
  const anomaly = historicalData?.anomaly;
  const series = trend?.series || [];

  return (
    <div className="historical-page">
      {/* Page Header */}
      <div className="page-header-box">
        <h1 className="page-title">
          📊 {t('historical.pageTitle')}
        </h1>
        <p className="page-subtitle">
          {t('historical.pageSubtitle')}
        </p>
      </div>

      {/* Mandatory Transparency Notice */}
      <div className="historical-transparency-banner">
        <ShieldCheck size={18} color="var(--primary)" />
        <div>
          <strong>Historical AgMarknet modal price</strong> &bull; {t('historical.transparencyNote')}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Filter size={18} color="var(--primary)" /> {t('common.actions.filter')}
          </div>
        </div>

        <div className="filter-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <CropSelector
            value={filters.commodity}
            onChange={(val) => updateFilters({ commodity: val })}
            commodities={commodities}
            showAllOption={false}
          />

          <div className="form-group">
            <label className="form-label" htmlFor="hist-state-select">{t('historical.stateRegion')}</label>
            <select
              id="hist-state-select"
              className="form-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="All India">{t('historical.allIndia')}</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <LoadingState message={t('common.states.loadingData')} />
      )}

      {!loading && !historicalData && (
        <EmptyState
          title={t('common.states.noData')}
          message={t('common.states.tryBroadening')}
        />
      )}

      {!loading && historicalData && (
        <>
          {/* 10-Year Trend Line Chart Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div>
                <div className="card-title">
                  📈 {t('historical.trendCardTitle')}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {trend?.historical_crop} in {trend?.state} &bull; {formatNumber(series.length)} {t('historical.obsCount')}
                </div>
              </div>

              {trend?.summary && (
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {t('historical.tenYrAvg')}: <strong>₹{formatNumber(trend.summary.average_price)}</strong> | {t('historical.range')}: <strong>₹{formatNumber(trend.summary.min_recorded_price)} – ₹{formatNumber(trend.summary.max_recorded_price)}</strong>{t('market.priceCard.perQuintal')}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-light)' }}>
              <HistoricalChart series={series} height={230} />
            </div>
          </div>

          {/* Best Historical Month & Best State Callouts */}
          <div className="historical-grid" style={{ marginBottom: '1.5rem' }}>
            {/* Best Month */}
            {bestMonth?.best_month && (
              <div className="stat-callout" style={{ borderLeftColor: 'var(--primary-mint)' }}>
                <div className="stat-callout-title">{t('historical.bestMonthTitle')}</div>
                <div className="stat-callout-val" style={{ color: 'var(--primary-dark)' }}>
                  {bestMonth.best_month.month_name}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.15rem' }}>
                  ₹{formatNumber(bestMonth.best_month.average_price)} {t('market.priceCard.perQuintal')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {t('historical.highestAvgModal', { crop: trend?.historical_crop })}
                </div>
                {bestMonth.highest_peak_month && (
                  <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '0.35rem' }}>
                    {t('historical.peakSpike')}: <strong>₹{formatNumber(bestMonth.highest_peak_month.max_recorded_price)}</strong> in {bestMonth.highest_peak_month.month_name}
                  </div>
                )}
              </div>
            )}

            {/* Best State */}
            {stateRanking?.historical_best_insight && (
              <div className="stat-callout" style={{ borderLeftColor: 'var(--accent-gold)' }}>
                <div className="stat-callout-title">{t('historical.topRealizationState')}</div>
                <div className="stat-callout-val" style={{ color: '#92580c' }}>
                  {stateRanking.historical_best_insight.state}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                  {t('historical.tenYrAvg')}: ₹{formatNumber(stateRanking.historical_best_insight.average_price)} / q
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {stateRanking.historical_best_insight.insight_statement}
                </div>
              </div>
            )}
          </div>

          {/* 12-Month Price Heatmap */}
          {bestMonth?.monthly_breakdown && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title">
                  {t('historical.heatmapTitle')}
                </div>
                <span className="card-badge">{t('historical.seasonalCalendar')}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                {t('historical.heatmapDesc', { crop: trend?.historical_crop, state: trend?.state })}
              </p>

              <div className="heatmap-grid">
                {bestMonth.monthly_breakdown.map((m) => {
                  const isBest = bestMonth.best_month && m.month_name === bestMonth.best_month.month_name;
                  return (
                    <div className={`heatmap-cell ${isBest ? 'best' : ''}`} key={m.month_name}>
                      <div className="heatmap-cell-month">{m.month_name.slice(0, 3)}</div>
                      <div className="heatmap-cell-price">
                        {m.average_price > 0 ? `₹${formatNumber(m.average_price)}` : 'N/A'}
                      </div>
                      {isBest && <span style={{ fontSize: '0.65rem', color: '#2b8a3e', fontWeight: 700 }}>★ BEST</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seasonal Analysis & Volatility Cards */}
          <div className="historical-grid" style={{ marginBottom: '1.5rem' }}>
            {/* Seasonal Analysis */}
            {seasonal?.seasons && (
              <div className="card">
                <div style={{ fontSize: '0.84rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {t('historical.seasonalBreakdown')}
                </div>
                {seasonal.seasons.map((s) => (
                  <div key={s.season} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.88rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{s.season}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({formatNumber(s.observations)} obs)</span>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                      ₹{formatNumber(s.average_price)}
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{t('market.priceCard.perQuintal')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Volatility & Anomaly Detection */}
            <div className="card">
              <div style={{ fontSize: '0.84rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {t('historical.volatilityConsistency')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: volatility?.category === 'High' ? 'var(--accent-red)' : 'var(--primary-dark)' }}>
                  {volatility?.category} {t('historical.table.columns.volatility')}
                </span>
                <span className="card-badge" style={{ backgroundColor: 'var(--bg-subtle)', fontSize: '0.76rem' }}>
                  CV: {volatility?.cv_percentage}%
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {volatility?.description}
              </p>

              {/* Anomaly Callout */}
              {anomaly?.is_anomaly && (
                <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--red-wash)', borderRadius: 'var(--radius-sm)', border: '1px solid #ffa8a8', fontSize: '0.82rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertCircle size={16} />
                  <span>{anomaly.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* State-Wise Ranking Comparison Table */}
          {(stateRanking?.rankings || stateRanking?.ranking) && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    {t('historical.stateRankingTitle', { crop: trend?.historical_crop })}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {t('historical.comparisonAcrossStates', { count: stateRanking.total_states || stateRanking.total_states_compared || (stateRanking.rankings || stateRanking.ranking).length })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className={`btn btn-outline ${activeSort === 'highest_average' ? 'active' : ''}`}
                    onClick={() => setActiveSort('highest_average')}
                    style={{ fontSize: '0.76rem', padding: '0.3rem 0.6rem' }}
                  >
                    {t('historical.highestFirst')}
                  </button>
                  <button
                    className={`btn btn-outline ${activeSort === 'lowest_average' ? 'active' : ''}`}
                    onClick={() => setActiveSort('lowest_average')}
                    style={{ fontSize: '0.76rem', padding: '0.3rem 0.6rem' }}
                  >
                    {t('historical.lowestFirst')}
                  </button>
                </div>
              </div>

              <div className="mandi-table-wrapper">
                <table className="mandi-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>{t('historical.table.columns.rank')}</th>
                      <th>{t('historical.table.columns.state')}</th>
                      <th style={{ textAlign: 'right' }}>{t('historical.table.columns.avgPrice')}</th>
                      <th style={{ textAlign: 'right' }}>{t('historical.minRecorded')}</th>
                      <th style={{ textAlign: 'right' }}>{t('historical.maxRecorded')}</th>
                      <th style={{ textAlign: 'right' }}>{t('historical.obsCount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stateRanking.rankings || stateRanking.ranking || []).map((st, idx) => (
                      <tr key={st.state}>
                        <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                          #{st.rank || idx + 1}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                          {st.state}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
                          ₹{st.average_price ? formatNumber(st.average_price) : 'N/A'}<span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{t('market.priceCard.perQuintal')}</span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                          ₹{formatNumber(st.min_price)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--primary-dark)', fontSize: '0.86rem' }}>
                          ₹{formatNumber(st.max_price)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {formatNumber(st.observations || st.record_count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legal / Data Disclaimer */}
          <div className="disclaimer-box" style={{ marginTop: '1.5rem' }}>
            <div className="disclaimer-title">Historical AgMarknet Modal Price Transparency</div>
            {t('historical.disclaimer')}
          </div>
        </>
      )}
    </div>
  );
}
