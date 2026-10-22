import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function PriceAlertsModal({ currentCommodity, currentPrice, currentState }) {
  const [alerts, setAlerts] = useState([]);
  const [alertType, setAlertType] = useState('above');
  const [targetPrice, setTargetPrice] = useState(currentPrice ? Math.round(currentPrice * 1.05) : 2600);
  const [thresholdPct, setThresholdPct] = useState(5);
  const [createdMsg, setCreatedMsg] = useState(false);

  useEffect(() => {
    fetch('/api/market/alerts')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAlerts(data.alerts || []);
      })
      .catch(err => console.error('Failed to load alerts:', err));
  }, []);

  const handleCreateAlert = (e) => {
    e.preventDefault();
    const payload = {
      commodity: currentCommodity || 'Wheat',
      state: currentState || 'Uttar Pradesh',
      alert_type: alertType,
      target_price: targetPrice,
      threshold_pct: thresholdPct,
      current_price: currentPrice
    };

    fetch('/api/market/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAlerts([data.alert, ...alerts]);
          setCreatedMsg(true);
          setTimeout(() => setCreatedMsg(false), 3000);
        }
      })
      .catch(err => console.error('Failed to create alert:', err));
  };

  const handleDeleteAlert = (id) => {
    fetch(`/api/market/alerts/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAlerts(alerts.filter(a => a.id !== id));
        }
      })
      .catch(err => console.error('Failed to delete alert:', err));
  };

  return (
    <div className="card" id="alerts-section">
      <div className="card-header">
        <div className="card-title">
          <Bell size={20} color="var(--primary)" /> 🔔 Farmer Market Alerts
        </div>
        <span className="card-badge">{alerts.length} Active Alerts</span>
      </div>

      {/* Alert Creation Form */}
      <form onSubmit={handleCreateAlert} style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
          Create New Price Notification for {currentCommodity || 'Wheat'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">Alert Type</label>
            <select 
              className="form-select" 
              value={alertType} 
              onChange={(e) => setAlertType(e.target.value)}
            >
              <option value="above">Price Rises Above (₹/q)</option>
              <option value="below">Price Drops Below (₹/q)</option>
              <option value="movement">Significant Daily Shift (±%)</option>
              <option value="forecast">AI Forecast Trend Change</option>
            </select>
          </div>

          {(alertType === 'above' || alertType === 'below') && (
            <div className="form-group">
              <label className="form-label">Target Rate (₹/quintal)</label>
              <input 
                type="number" 
                className="form-input" 
                value={targetPrice} 
                onChange={(e) => setTargetPrice(e.target.value)}
                min="100" 
                step="50"
              />
            </div>
          )}

          {alertType === 'movement' && (
            <div className="form-group">
              <label className="form-label">Percentage Shift Threshold</label>
              <input 
                type="number" 
                className="form-input" 
                value={thresholdPct} 
                onChange={(e) => setThresholdPct(e.target.value)}
                min="1" 
                max="50"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
            <Plus size={16} /> Set Alert
          </button>
        </div>

        {createdMsg && (
          <div style={{ marginTop: '0.5rem', color: 'var(--primary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
            <CheckCircle size={15} /> Price alert successfully activated!
          </div>
        )}
      </form>

      {/* Active Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alerts.map((al) => (
          <div 
            key={al.id} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.65rem 0.85rem', 
              backgroundColor: '#ffffff', 
              border: '1px solid var(--border-light)', 
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem'
            }}
          >
            <div>
              <strong>🌾 {al.commodity}</strong> ({al.state}) &bull;{' '}
              {al.alert_type === 'above' && `Notify if price > ₹${al.target_price}/q`}
              {al.alert_type === 'below' && `Notify if price < ₹${al.target_price}/q`}
              {al.alert_type === 'movement' && `Notify on > ${al.threshold_pct}% price shift`}
              {al.alert_type === 'forecast' && `Notify on AI trend change`}
              {al.message && <div style={{ fontSize: '0.78rem', color: 'var(--accent-red)', marginTop: '0.15rem' }}>{al.message}</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="card-badge" style={{ fontSize: '0.72rem' }}>{al.status}</span>
              <button 
                onClick={() => handleDeleteAlert(al.id)} 
                style={{ background: 'none', border: 'none', color: '#c92a2a', cursor: 'pointer', padding: '0.2rem' }}
                title="Delete Alert"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
