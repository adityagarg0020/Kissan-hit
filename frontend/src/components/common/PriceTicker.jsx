import React from 'react';
import { useMarket } from '../../context/MarketContext';
import { useTranslation } from '../../i18n';

const CROP_ICONS = {
  'paddy': '🌾',
  'wheat': '🌾',
  'rice': '🍚',
  'maize': '🌽',
  'banana': '🍌',
  'tomato': '🍅',
  'onion': '🧅',
  'potato': '🥔'
};

export function getCropIcon(commodity) {
  if (!commodity) return '🌾';
  const clean = commodity.toLowerCase();
  for (const [key, icon] of Object.entries(CROP_ICONS)) {
    if (clean.includes(key)) return icon;
  }
  return '🌾';
}

export default function PriceTicker() {
  const { tickerItems, loadingTicker } = useMarket();
  const { t, formatNumber } = useTranslation();

  if (loadingTicker && tickerItems.length === 0) {
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
