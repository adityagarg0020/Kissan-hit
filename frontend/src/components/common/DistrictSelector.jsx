import React from 'react';
import { useTranslation } from '../../i18n';

export default function DistrictSelector({
  value,
  onChange,
  districts = [],
  disabled = false,
  id = 'district-selector',
  label,
  showAllOption = false,
  placeholder
}) {
  const { t } = useTranslation();
  const displayLabel = label !== undefined ? label : t('market.filters.district');
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
        {showAllOption && <option value="">-- {t('market.filters.allDistricts')} --</option>}
        {!showAllOption && <option value="">{defaultPlaceholder}</option>}
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}
