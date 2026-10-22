import React from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function AlertCard({ alert, onDelete }) {
  const { t, formatNumber } = useTranslation();
  if (!alert) return null;

  const formattedPrice = alert.target_price ? formatNumber(alert.target_price) : '';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.88rem',
        gap: '0.75rem'
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
          <Bell size={15} color="var(--primary)" />
          🌾 {alert.commodity} {alert.state ? `(${alert.state})` : ''}
        </div>
        <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.84rem' }}>
          {alert.alert_type === 'above' && t('alerts.active.notifyAbove', { price: formattedPrice })}
          {alert.alert_type === 'below' && t('alerts.active.notifyBelow', { price: formattedPrice })}
          {alert.alert_type === 'movement' && t('alerts.active.notifyMovement', { pct: alert.threshold_pct })}
          {alert.alert_type === 'forecast' && t('alerts.active.notifyForecast')}
        </div>
        {alert.message && (
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-red)', marginTop: '0.2rem', fontWeight: 600 }}>
            {alert.message}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="card-badge" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
          {alert.status === 'Triggered' ? t('alerts.active.statusTriggered') : t('alerts.active.statusActive')}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(alert.id)}
            style={{ background: 'none', border: 'none', color: '#c92a2a', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
            title={t('alerts.active.deleteAlert')}
            aria-label={t('alerts.active.deleteAlert')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
