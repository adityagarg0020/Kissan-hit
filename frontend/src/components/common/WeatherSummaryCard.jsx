import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudRain, AlertTriangle, CheckCircle2, ChevronRight, Droplets } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { useTranslation } from '../../i18n';

export default function WeatherSummaryCard() {
  const navigate = useNavigate();
  const { userLocation } = useMarket();
  const { t, formatNumber } = useTranslation();

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const lat = userLocation?.lat || 27.1767;
    const lon = userLocation?.lng || 78.0081;

    setLoading(true);
    fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success) {
          setWeather(data);
          setError(null);
        } else {
          setError(data.error || t('common.errors.unavailable'));
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setError(t('common.errors.unavailable'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userLocation?.lat, userLocation?.lng, t]);

  const topAlert = weather?.alerts?.[0];
  const isAlertWarning = topAlert && topAlert.level === 'warning';

  return (
    <div 
      className="card weather-summary-card"
      onClick={() => navigate('/weather')}
      style={{
        cursor: 'pointer',
        border: '1px solid var(--border-light)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        background: 'linear-gradient(135deg, #f8fbf8 0%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate('/weather'); }}
      aria-label="Open Weather Report and Agricultural Alerts"
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🌦️</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary-dark)' }}>
            {t('weather.summaryCard.title')}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--primary-medium)', display: 'flex', alignItems: 'center', gap: '0.15rem', fontWeight: 600 }}>
          {t('weather.summaryCard.viewDetails')} <ChevronRight size={14} />
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '0.8rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {t('weather.summaryCard.checking')}
        </div>
      ) : error ? (
        <div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600, marginTop: '0.2rem' }}>
            📍 {userLocation?.displayName || userLocation?.district || t('common.location.currentLocation')}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {error}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: 'var(--primary-deep)', fontWeight: 600 }}>
            {t('weather.summaryCard.tapToOpen')}
          </div>
        </div>
      ) : (
        <div>
          {/* Main Temp & Condition */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary-deep)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {weather.current.temperature !== undefined ? `${formatNumber(weather.current.temperature)}°C` : t('weather.current.unavailable')}
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    {weather.current.condition || 'Clear'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {t('weather.summaryCard.feelsLike')} {weather.current.feelsLike !== undefined ? `${formatNumber(weather.current.feelsLike)}°C` : t('weather.current.unavailable')}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CloudRain size={13} style={{ color: '#228be6' }} /> 
                {t('weather.summaryCard.rain')}: {weather.current.rainProbability !== undefined ? `${formatNumber(weather.current.rainProbability)}%` : t('weather.current.unavailable')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Droplets size={13} style={{ color: '#20c997' }} /> 
                {weather.current.humidity !== undefined ? `${formatNumber(weather.current.humidity)}%` : t('weather.current.unavailable')}
              </span>
            </div>
          </div>

          {/* Location Line */}
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
            📍 {weather.location?.name || userLocation?.displayName || t('common.location.currentLocation')}
          </div>

          {/* Alert Status Pill */}
          <div style={{ marginTop: '0.65rem' }}>
            {isAlertWarning ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#d9480f',
                backgroundColor: '#fff4e6',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid #ffd8a8'
              }}>
                <AlertTriangle size={13} /> {topAlert.title}
              </div>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#2b8a3e',
                backgroundColor: '#ebfbee',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid #b2f2bb'
              }}>
                <CheckCircle2 size={13} /> {topAlert?.title || t('weather.summaryCard.noAlerts')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
