import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Sparkles,
  Send,
  ShieldAlert,
  Info,
  MapPin,
  Calendar
} from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useTranslation } from '../i18n';
import LocationSelector from '../components/LocationSelector';

export default function WeatherPage() {
  const { userLocation, setUserLocation } = useMarket();
  const { t, language, formatDate, formatNumber } = useTranslation();

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  // AI Explanation State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLanguage, setAiLanguage] = useState(language === 'hi' ? 'hi' : 'en');
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Synchronize AI language with global app language if user hasn't manually overridden
  useEffect(() => {
    if (language === 'hi' && aiLanguage === 'en') {
      setAiLanguage('hi');
    } else if (language === 'en' && aiLanguage === 'hi') {
      setAiLanguage('en');
    }
  }, [language]);

  // Load weather for coordinates
  const fetchWeather = useCallback(async (forceRefresh = false) => {
    const lat = userLocation?.lat || 27.1767;
    const lon = userLocation?.lng || 78.0081;

    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}${forceRefresh ? '&refresh=true' : ''}`);
      const data = await res.json();

      if (data.success) {
        setWeather(data);
        setError(null);
        setErrorCode(null);
        setErrorDetail(null);
      } else {
        setWeather(null);
        setError(data.error || t('weather.errorTitle'));
        setErrorCode(data.code || null);
        setErrorDetail(data.detail || null);
      }
    } catch (err) {
      setWeather(null);
      setError(language === 'hi' ? 'मौसम सेवा से संपर्क नहीं हो सका। कृपया अपना इंटरनेट कनेक्शन जांचें।' : 'Unable to connect to the weather service. Please check your internet connection.');
      setErrorCode('NETWORK_ERROR');
      setErrorDetail(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation?.lat, userLocation?.lng, language, t]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Request AI explanation
  const handleAiExplain = async (customQuestion = null, lang = aiLanguage) => {
    if (!weather || !weather.current) return;

    setAiLoading(true);
    setAiError(null);

    const q = customQuestion !== null ? customQuestion : aiQuestion;

    try {
      const res = await fetch('/api/weather/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather,
          question: q,
          language: lang
        })
      });
      const data = await res.json();

      if (data.success && data.explanation) {
        setAiExplanation(data.explanation);
      } else {
        setAiError(data.error || (language === 'hi' ? 'व्याख्या तैयार नहीं की जा सकी। कृपया पुनः प्रयास करें।' : 'Could not generate explanation. Please try again.'));
      }
    } catch (err) {
      setAiError(language === 'hi' ? 'AI मौसम सेवा से संपर्क करने में असमर्थ।' : 'Unable to connect to AI explanation service.');
    } finally {
      setAiLoading(false);
    }
  };

  // Format date / timestamp safely
  const formatTimestamp = (isoStr) => {
    if (!isoStr) return t('weather.current.unavailable');
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ', ' +
             formatDate(d, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return t('weather.current.unavailable');
    }
  };

  // Safe localized alert mapper
  const getAlertData = (alert) => {
    switch (alert.type) {
      case 'thunderstorm':
        return {
          title: t('weather.alerts.thunderAlert'),
          message: t('weather.alerts.thunderAlertMsg'),
          farmTip: t('weather.alerts.thunderAlertTip')
        };
      case 'rain':
        return {
          title: t('weather.alerts.rainLikely'),
          message: t('weather.alerts.rainLikelyMsg'),
          farmTip: t('weather.alerts.rainLikelyTip')
        };
      case 'heat':
        return {
          title: t('weather.alerts.heatAlert'),
          message: t('weather.alerts.heatAlertMsg'),
          farmTip: t('weather.alerts.heatAlertTip')
        };
      case 'wind':
        return {
          title: t('weather.alerts.windAlert'),
          message: t('weather.alerts.windAlertMsg'),
          farmTip: t('weather.alerts.windAlertTip')
        };
      case 'none':
        return {
          title: t('weather.alerts.noAlerts'),
          message: t('weather.alerts.noAlertsMsg'),
          farmTip: t('weather.alerts.noAlertsTip')
        };
      default:
        return {
          title: alert.title,
          message: alert.message,
          farmTip: alert.farmTip
        };
    }
  };

  const getAdviceCategory = (category) => {
    if (category === 'Safety & Equipment') return t('weather.guidance.safety');
    if (category === 'Irrigation & Spraying') return t('weather.guidance.irrigation');
    if (category === 'Field Operations') return t('weather.guidance.fieldWork');
    if (category === 'Pesticide Application') return t('weather.guidance.pesticides');
    return category;
  };

  const getDayName = (dayName) => {
    if (dayName === 'Today') return t('weather.forecast.today');
    if (dayName === 'Tomorrow') return t('weather.forecast.tomorrow');
    return dayName;
  };

  const getConditionLabel = (condition) => {
    if (!condition) return t('weather.current.unavailable');
    const key = condition.toLowerCase();
    return t(`weather.conditions.${key}`, condition);
  };

  const samplePrompts = [
    { key: 'today', text: t('weather.ai.prompts.today') },
    { key: 'pesticide', text: t('weather.ai.prompts.pesticide') },
    { key: 'irrigate', text: t('weather.ai.prompts.irrigate') },
    { key: 'rain', text: t('weather.ai.prompts.rain') }
  ];

  return (
    <div className="weather-page" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* 1. Header & Quick Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🌦️</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
              {t('weather.pageTitle')}
            </h1>
          </div>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('weather.pageSubtitle')}
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={() => fetchWeather(true)}
          disabled={loading || refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600
          }}
          aria-label={t('weather.refresh')}
        >
          <RotateCw size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? t('weather.refreshing') : `↻ ${t('weather.refresh')}`}
        </button>
      </div>

      {/* 2. Location Selector System */}
      <div style={{ marginBottom: '1.25rem' }}>
        <LocationSelector
          userLocation={userLocation}
          onLocationChange={(newLoc) => setUserLocation(newLoc)}
        />
      </div>

      {/* 3. Main Content: Loading / Error / Weather Dashboard */}
      {loading ? (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌦️</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
            {t('weather.loadingTitle')}
          </div>
          <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
            {t('weather.loadingSubtitle')}
          </p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', borderLeft: '4px solid var(--accent-red)' }}>
          <AlertTriangle size={36} style={{ color: 'var(--accent-red)', margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
            {t('weather.errorTitle')}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '540px', margin: '0.5rem auto 1rem' }}>
            {error}
          </p>

          {errorCode === 'INVALID_API_KEY' && (
            <div style={{
              maxWidth: '560px',
              margin: '0 auto 1.25rem',
              textAlign: 'left',
              backgroundColor: '#fff9db',
              border: '1px solid #ffe066',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              fontSize: '0.84rem',
              color: '#856404'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ℹ️ OpenWeather Key Activation Note
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, lineHeight: 1.5 }}>
                <li><strong>Activation Delay:</strong> Newly registered OpenWeather keys take <strong>10 to 60 minutes</strong> to propagate across OpenWeather's API servers (OpenWeather Error 401).</li>
                <li><strong>Email Verification:</strong> Ensure you have clicked the confirmation link in the verification email sent by OpenWeather.</li>
                <li>Once activated, click <strong>"{t('weather.retry')}"</strong> below to load live data immediately.</li>
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => fetchWeather(true)}>
              <RotateCw size={14} /> {t('weather.retry')}
            </button>
          </div>
        </div>
      ) : weather && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* A. Current Weather Card */}
          <div className="card" style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f7faf7 0%, #ffffff 100%)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🌦️</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.82rem', color: 'var(--primary-dark)' }}>
                  {t('weather.current.title')}
                </span>
                <span className="card-badge" style={{ backgroundColor: '#e7f5ff', color: '#1971c2', fontSize: '0.72rem' }}>
                  OpenWeather
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {t('weather.current.updated')} <strong>{formatTimestamp(weather.updatedAt)}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              
              {/* Left: Main Big Temperature */}
              <div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                  <MapPin size={15} style={{ color: 'var(--primary-deep)' }} />
                  <strong>{weather.location?.name || t('weather.currentLocation')}</strong> 
                  <span style={{ fontSize: '0.75rem' }}>
                    ({weather.location?.latitude?.toFixed(2)}°N, {weather.location?.longitude?.toFixed(2)}°E)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '3.4rem',
                    fontWeight: 800,
                    color: 'var(--primary-deep)',
                    lineHeight: 1
                  }}>
                    {weather.current.temperature !== undefined ? `${formatNumber(weather.current.temperature)}°C` : t('weather.current.unavailable')}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                      {getConditionLabel(weather.current.condition)}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {weather.current.description || ''}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {t('weather.current.feelsLike')} <strong>{weather.current.feelsLike !== undefined ? `${formatNumber(weather.current.feelsLike)}°C` : t('weather.current.unavailable')}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Key Meteorological Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '0.75rem'
              }}>
                <div className="stat-pill" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#228be6', marginBottom: '0.2rem' }}>
                    <CloudRain size={16} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase' }}>{t('weather.current.rainChance')}</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
                    {weather.current.rainProbability !== undefined ? `${formatNumber(weather.current.rainProbability)}%` : t('weather.current.unavailable')}
                  </div>
                </div>

                <div className="stat-pill" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#20c997', marginBottom: '0.2rem' }}>
                    <Droplets size={16} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase' }}>{t('weather.current.humidity')}</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
                    {weather.current.humidity !== undefined ? `${formatNumber(weather.current.humidity)}%` : t('weather.current.unavailable')}
                  </div>
                </div>

                <div className="stat-pill" style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fd7e14', marginBottom: '0.2rem' }}>
                    <Wind size={16} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase' }}>{t('weather.current.windSpeed')}</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
                    {weather.current.windSpeed !== undefined ? `${formatNumber(weather.current.windSpeed)} km/h` : t('weather.current.unavailable')}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* B. Agricultural Weather Alerts Card */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                {t('weather.alerts.title')}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {weather.alerts && weather.alerts.length > 0 ? (
                weather.alerts.map((alert) => {
                  const isWarn = alert.level === 'warning';
                  const isInfo = alert.level === 'info';
                  const bg = isWarn ? '#fff5f5' : (isInfo ? '#e7f5ff' : '#ebfbee');
                  const border = isWarn ? '#ffc9c9' : (isInfo ? '#a5d8ff' : '#b2f2bb');
                  const color = isWarn ? '#c92a2a' : (isInfo ? '#1864ab' : '#2b8a3e');
                  const localizedAlert = getAlertData(alert);

                  return (
                    <div
                      key={alert.id}
                      style={{
                        backgroundColor: bg,
                        border: `1px solid ${border}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.9rem 1.1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.95rem', color }}>
                        {isWarn ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
                        {localizedAlert.title}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                        {localizedAlert.message}
                      </div>
                      {localizedAlert.farmTip && (
                        <div style={{ marginTop: '0.45rem', fontSize: '0.82rem', color: 'var(--text-main)', backgroundColor: 'rgba(255, 255, 255, 0.75)', padding: '0.4rem 0.65rem', borderRadius: '4px' }}>
                          🌱 <strong>{t('weather.alerts.farmTip')}</strong> {localizedAlert.farmTip}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('weather.alerts.noActiveAlerts')}
                </div>
              )}
            </div>

            {/* Practical Agronomic Guidelines */}
            {weather.advice && weather.advice.length > 0 && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                  {t('weather.guidance.title')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {weather.advice.map((adv, idx) => (
                    <div key={idx} style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 0.9rem'
                    }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-deep)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{adv.icon}</span> {getAdviceCategory(adv.category)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                        {adv.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* C. 5–7 Day Forecast (Horizontal Scroll on Mobile, Grid on Desktop) */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Calendar size={18} style={{ color: 'var(--primary-dark)' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                  {t('weather.forecast.title')}
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('weather.forecast.swipeHint')}
              </span>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.85rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'thin'
            }}>
              {weather.forecast && weather.forecast.length > 0 ? (
                weather.forecast.map((f, idx) => (
                  <div
                    key={f.date || idx}
                    style={{
                      flex: '0 0 160px',
                      backgroundColor: idx === 0 ? '#f4fbf5' : 'var(--bg-card)',
                      border: idx === 0 ? '1.5px solid var(--primary-light)' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: idx === 0 ? 'var(--primary-deep)' : 'var(--text-main)' }}>
                      {getDayName(f.dayName)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {f.date}
                    </div>

                    <div style={{ fontSize: '1.8rem', margin: '0.4rem 0' }}>
                      {f.condition === 'Rain' ? '🌧️' : (f.condition === 'Clouds' ? '☁️' : (f.condition === 'Thunderstorm' ? '⛈️' : '☀️'))}
                    </div>

                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-deep)', fontFamily: 'var(--font-display)' }}>
                      {f.temperature !== undefined ? `${formatNumber(f.temperature)}°C` : '—'}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {formatNumber(f.tempMax)}° / {formatNumber(f.tempMin)}°
                    </div>

                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '999px',
                      backgroundColor: f.rainProbability >= 50 ? '#e7f5ff' : '#f8f9fa',
                      color: f.rainProbability >= 50 ? '#1864ab' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <CloudRain size={11} /> {formatNumber(f.rainProbability)}%
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  {t('weather.forecast.noForecast')}
                </div>
              )}
            </div>
          </div>

          {/* D. AI Weather Explanation Section */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-medium)' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                  {t('weather.ai.title')}
                </h2>
              </div>

              {/* Language Selector: English, Hindi, Hinglish */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('weather.ai.language')}</span>
                {['en', 'hi', 'hinglish'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setAiLanguage(lang);
                      handleAiExplain(null, lang);
                    }}
                    style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      borderRadius: '999px',
                      border: aiLanguage === lang ? '1px solid var(--primary-deep)' : '1px solid var(--border-medium)',
                      backgroundColor: aiLanguage === lang ? 'var(--primary-deep)' : '#ffffff',
                      color: aiLanguage === lang ? '#ffffff' : 'var(--text-main)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'en' ? 'English' : (lang === 'hi' ? 'हिंदी' : 'Hinglish')}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Question Prompts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt.key}
                  onClick={() => {
                    setAiQuestion(prompt.text);
                    handleAiExplain(prompt.text);
                  }}
                  disabled={aiLoading}
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '999px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.76rem',
                    color: 'var(--primary-deep)',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  💬 {prompt.text}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder={t('weather.ai.askPlaceholder')}
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAiExplain(); }}
                disabled={aiLoading}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem'
                }}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleAiExplain()}
                disabled={aiLoading}
                style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Send size={15} />
                {aiLoading ? (language === 'hi' ? 'विश्लेषण...' : 'Explaining...') : t('weather.ai.askButton')}
              </button>
            </div>

            {/* AI Output Area */}
            {aiLoading ? (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {t('weather.ai.explaining')}
              </div>
            ) : aiError ? (
              <div style={{ padding: '0.75rem', backgroundColor: '#fff5f5', color: 'var(--accent-red)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                {aiError}
              </div>
            ) : aiExplanation ? (
              <div style={{
                backgroundColor: '#f8fbf8',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap'
              }}>
                {aiExplanation}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {t('weather.ai.hint')}
              </div>
            )}
          </div>

          {/* E. Official Agricultural & AI Disclaimers */}
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.9rem 1.1rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                {t('weather.disclaimers.planning')}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                {t('weather.disclaimers.aiNotice')}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
