import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  MapPin,
  Scale,
  BarChart2,
  Sparkles,
  Wheat,
  Bell,
  ShieldCheck,
  Bot,
  Wallet,
  CloudSun,
  User,
  LogIn
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';

export const NAV_ITEMS = [
  { path: '/dashboard', key: 'dashboard', label: 'Dashboard', icon: Home, emoji: '🏠' },
  { path: '/market', key: 'market', label: 'Live Mandi Prices', icon: TrendingUp, emoji: '📈' },
  { path: '/nearby-mandis', key: 'nearby', label: 'Nearby Mandis', icon: MapPin, emoji: '📍' },
  { path: '/comparison', key: 'comparison', label: 'Price Comparison', icon: Scale, emoji: '⚖️' },
  { path: '/historical', key: 'historical', label: 'Historical Analysis', icon: BarChart2, emoji: '📊' },
  { path: '/prediction', key: 'prediction', label: 'AI Price Prediction', icon: Sparkles, emoji: '🤖' },
  { path: '/sell-decision', key: 'sellDecision', label: 'Sell Decision', icon: Wheat, emoji: '🌾' },
  { path: '/expenses', key: 'expenses', label: 'Farm Expenses', icon: Wallet, emoji: '💰' },
  { path: '/weather', key: 'weather', label: 'Weather', icon: CloudSun, emoji: '🌦️' },
  { path: '/alerts', key: 'alerts', label: 'Price Alerts', icon: Bell, emoji: '🔔' },
  { path: '/ai-assistant', key: 'assistant', label: 'AI Assistant', icon: Bot, emoji: '💬' },
  { path: '/profile', key: 'profile', label: 'Farmer Profile', icon: User, emoji: '👤' }
];

export default function Sidebar({ onCloseMobile }) {
  const { alertsCount, filters } = useMarket();
  const { user, profile, selectedFarm } = useAuth();
  const { t } = useTranslation();

  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      {/* Brand & Identity */}
      <div className="sidebar-brand-box">
        <div className="sidebar-logo">
          <span style={{ fontSize: '1.4rem' }}>🌾</span>
          <span className="brand-title">{t('common.appName')}</span>
        </div>
        <p className="sidebar-tagline">
          {t('common.appTagline')}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                  }}
                >
                  <span className="nav-emoji">{item.emoji}</span>
                  <span className="nav-text">{t(`common.nav.${item.key}`, item.label)}</span>

                  {item.path === '/alerts' && alertsCount > 0 && (
                    <span className="nav-counter-badge">{alertsCount}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Authenticated Farmer Profile Chip / Quick Status */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '0 0.5rem' }}>
        {user ? (
          <Link
            to="/profile"
            onClick={() => { if (onCloseMobile) onCloseMobile(); }}
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff'
            }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'F'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Farmer Account'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFarm ? `🌾 ${selectedFarm.farm_name}` : 'Manage Farms'}
              </div>
            </div>
          </Link>
        ) : (
          <Link
            to="/login"
            onClick={() => { if (onCloseMobile) onCloseMobile(); }}
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--primary)',
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <LogIn size={15} /> Farmer Sign In
          </Link>
        )}
      </div>

      {/* Farmer Active Selection Info */}
      <div className="sidebar-crop-summary">
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 700, letterSpacing: '0.04em' }}>
          {t('common.badges.activeSelection')}
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
          🌾 {filters.commodity || 'Wheat'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.1rem' }}>
          {filters.district ? `${filters.district}, ${filters.state}` : filters.state}
        </div>
      </div>

      {/* Official Government Data Badge */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          <ShieldCheck size={14} color="var(--primary-mint)" />
          <span>{t('common.badges.verified')} Agmarknet</span>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.2rem' }}>
          40,309 Records &bull; 10-Yr Series
        </div>
      </div>
    </aside>
  );
}
