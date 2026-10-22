import React from 'react';
import { useTranslation } from '../../i18n';

export default function MandiSelector({
  value,
  onChange,
  markets = [],
  disabled = false,
  id = 'mandi-selector',
  label,
  showAllOption = true,
  placeholder
}) {
  const { t } = useTranslation();
  const displayLabel = label !== undefined ? label : t('market.filters.market');
  const defaultPlaceholder = placeholder || `-- ${t('common.actions.select')} --`;

  return (
    <div className="form-group">
      {displayLabel && <label className="form-label" htmlFor={id}>{displayLabel}</label>}
      <select
        id={id}
        className="form-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {showAllOption && <option value="">-- {t('market.filters.allMarkets')} --</option>}
        {!showAllOption && <option value="">{defaultPlaceholder}</option>}
        {markets.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
