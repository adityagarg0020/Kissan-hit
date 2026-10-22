import React from 'react';
import { Menu, Bell, MapPin, Wheat, Cpu, User, LogIn, Layers } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useMarket } from '../../context/MarketContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { NAV_ITEMS } from './Sidebar';

export default function Navbar({ onToggleMobileMenu }) {
  const location = useLocation();
  const { filters, userLocation, alertsCount } = useMarket();
  const { user, profile, selectedFarm } = useAuth();
  const { t } = useTranslation();

  // Find active nav item
  const currentItem = NAV_ITEMS.find(item => item.path === location.pathname) || {
    key: 'dashboard',
    label: 'Kissan Saathi',
    emoji: '🌾'
  };

  const pageTitle = currentItem.key ? t(`common.nav.${currentItem.key}`, currentItem.label) : currentItem.label;

  return (
    <header className="app-top-navbar" aria-label="Header Bar">
      <div className="navbar-left">
        {/* Mobile menu hamburger button */}
        <button
          className="mobile-hamburger-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="navbar-title-group">
          <div className="navbar-current-page">
            <span style={{ marginRight: '0.4rem' }}>{currentItem.emoji}</span>
            <span>{pageTitle}</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Selected Farm Badge (if logged in and farm exists) */}
        {user && selectedFarm && (
          <Link
            to="/profile"
            className="navbar-badge"
            style={{ textDecoration: 'none', backgroundColor: '#eaf4eb', borderColor: '#b2d8b6', color: 'var(--primary-deep)', gap: '0.35rem' }}
            title={`Active Farm: ${selectedFarm.farm_name} (${selectedFarm.area} ${selectedFarm.area_unit})`}
          >
            <Layers size={13} color="var(--primary-deep)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFarm.farm_name}
            </span>
          </Link>
        )}

        {/* Quick Context Badges */}
        <div className="navbar-badge crop-badge">
          <Wheat size={14} color="var(--primary)" />
          <span>{filters.commodity || 'Wheat'}</span>
        </div>

        <div className="navbar-badge location-badge">
          <MapPin size={14} color="var(--primary)" />
          <span>
            {userLocation.displayName || (userLocation.district ? `${userLocation.district}, ${userLocation.state || 'India'}` : (filters.district ? `${filters.district}, ${filters.state || 'UP'}` : t('common.location.notSet')))}
          </span>
        </div>

        {/* Autonomous Learning Status Link */}
        <Link to="/prediction" className="navbar-badge" style={{ textDecoration: 'none', backgroundColor: '#e8f5e9', borderColor: '#c8e6c9', color: '#2e7d32', gap: '0.35rem' }} title="Autonomous ML Model Self-Training Active">
          <Cpu size={13} color="#2e7d32" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('common.badges.autoTrainOn')}</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0ca678' }} />
        </Link>

        {/* Alerts Link */}
        <Link to="/alerts" className="navbar-alert-btn" aria-label="View Alerts">
          <Bell size={18} />
          {alertsCount > 0 && <span className="alert-dot" />}
        </Link>

        {/* Auth Profile / Login Button */}
        {user ? (
          <Link
            to="/profile"
            className="navbar-badge"
            style={{
              textDecoration: 'none',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              borderColor: 'var(--primary-deep)',
              gap: '0.35rem',
              fontWeight: 700
            }}
            title="Farmer Profile & Settings"
          >
            <User size={14} />
            <span style={{ fontSize: '0.76rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name ? profile.full_name.split(' ')[0] : 'Farmer'}
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="btn btn-primary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'none',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            <LogIn size={13} />
            <span>Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
