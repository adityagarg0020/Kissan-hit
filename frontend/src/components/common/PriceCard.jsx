import React from 'react';
import { MapPin, Tag, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function PriceCard({ priceData, compact = false, showSpread = true }) {
  const { t, formatNumber, formatDate } = useTranslation();
  if (!priceData) return null;

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
    arrival_date,
    freshness,
    source,
    disclaimer
  } = priceData;

  const rawDate = display_date || arrival_date;
  const dateStr = rawDate ? formatDate(rawDate) : t('market.priceCard.recent');

  return (
    <div className={`price-hero-card ${compact ? 'price-card-compact' : ''}`}>
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
              {t('market.priceCard.grade')}: {grade}
            </span>
          )}
        </div>
      </div>

      {/* Primary Price Statistics */}
      <div className="price-stat-grid">
        <div className="modal-price-box">
          <div className="modal-price-label">{t('market.priceCard.modalPrice')}</div>
          <div className="modal-price-value">
            ₹{formatNumber(modal_price)}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--primary-soft)', marginLeft: '0.4rem' }}>
              {t('market.priceCard.perQuintal')}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            {t('market.priceCard.mostFrequent')}
          </div>
        </div>

        <div className="secondary-price-box">
          <div className="secondary-price-label">{t('market.priceCard.minRate')}</div>
          <div className="secondary-price-value" style={{ color: 'var(--text-secondary)' }}>
            ₹{formatNumber(min_price)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('market.priceCard.perQuintal')}</div>
        </div>

        <div className="secondary-price-box">
          <div className="secondary-price-label">{t('market.priceCard.maxRate')}</div>
          <div className="secondary-price-value" style={{ color: 'var(--primary-dark)' }}>
            ₹{formatNumber(max_price)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('market.priceCard.perQuintal')}</div>
        </div>
      </div>

      {showSpread && price_spread > 0 && (
        <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {t('market.priceCard.spread')}: <strong>₹{formatNumber(price_spread)}/q</strong>
        </div>
      )}

      {freshness && (
        <div className={`freshness-banner ${freshness.status || 'fresh'}`}>
          {freshness.status === 'fresh' ? (
            <ShieldCheck size={18} color="var(--primary)" />
          ) : (
            <AlertTriangle size={18} color="var(--accent-red)" />
          )}
          <div>
            <span><strong>{t('market.priceCard.arrivalDate')}:</strong> {dateStr} &bull; {freshness.message || t('market.priceCard.officialSession')}</span>
          </div>
        </div>
      )}

      {(source || disclaimer) && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          {source && <span>{t('market.priceCard.source')}: {source}</span>}
          {disclaimer && <span>{disclaimer}</span>}
        </div>
      )}
    </div>
  );
}
