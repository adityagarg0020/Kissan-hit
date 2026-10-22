import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  ArrowRight,
  Bell,
  Scale,
  BarChart2,
  Sparkles,
  Wheat,
  Bot,
  CloudSun
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import DataSourceBadge from '../components/common/DataSourceBadge';
import ExpenseSummaryCard from '../components/common/ExpenseSummaryCard';
import WeatherSummaryCard from '../components/common/WeatherSummaryCard';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { filters, updateFilters, userLocation, tickerItems, alertsCount } = useMarket();
  const { user, profile, selectedFarm } = useAuth();
  const { t, formatNumber, formatDate } = useTranslation();

  // Summary statistics
  const [summaryStats, setSummaryStats] = useState(() => {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      totalRecords: 26438,
      totalHistorical: 38550,
      reportingDate: `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`
    };
  });

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // 1. Fetch dynamic record stats from health check
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.mandi_records_count) {
          setSummaryStats(prev => ({
            ...prev,
            totalRecords: data.mandi_records_count,
            totalHistorical: data.historical_records_count || prev.totalHistorical,
            reportingDate: data.mandi_session_freshness || prev.reportingDate
          }));
        }
      })
      .catch(console.error);

    // 2. Fetch active alerts
    fetch('/api/market/alerts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.alerts) {
          setAlerts(data.alerts);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelectCrop = (commodity) => {
    updateFilters({ commodity });
    navigate('/market');
  };

  const featureCards = [
    {
      to: '/market',
      key: 'liveMarket',
      icon: TrendingUp,
      color: 'var(--primary)'
    },
    {
      to: '/nearby-mandis',
      key: 'nearbyMandis',
      icon: MapPin,
      color: '#1b4332'
    },
    {
      to: '/comparison',
      key: 'comparison',
      icon: Scale,
      color: '#c8963e'
    },
    {
      to: '/historical',
      key: 'historical',
      icon: BarChart2,
      color: '#2d6a4f'
    },
    {
      to: '/prediction',
      key: 'prediction',
      icon: Sparkles,
      color: '#40916c'
    },
    {
      to: '/sell-decision',
      key: 'sellDecision',
      icon: Wheat,
      color: '#92580c'
    },
    {
      to: '/expenses',
      key: 'expenses',
      icon: TrendingUp,
      color: '#2b8a3e'
    },
    {
      to: '/weather',
      key: 'weather',
      icon: CloudSun,
      color: '#0ca678'
    },
    {
      to: '/alerts',
      key: 'alerts',
      icon: Bell,
      customBadge: `${alertsCount} ${t('dashboard.featureCards.alerts.badge')}`,
      color: '#c92a2a'
    },
    {
      to: '/ai-assistant',
      key: 'assistant',
      icon: Bot,
      color: '#2b8a3e'
    }
  ];

  return (
    <div className="dashboard-page">
      {/* 1. Welcome / Farmer Hero Banner */}
      <section className="dashboard-hero-card">
        <div className="dashboard-hero-content">
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
              <div className="farmer-tag">
                <span>🌱</span> {t('common.greeting', 'Namaste')}, {profile?.full_name || t('profile.personal.farmerBrother', 'Farmer Brother')}!
                {selectedFarm && <span> &bull; 🌾 {selectedFarm.farm_name} ({selectedFarm.area} {selectedFarm.area_unit})</span>}
              </div>
            </div>
          )}
          <h1 className="dashboard-greeting">
            {t('dashboard.welcomeTitle')}
          </h1>
          <p className="dashboard-lead">
            {t('dashboard.welcomeLead')}
          </p>

          <div className="dashboard-quick-location">
            <MapPin size={15} color="var(--primary)" />
            <span>{t('common.location.defaultHub')}: <strong>{userLocation.district || 'Agra'}, {userLocation.state || 'Uttar Pradesh'}</strong></span>
            <Link to="/nearby-mandis" className="link-inline" style={{ marginLeft: '0.5rem', fontSize: '0.82rem' }}>
              {t('common.actions.changeLocation')} &rarr;
            </Link>
          </div>
        </div>

        <div className="dashboard-stats-strip">
          <div className="stat-pill">
            <div className="stat-num">{formatNumber(summaryStats.totalRecords)}</div>
            <div className="stat-lbl">{t('dashboard.activeRecords')}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num">{formatNumber(summaryStats.totalHistorical)}</div>
            <div className="stat-lbl">{t('dashboard.historicalPoints')}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num">{formatDate(summaryStats.reportingDate)}</div>
            <div className="stat-lbl">{t('dashboard.sessionFreshness')}</div>
          </div>
        </div>
      </section>

      {/* Weather & Farm Expense Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <WeatherSummaryCard />
        <ExpenseSummaryCard />
      </div>

      {/* 2. Selected / Popular Crop Prices (Actual Market Data) */}
      <section className="section-block">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">
              {t('dashboard.popularCropsTitle')}
            </h2>
            <p className="section-subtitle">
              {t('dashboard.popularCropsSubtitle')}
            </p>
          </div>
          <Link to="/market" className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
            {t('dashboard.viewAllMandis')}
          </Link>
        </div>

        <div className="popular-crops-grid">
          {tickerItems.slice(0, 8).map((crop) => (
            <div
              key={crop.commodity}
              className="popular-crop-card"
              onClick={() => handleSelectCrop(crop.commodity)}
              title={`${t('common.actions.explore')} ${crop.commodity}`}
            >
              <div className="popular-crop-top">
                <span className="crop-title">🌾 {crop.commodity}</span>
                {crop.movement === 'up' && (
                  <span className="ticker-badge up" style={{ fontSize: '0.72rem' }}>
                    <TrendingUp size={12} /> +₹{formatNumber(Math.abs(crop.change))}
                  </span>
                )}
                {crop.movement === 'down' && (
                  <span className="ticker-badge down" style={{ fontSize: '0.72rem' }}>
                    <TrendingDown size={12} /> -₹{formatNumber(Math.abs(crop.change))}
                  </span>
                )}
                {crop.movement === 'neutral' && (
                  <span className="ticker-badge neutral" style={{ fontSize: '0.72rem' }}>
                    <Minus size={12} /> {t('common.ticker.steady')}
                  </span>
                )}
              </div>

              <div className="popular-crop-price">
                ₹{formatNumber(crop.modal_price)}
                <span className="price-unit">{crop.unit}</span>
              </div>

              <div className="popular-crop-footer">
                <span>{t('dashboard.arrival')}: {formatDate(crop.date)}</span>
                <span className="crop-action-hint">{t('dashboard.exploreHint')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Important Active Alerts Banner */}
      {alerts.length > 0 && (
        <section className="alerts-summary-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="alert-bell-icon">
              <Bell size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--primary-dark)' }}>
                {alerts.length} {t('dashboard.featureCards.alerts.title')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {alerts[0].commodity} ({alerts[0].alert_type === 'above' ? `> ₹${formatNumber(alerts[0].target_price)}/q` : `< ₹${formatNumber(alerts[0].target_price)}/q`})
              </div>
            </div>
          </div>

          <Link to="/alerts" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            {t('dashboard.viewAllAlerts')}
          </Link>
        </section>
      )}

      {/* 4. Quick Navigation Cards to Major Modules */}
      <section className="section-block">
        <h2 className="section-title">
          {t('dashboard.exploreFeatures')}
        </h2>
        <p className="section-subtitle">
          {t('dashboard.exploreSubtitle')}
        </p>

        <div className="feature-nav-grid">
          {featureCards.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link to={feat.to} key={feat.to} className="feature-nav-card">
                <div className="feature-card-header">
                  <div className="feature-icon-wrapper" style={{ color: feat.color, backgroundColor: 'var(--bg-subtle)' }}>
                    <Icon size={22} />
                  </div>
                  <span className="feature-pill">
                    {feat.customBadge || t(`dashboard.featureCards.${feat.key}.badge`)}
                  </span>
                </div>

                <h3 className="feature-card-title">{t(`dashboard.featureCards.${feat.key}.title`)}</h3>
                <p className="feature-card-desc">{t(`dashboard.featureCards.${feat.key}.desc`)}</p>

                <div className="feature-card-action">
                  <span>{t('dashboard.openTool')}</span>
                  <ArrowRight size={15} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Data Freshness & Official Transparency Notice */}
      <section className="card" style={{ marginTop: '1.5rem', backgroundColor: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
              {t('dashboard.guaranteeTitle')}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {t('dashboard.guaranteeDesc')}
            </div>
          </div>
          <DataSourceBadge source="Agmarknet Data.gov.in Certified" verified={true} />
        </div>
      </section>
    </div>
  );
}
