import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function ErrorState({ title, message, onRetry }) {
  const { t } = useTranslation();

  const displayTitle = title || t('common.errors.networkError', 'Unable to Load Data');
  const displayMessage = message || t('common.errors.loadFailed', 'A network or server error occurred while retrieving market data.');

  return (
    <div className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center', borderColor: '#ffa8a8' }}>
      <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--red-wash)', color: 'var(--accent-red)', marginBottom: '0.75rem' }}>
        <AlertCircle size={28} />
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-red)' }}>
        {displayTitle}
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0.5rem auto 1.25rem auto' }}>
        {displayMessage}
      </p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry} style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>
          <RotateCcw size={14} /> {t('common.actions.retry', 'Retry Request')}
        </button>
      )}
    </div>
  );
}

