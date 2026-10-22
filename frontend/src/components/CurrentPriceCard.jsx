import React from 'react';
import { Calendar, ShieldCheck, AlertTriangle, Tag, MapPin } from 'lucide-react';

export default function CurrentPriceCard({ priceData, loading }) {
  if (loading) {
    return (
      <div className="price-hero-card">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Fetching official mandi price details...
        </div>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className="price-hero-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Select a crop and mandi from the filters above to view current official prices.
        </p>
      </div>
    );
  }

  const {
    commodity,
    variety,
    grade,
    market,
    district,
    state,
    modal_price,
    min_price,
    max_price,
    price_spread,
    display_date,
    freshness,
    source,
    disclaimer
  } = priceData;

  return (
    <div className="price-hero-card" id="current-price-card">
      <div className="price-hero-header">
        <div>
          <div className="crop-name-hero">
            🌾 {commodity}
          </div>
          <div className="location-breadcrumbs">
            <MapPin size={15} color="var(--primary)" />
            <strong>{market}</strong> &bull; {district}, {state}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {variety && variety !== 'Other' && (
            <span className="card-badge">
              <Tag size={12} style={{ display: 'inline', marginRight: '3px' }} />
              {variety}
            </span>
          )}
          {grade && (
            <span className="card-badge" style={{ backgroundColor: 'var(--blue-wash)', borderColor: '#a5d8ff', color: 'var(--accent-blue)' }}>
              Grade: {grade}
            </span>
          )}
        </div>
      </div>

      {/* Primary Price Statistics */}
      <div className="price-stat-grid">
        {/* Modal Price (Hero) */}
        <div className="modal-price-box">
          <div className="modal-price-label">Current Reported Modal Price</div>
          <div className="modal-price-value">
            ₹{modal_price.toLocaleString('en-IN')}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--primary-soft)', marginLeft: '0.4rem' }}>
              / quintal
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            Most frequent auction rate in session
          </div>
        </div>

        {/* Minimum Price */}
        <div className="secondary-price-box">
          <div className="secondary-price-label">Minimum Price</div>
          <div className="secondary-price-value" style={{ color: 'var(--text-secondary)' }}>
            ₹{min_price.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ quintal</div>
        </div>

        {/* Maximum Price */}
        <div className="secondary-price-box">
          <div className="secondary-price-label">Maximum Price</div>
          <div className="secondary-price-value" style={{ color: 'var(--primary-dark)' }}>
            ₹{max_price.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ quintal</div>
        </div>
      </div>

      {/* Intraday Spread Note */}
      {price_spread > 0 && (
        <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Daily auction spread: <strong>₹{price_spread.toLocaleString('en-IN')}/q</strong> (between min and max grades).
        </div>
      )}

      {/* Data Freshness Indicator */}
      <div className={`freshness-banner ${freshness.status}`}>
        {freshness.status === 'fresh' ? (
          <ShieldCheck size={18} color="var(--primary)" />
        ) : (
          <AlertTriangle size={18} color="var(--accent-red)" />
        )}
        <div>
          <span><strong>Last updated:</strong> {display_date} &bull; {freshness.message}</span>
        </div>
      </div>

      {/* Transparency & Disclaimer */}
      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span>Source: {source}</span>
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}
