import React from 'react';
import { useTranslation } from '../../i18n';

export default function LoadingState({ message, rows = 3 }) {
  const { t } = useTranslation();
  const displayMsg = message || t('common.states.loadingData');

  return (
    <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--primary-soft)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
        {displayMsg}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
        {t('common.states.querying')}
      </div>
    </div>
  );
}
