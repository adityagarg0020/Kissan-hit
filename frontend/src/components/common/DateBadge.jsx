import React from 'react';
import { Calendar } from 'lucide-react';

export default function DateBadge({ date, prefix = 'Arrival' }) {
  if (!date) return null;
  return (
    <span className="card-badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
      <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
      {prefix ? `${prefix}: ` : ''}{date}
    </span>
  );
}
