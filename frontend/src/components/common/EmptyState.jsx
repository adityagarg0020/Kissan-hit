import React from 'react';
import { SearchX } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function EmptyState({
  title,
  message,
  action
}) {
  const { t } = useTranslation();
  const displayTitle = title || t('common.states.noRecordsFound');
  const displayMsg = message || t('common.states.tryBroadening');

  return (
    <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        <SearchX size={28} />
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
        {displayTitle}
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0.4rem auto 1rem auto' }}>
        {displayMsg}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
