import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function DataSourceBadge({ source = 'Agmarknet via Data.gov.in', verified = true }) {
  return (
    <span className="card-badge" style={{ backgroundColor: 'var(--primary-wash)', color: 'var(--primary-dark)', borderColor: 'var(--primary-soft)' }}>
      {verified && <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary)' }} />}
      {source}
    </span>
  );
}
