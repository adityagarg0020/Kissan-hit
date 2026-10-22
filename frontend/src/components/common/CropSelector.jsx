import React from 'react';
import { useTranslation } from '../../i18n';

export default function CropSelector({ value, onChange, commodities = [], id = 'crop-selector', label, showAllOption = false }) {
  const { t } = useTranslation();
  const displayLabel = label !== undefined ? label : t('market.filters.commodity');

  return (
    <div className="form-group">
      {displayLabel && <label className="form-label" htmlFor={id}>{displayLabel}</label>}
      <select
        id={id}
        className="form-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {showAllOption && <option value="">-- {t('market.filters.allCommodities')} --</option>}
        {!showAllOption && !value && <option value="">-- {t('common.actions.select')} --</option>}
        {commodities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
