import React from 'react';
import { Award, Truck } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function RecommendationCard({
  title,
  subtitle,
  price,
  unit = '/q',
  date,
  statement,
  burden,
  distanceLabel,
  icon: Icon = Award
}) {
  const { t, formatNumber, formatDate } = useTranslation();
  const displayTitle = title || t('nearby.topRecommended');

  return (
    <div className="best-mandi-card">
      <div className="best-mandi-badge">
        <Icon size={16} /> 🏆 {displayTitle}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
            {subtitle}
          </div>
          {distanceLabel && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {distanceLabel}
            </div>
          )}
          {burden && (
            <div style={{ marginTop: '0.4rem' }}>
              <span className={`burden-tag ${burden.level ? burden.level.toLowerCase() : 'low'}`}>
                <Truck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                {burden.label || `${burden.level} Burden`}
              </span>
            </div>
          )}
        </div>

        {price !== undefined && price !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              {t('market.priceCard.modalPrice')}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              ₹{formatNumber(price)}
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{unit}</span>
            </div>
            {date && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('market.priceCard.arrivalDate')}: {formatDate(date)}
              </div>
            )}
          </div>
        )}
      </div>

      {statement && (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(45, 106, 79, 0.15)', fontSize: '0.84rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{statement}"
        </div>
      )}
    </div>
  );
}
