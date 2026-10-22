import React from 'react';
import { useTranslation } from '../../i18n';

export default function StateSelector({ value, onChange, states = [], id = 'state-selector', label, showAllOption = false }) {
  const { t } = useTranslation();
  const displayLabel = label !== undefined ? label : t('market.filters.state');

  return (
    <div className="form-group">
      {displayLabel && <label className="form-label" htmlFor={id}>{displayLabel}</label>}
      <select
        id={id}
        className="form-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {showAllOption && <option value="">-- {t('market.filters.allStates')} --</option>}
        {!showAllOption && !value && <option value="">-- {t('common.actions.select')} --</option>}
        {states.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
