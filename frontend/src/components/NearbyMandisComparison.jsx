import React, { useState } from 'react';
import { Award, Navigation, Truck, TrendingUp, Info } from 'lucide-react';

export default function NearbyMandisComparison({ comparisonData, loading }) {
  const [showWeightsInfo, setShowWeightsInfo] = useState(false);

  if (loading) {
    return (
      <div className="card">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Finding and comparing nearby mandis...
        </div>
      </div>
    );
  }

  if (!comparisonData || !comparisonData.comparison || comparisonData.comparison.length === 0) {
    return null;
  }

  const { best_mandi, comparison, spread_analysis } = comparisonData;

  return (
    <div className="card" id="nearby-mandis-section">
      <div className="card-header">
        <div className="card-title">
          <Navigation size={20} color="var(--primary)" /> Nearby Mandis & Comparison
        </div>
        <button 
          className="btn btn-outline" 
          onClick={() => setShowWeightsInfo(!showWeightsInfo)}
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
        >
          <Info size={14} /> How it's calculated
        </button>
      </div>

      {showWeightsInfo && (
        <div style={{ backgroundColor: 'var(--primary-wash)', border: '1px solid var(--primary-soft)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.84rem' }}>
          <strong>Recommendation Algorithm Weights:</strong>
          <ul style={{ marginLeft: '1.25rem', marginTop: '0.3rem' }}>
            <li><strong>Current Reported Modal Price (60%):</strong> Prioritizes mandis reporting higher buyer auction rates.</li>
            <li><strong>Distance Proximity (30%):</strong> Rewards closer markets based on approx. straight-line distance to district market center.</li>
            <li><strong>Data Freshness (10%):</strong> Rewards recent market sessions over older records.</li>
          </ul>
          <p style={{ marginTop: '0.4rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            "Recommended based on current reported price, distance and data freshness. Net realization depends on your individual transport costs and lot grading."
          </p>
        </div>
      )}

      {/* Best Recommended Mandi Highlight */}
      {best_mandi && (
        <div className="best-mandi-card">
          <div className="best-mandi-badge">
            <Award size={16} /> 🏆 Top Recommended Mandi
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-deep)' }}>
                {best_mandi.market}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {best_mandi.district}, {best_mandi.state} &bull; {best_mandi.distance_label}
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                <span className={`burden-tag ${best_mandi.transportation_burden.level.toLowerCase()}`}>
                  <Truck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  {best_mandi.transportation_burden.label}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Modal Price
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                ₹{best_mandi.modal_price.toLocaleString('en-IN')}
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/q</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Date: {best_mandi.arrival_date}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(45, 106, 79, 0.15)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <em>{best_mandi.recommendation_statement}</em>
          </div>
        </div>
      )}

      {/* Price Spread Callout */}
      {spread_analysis && spread_analysis.price_spread > 0 && (
        <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderLeft: '4px solid var(--accent-gold)' }}>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Price Difference Across Nearby Mandis
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
              {spread_analysis.spread_label}
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            High: <strong>₹{spread_analysis.highest_reported_price.toLocaleString('en-IN')}</strong> | Low: <strong>₹{spread_analysis.lowest_reported_price.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      )}

      {/* Nearby Mandis Grid */}
      <div className="mandi-card-grid">
        {comparison.slice(0, 6).map((mandi, idx) => (
          <div className={`mandi-card ${idx === 0 ? 'is-best' : ''}`} key={`${mandi.market}-${idx}`}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div className="mandi-card-name">{mandi.market}</div>
                {idx === 0 && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-dark)', background: '#d8f3dc', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    BEST
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {mandi.district}, {mandi.state}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className={`burden-tag ${mandi.transportation_burden.level.toLowerCase()}`}>
                  {mandi.distance_km !== null ? `${mandi.distance_km} km` : 'Distance N/A'} &bull; {mandi.transportation_burden.level} Burden
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Min: ₹{mandi.min_price} | Max: ₹{mandi.max_price}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Date: {mandi.arrival_date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                  ₹{mandi.modal_price.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ quintal</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
