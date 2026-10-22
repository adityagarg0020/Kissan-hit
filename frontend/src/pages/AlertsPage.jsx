import React, { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle, ShieldCheck } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import CropSelector from '../components/common/CropSelector';
import StateSelector from '../components/common/StateSelector';
import AlertCard from '../components/common/AlertCard';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

export default function AlertsPage() {
  const { filters, commodities, states, setAlertsCount } = useMarket();
  const { session } = useAuth();
  const { t, formatNumber } = useTranslation();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [selectedCrop, setSelectedCrop] = useState(filters.commodity || 'Wheat');
  const [selectedState, setSelectedState] = useState(filters.state || 'Uttar Pradesh');
  const [alertType, setAlertType] = useState('above');
  const [targetPrice, setTargetPrice] = useState(2600);
  const [thresholdPct, setThresholdPct] = useState(5);
  const [currentMarketPrice, setCurrentMarketPrice] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch current live benchmark price whenever selected crop or state changes
  useEffect(() => {
    if (!selectedCrop) return;
    const params = new URLSearchParams({ commodity: selectedCrop });
    if (selectedState && selectedState !== 'All India') {
      params.append('state', selectedState);
    }
    fetch(`/api/market/current-price?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.modal_price) {
          setCurrentMarketPrice(data.data.modal_price);
          setTargetPrice(Math.round(data.data.modal_price * 1.05));
        } else {
          setCurrentMarketPrice(null);
        }
      })
      .catch(err => console.error('Failed to fetch benchmark price:', err));
  }, [selectedCrop, selectedState]);

  // Load existing alerts
  const loadAlerts = () => {
    setLoading(true);
    const headers = session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
    fetch('/api/market/alerts', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.alerts) {
          setAlerts(data.alerts);
          setAlertsCount(data.alerts.length);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load alerts:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAlerts();
  }, [session?.access_token]);

  const handleCreateAlert = (e) => {
    e.preventDefault();

    const payload = {
      commodity: selectedCrop,
      state: selectedState,
      alert_type: alertType,
      target_price: parseFloat(targetPrice) || (currentMarketPrice ? Math.round(currentMarketPrice * 1.05) : 2500),
      threshold_pct: parseFloat(thresholdPct) || 5,
      current_price: currentMarketPrice || (parseFloat(targetPrice) || null)
    };

    fetch('/api/market/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.alert) {
          const updated = [data.alert, ...alerts];
          setAlerts(updated);
          setAlertsCount(updated.length);
          setSuccessMsg(t('alerts.create.activated', { crop: selectedCrop }));
          setTimeout(() => setSuccessMsg(null), 3500);
        }
      })
      .catch(err => console.error('Failed to create alert:', err));
  };

  const handleDeleteAlert = (id) => {
    fetch(`/api/market/alerts/${id}`, {
      method: 'DELETE',
      headers: {
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const updated = alerts.filter(a => a.id !== id);
          setAlerts(updated);
          setAlertsCount(updated.length);
        }
      })
      .catch(err => console.error('Failed to delete alert:', err));
  };

  return (
    <div className="alerts-page">
      {/* Page Header */}
      <div className="page-header-box">
        <h1 className="page-title">
          🔔 {t('alerts.pageTitle')}
        </h1>
        <p className="page-subtitle">
          {t('alerts.pageSubtitle')}
        </p>
      </div>

      {/* 1. Create New Price Alert Form Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Plus size={18} color="var(--primary)" /> {t('alerts.create.title')}
          </div>
          <span className="card-badge">{t('alerts.create.activeBadge', { count: alerts.length })}</span>
        </div>

        <form onSubmit={handleCreateAlert}>
          <div className="filter-grid" style={{ marginBottom: '1rem' }}>
            {/* Crop */}
            <CropSelector
              value={selectedCrop}
              onChange={(val) => setSelectedCrop(val)}
              commodities={commodities}
              showAllOption={false}
            />

            {/* State */}
            <StateSelector
              value={selectedState}
              onChange={(val) => setSelectedState(val)}
              states={states}
              showAllOption={false}
            />

            {/* Alert Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="alert-type-select">{t('alerts.create.conditionLabel')}</label>
              <select
                id="alert-type-select"
                className="form-select"
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
              >
                <option value="above">{t('alerts.create.above')}</option>
                <option value="below">{t('alerts.create.below')}</option>
                <option value="movement">{t('alerts.create.movement')}</option>
                <option value="forecast">{t('alerts.create.forecast')}</option>
              </select>
            </div>

            {/* Conditional Target Input */}
            {(alertType === 'above' || alertType === 'below') && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" htmlFor="target-price-input" style={{ marginBottom: 0 }}>
                    {t('alerts.create.targetPrice')}
                  </label>
                  {currentMarketPrice && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {t('alerts.create.liveMandi', { price: formatNumber(currentMarketPrice) })}
                    </span>
                  )}
                </div>
                <input
                  id="target-price-input"
                  type="number"
                  className="form-input"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  min="100"
                  step="50"
                  required
                />
              </div>
            )}

            {alertType === 'movement' && (
              <div className="form-group">
                <label className="form-label" htmlFor="threshold-pct-input">
                  {t('alerts.create.shiftThreshold')}
                </label>
                <input
                  id="threshold-pct-input"
                  type="number"
                  className="form-input"
                  value={thresholdPct}
                  onChange={(e) => setThresholdPct(e.target.value)}
                  min="1"
                  max="50"
                  required
                />
              </div>
            )}

            {alertType === 'forecast' && (
              <div className="form-group">
                <label className="form-label">{t('alerts.create.forecastWatch')}</label>
                <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {t('alerts.create.forecastHint')}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              <Plus size={16} /> {t('alerts.create.saveBtn')}
            </button>

            {successMsg && (
              <div style={{ color: 'var(--primary)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* 2. Active Alerts List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Bell size={18} color="var(--primary)" /> {t('alerts.active.title')}
          </div>
          <button className="btn btn-outline" onClick={loadAlerts} style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
            {t('alerts.active.refresh')}
          </button>
        </div>

        {loading ? (
          <LoadingState message={t('alerts.active.loading')} />
        ) : alerts.length === 0 ? (
          <EmptyState
            title={t('alerts.active.emptyTitle')}
            message={t('alerts.active.emptyMessage')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {alerts.map((al) => (
              <AlertCard
                key={al.id}
                alert={al}
                onDelete={handleDeleteAlert}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Advisory Card */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <ShieldCheck size={22} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
              {t('alerts.advisory.title')}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.5' }}>
              {t('alerts.advisory.text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
