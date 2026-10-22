import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function ExpenseSummaryCard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, formatNumber } = useTranslation();

  useEffect(() => {
    fetch('/api/expenses/summary')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.has_records) {
          setSummary(data);
        } else {
          setSummary(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Failed to load expense summary:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return null;
  }

  if (!summary) {
    return (
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #1c7ed6', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '10px', backgroundColor: '#e7f5ff', color: '#1c7ed6', display: 'flex' }}>
              <Wallet size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                {t('expenses.summaryCard.title')}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {t('expenses.summaryCard.subtitle')}
              </div>
            </div>
          </div>
          <Link to="/expenses" className="btn btn-primary" style={{ fontSize: '0.84rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {t('expenses.summaryCard.startTracker')} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{
      marginBottom: '1.5rem',
      borderLeft: '4px solid var(--primary)',
      background: 'linear-gradient(180deg, #fbfdfa 0%, #ffffff 100%)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Left Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', backgroundColor: '#e8f5e9', color: '#2b8a3e', display: 'flex' }}>
            <Wallet size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('expenses.summaryCard.farmExpenseTracker')} &bull; {summary.season} {summary.year}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
              🌾 {summary.crop} {summary.variety ? `(${summary.variety})` : ''}
            </div>
          </div>
        </div>

        {/* Center Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {t('expenses.summaryCard.totalRecordedCost')}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ₹{formatNumber(summary.total_cost)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {t('expenses.summaryCard.breakEvenPrice')}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2b8a3e' }}>
              {(summary.break_even_price !== null && summary.break_even_price !== undefined) ? `₹${formatNumber(summary.break_even_price)}/q` : '—'}
            </div>
          </div>

          {summary.cost_per_acre && (
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {t('expenses.summaryCard.costPerAcre')}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                ₹{formatNumber(summary.cost_per_acre)}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div>
          <Link
            to="/expenses"
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderColor: 'var(--primary)',
              color: 'var(--primary-dark)',
              fontWeight: 600
            }}
          >
            {t('expenses.summaryCard.viewTracker')} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
