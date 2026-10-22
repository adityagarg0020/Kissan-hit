import React, { useEffect, useState } from 'react';
import { useTranslation } from '../i18n';
import { getCropIcon } from './common/PriceTicker';

export default function LivePriceTicker() {
  const [tickerItems, setTickerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, formatNumber } = useTranslation();

  useEffect(() => {
    const loadTicker = () => {
      fetch('/api/market/ticker')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.ticker) {
            setTickerItems(data.ticker);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch ticker:', err);
          setLoading(false);
        });
    };

    loadTicker();
    const interval = setInterval(loadTicker, 45000); // Poll every 45s for fresh arrivals
    return () => clearInterval(interval);
  }, []);

  if (loading && tickerItems.length === 0) {
    return (
      <div className="ticker-bar">
        <div style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#a3b899' }}>
          {t('common.ticker.loading')}
        </div>
      </div>
    );
  }

  if (tickerItems.length === 0) {
    return null;
  }

  // Duplicate items for seamless continuous looping
  const displayItems = [...tickerItems, ...tickerItems];

  return (
    <div className="ticker-bar" aria-label={t('common.ticker.ariaLabel')}>
      <div className="ticker-track-wrapper">
        <div className="ticker-track">
          {displayItems.map((item, idx) => {
            const cropIcon = getCropIcon(item.commodity);

            return (
              <div className="ticker-item" key={`${item.commodity}-${idx}`}>
                <span className="ticker-crop">{cropIcon} {item.commodity}</span>
                <span className="ticker-price">₹{formatNumber(item.modal_price)}{item.unit}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
